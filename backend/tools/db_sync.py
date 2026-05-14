"""Copia datos de una Postgres SOURCE a otra TARGET.

Workflow tipico:
  - Trabajas en DEV (backend de Railway apuntando a DB_Postgre_Dev)
  - Llenas catalogos, recetas, clientes, etc.
  - Cuando estes listo: corres este script con SOURCE=DEV y TARGET=PROD
  - Cambias el DATABASE_URL del backend en Railway a PROD
  - Listo.

Uso (Windows PowerShell):
  cd backend
  $env:SOURCE_URL="postgresql://...DEV..."
  $env:TARGET_URL="postgresql://...PROD..."
  python -m tools.db_sync                 # modo seguro (skip duplicados)
  python -m tools.db_sync --clean         # TRUNCATE target primero, copia limpia
  python -m tools.db_sync --tables=clientes,proveedores  # solo algunas tablas
  python -m tools.db_sync --dry-run       # solo cuenta filas, no inserta

Notas:
  - El SCHEMA del target se asegura via Base.metadata.create_all (idempotente).
  - Inserta en orden topologico (FKs primero los padres).
  - Despues de copiar, hace setval() en las sequences para que los proximos
    inserts no choquen con IDs ya copiados.
  - NUNCA borra datos del SOURCE.
  - Para conectarse desde local, ambos Postgres deben tener "Public Networking"
    habilitado temporalmente en Railway. Apagalo despues por seguridad.
"""
from __future__ import annotations

import argparse
import os
import sys
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

# Asegura que los modelos esten registrados en Base.metadata
from app import models  # noqa: F401
from app.db import Base, _normalize_db_url


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Copia datos entre Postgres SOURCE -> TARGET")
    p.add_argument("--clean", action="store_true",
                   help="TRUNCATE las tablas del target antes de copiar (irreversible).")
    p.add_argument("--tables", default="",
                   help="Lista de tablas separadas por coma. Default: todas.")
    p.add_argument("--dry-run", action="store_true",
                   help="No inserta nada, solo cuenta filas a copiar.")
    p.add_argument("--yes", action="store_true",
                   help="Saltarse el prompt de confirmacion (peligroso con --clean).")
    return p.parse_args()


def confirm(msg: str, default_yes: bool = False) -> bool:
    suffix = " [Y/n]" if default_yes else " [y/N]"
    while True:
        resp = input(msg + suffix + " ").strip().lower()
        if not resp:
            return default_yes
        if resp in ("y", "yes", "si", "s"):
            return True
        if resp in ("n", "no"):
            return False


def main() -> int:
    args = parse_args()
    source_url = os.environ.get("SOURCE_URL")
    target_url = os.environ.get("TARGET_URL")
    if not source_url or not target_url:
        print("ERROR: Define SOURCE_URL y TARGET_URL como env vars.")
        return 1
    if source_url == target_url:
        print("ERROR: SOURCE y TARGET no pueden ser la misma URL.")
        return 1

    src_engine = create_engine(_normalize_db_url(source_url))
    tgt_engine = create_engine(_normalize_db_url(target_url))

    print(f"SOURCE: {_mask_url(source_url)}")
    print(f"TARGET: {_mask_url(target_url)}")
    print()

    # Asegura schema en el target
    print("-> Asegurando schema en TARGET (create_all idempotente)...")
    Base.metadata.create_all(bind=tgt_engine)

    # Filtra tablas si se pidió
    all_tables = list(Base.metadata.sorted_tables)
    if args.tables:
        wanted = {t.strip() for t in args.tables.split(",") if t.strip()}
        all_tables = [t for t in all_tables if t.name in wanted]
        unknown = wanted - {t.name for t in Base.metadata.sorted_tables}
        if unknown:
            print(f"AVISO: tablas desconocidas (ignoradas): {unknown}")

    print(f"-> Tablas a procesar ({len(all_tables)}): {[t.name for t in all_tables]}")

    # Confirmacion para --clean
    if args.clean and not args.yes:
        if not confirm("\n⚠️  --clean TRUNCATEa TODAS esas tablas en el TARGET. ¿Continuar?"):
            print("Cancelado.")
            return 0

    # TRUNCATE si se pidió
    if args.clean and not args.dry_run:
        print("\n-> TRUNCATE en TARGET...")
        with tgt_engine.begin() as conn:
            # Orden inverso (hijos primero) + CASCADE por seguridad
            for table in reversed(all_tables):
                try:
                    conn.execute(text(f'TRUNCATE TABLE "{table.name}" RESTART IDENTITY CASCADE'))
                    print(f"   ✓ {table.name}")
                except SQLAlchemyError as e:
                    print(f"   ✗ {table.name}: {e}")

    # Copia tabla por tabla
    print("\n-> Copiando datos...")
    total_inserted = 0
    total_skipped = 0

    with Session(src_engine) as src_sess, tgt_engine.begin() as tgt_conn:
        for table in all_tables:
            rows = [dict(r) for r in src_sess.execute(table.select()).mappings()]
            n = len(rows)
            if n == 0:
                print(f"  {table.name:20s} : 0 rows")
                continue

            if args.dry_run:
                print(f"  {table.name:20s} : {n} rows (dry-run)")
                continue

            # ON CONFLICT DO NOTHING en PK = skip duplicados (idempotente)
            pk_cols = [c.name for c in table.primary_key.columns]
            try:
                stmt = pg_insert(table).values(rows)
                if pk_cols:
                    stmt = stmt.on_conflict_do_nothing(index_elements=pk_cols)
                result = tgt_conn.execute(stmt)
                inserted = result.rowcount if result.rowcount is not None else n
                skipped = n - inserted
                total_inserted += inserted
                total_skipped += skipped
                print(f"  {table.name:20s} : {inserted}/{n} insertadas"
                      + (f", {skipped} omitidas (duplicadas)" if skipped > 0 else ""))
            except SQLAlchemyError as e:
                print(f"  {table.name:20s} : ERROR {e}")
                raise

    if args.dry_run:
        print("\nDry-run terminado.")
        return 0

    # Reset sequences para autoincrementables (evita PK colision en proximos inserts)
    print("\n-> Reset de sequences en TARGET...")
    with tgt_engine.begin() as conn:
        for table in all_tables:
            for col in table.columns:
                if col.primary_key and col.autoincrement:
                    seq = f"{table.name}_{col.name}_seq"
                    try:
                        conn.execute(text(
                            f"SELECT setval(pg_get_serial_sequence(:t, :c), "
                            f"COALESCE((SELECT MAX({col.name}) FROM \"{table.name}\"), 1), true)"
                        ), {"t": table.name, "c": col.name})
                    except SQLAlchemyError:
                        # No todos los engines tienen pg_get_serial_sequence; ignora.
                        pass

    print(f"\n✓ Listo. {total_inserted} insertadas, {total_skipped} omitidas (ya existian).")
    return 0


def _mask_url(url: str) -> str:
    """Oculta el password en la URL para logs."""
    if "@" not in url:
        return url
    proto_creds, host_db = url.split("@", 1)
    if "//" in proto_creds:
        proto, creds = proto_creds.split("//", 1)
        if ":" in creds:
            user = creds.split(":", 1)[0]
            return f"{proto}//{user}:***@{host_db}"
    return url


if __name__ == "__main__":
    sys.exit(main())
