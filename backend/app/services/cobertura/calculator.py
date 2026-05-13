"""Cálculo de la matriz de cobertura para un snapshot.

balance(t) = inventario_inicial
           + Σ producción(t' ≤ t)
           + Σ compras(eta ≤ t)
           − Σ demanda(t' ≤ t)

Para cambiar la fórmula, edita la función `calcular_balance`.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime
from typing import Iterable

from sqlalchemy.orm import Session

from app.models import Compra, Demanda, Inventario, Planta, Producto, Produccion
from app.schemas.cobertura import CoberturaCell, CoberturaMatrix, CoberturaRow
from app.services.cobertura.bucketing import bucket_de, generar_buckets
from app.services.cobertura.coloring import colorear


def _agg_por(producto_planta_bucket: dict, rows: Iterable, planta_filter: str | None, granularidad: str, get_fecha):
    """Acumula cantidades en un dict[(producto_id, planta_codigo, bucket)] -> float."""
    for r in rows:
        if planta_filter and r["planta"] != planta_filter:
            continue
        b = bucket_de(get_fecha(r), granularidad)
        producto_planta_bucket[(r["producto_id"], r["planta"], b)] += float(r["cantidad"])


def calcular_matriz(
    db: Session,
    snapshot_id: int,
    granularidad: str = "semanal",
    planta: str = "TODAS",
    n_buckets: int = 12,
    fecha_inicio: date | None = None,
) -> CoberturaMatrix:
    """Construye la CoberturaMatrix lista para enviar al frontend."""

    # ── 1. Trae filas de los 4 datasets ────────────────────────────────────────
    inv_rows = (
        db.query(Inventario, Producto, Planta)
        .join(Producto, Inventario.producto_id == Producto.id)
        .join(Planta, Inventario.planta_id == Planta.id)
        .filter(Inventario.snapshot_id == snapshot_id)
        .all()
    )
    prod_rows = (
        db.query(Produccion, Producto, Planta)
        .join(Producto, Produccion.producto_id == Producto.id)
        .join(Planta, Produccion.planta_id == Planta.id)
        .filter(Produccion.snapshot_id == snapshot_id)
        .all()
    )
    com_rows = (
        db.query(Compra, Producto, Planta)
        .join(Producto, Compra.producto_id == Producto.id)
        .join(Planta, Compra.planta_id == Planta.id)
        .filter(Compra.snapshot_id == snapshot_id)
        .all()
    )
    dem_rows = (
        db.query(Demanda, Producto)
        .join(Producto, Demanda.producto_id == Producto.id)
        .filter(Demanda.snapshot_id == snapshot_id)
        .all()
    )

    # ── 2. Fecha de inicio = mínima entre inventarios e hoy ───────────────────
    if fecha_inicio is None:
        candidatas = [i.fecha for i, _, _ in inv_rows] or [datetime.today().date()]
        fecha_inicio = min(candidatas)

    buckets = generar_buckets(fecha_inicio, granularidad, n_buckets)

    # ── 3. Catálogo de productos involucrados ─────────────────────────────────
    productos: dict[int, Producto] = {}
    for tup in (inv_rows, prod_rows, com_rows):
        for r in tup:
            productos[r[1].id] = r[1]
    for d, p in dem_rows:
        productos[p.id] = p

    # ── 4. Acumular por (producto, planta, bucket) ────────────────────────────
    planta_filter = None if planta.upper() == "TODAS" else planta.upper()

    def by_planta(rows_orm, fecha_attr):
        agg: dict = defaultdict(float)
        for orm, prod, plt in rows_orm:
            if planta_filter and plt.codigo != planta_filter:
                continue
            b = bucket_de(getattr(orm, fecha_attr), granularidad)
            agg[(prod.id, b)] += float(orm.cantidad)
        return agg

    inv_agg = by_planta(inv_rows, "fecha")
    prod_agg = by_planta(prod_rows, "fecha")
    com_agg = by_planta(com_rows, "eta")

    # Demanda no tiene planta — se prorratea como "todas las plantas"
    dem_agg: dict = defaultdict(float)
    for orm, prod in dem_rows:
        b = bucket_de(orm.fecha, granularidad)
        dem_agg[(prod.id, b)] += float(orm.cantidad)

    # ── 5. Construir filas de la matriz ───────────────────────────────────────
    filas_out: list[CoberturaRow] = []
    for prod_id in sorted(productos.keys(), key=lambda i: productos[i].sku):
        prod = productos[prod_id]

        # Balance acumulado con todas las fuentes
        bal_total = 0.0
        bal_sin_compras = 0.0
        bal_solo_inv = 0.0
        celdas: list[CoberturaCell] = []

        for b in buckets:
            inv = inv_agg.get((prod_id, b), 0.0)
            prd = prod_agg.get((prod_id, b), 0.0)
            com = com_agg.get((prod_id, b), 0.0)
            dem = dem_agg.get((prod_id, b), 0.0)

            bal_total += inv + prd + com - dem
            bal_sin_compras += inv + prd - dem
            bal_solo_inv += inv - dem

            color = colorear(bal_total, bal_sin_compras, bal_solo_inv)
            celdas.append(CoberturaCell(balance=round(bal_total, 2), color=color))

        filas_out.append(
            CoberturaRow(
                producto_id=prod.id,
                sku=prod.sku,
                producto=prod.nombre,
                unidad=prod.unidad,
                celdas=celdas,
            )
        )

    return CoberturaMatrix(
        snapshot_id=snapshot_id,
        granularidad=granularidad,
        planta=planta.upper(),
        buckets=buckets,
        filas=filas_out,
    )
