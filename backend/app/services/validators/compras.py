"""Validador: filas de compras (órdenes en tránsito)."""
from app.models import Compra
from app.services.validators.common import ValidationContext, to_date, to_float, to_str

COLUMNAS = ["SKU", "Producto", "Planta", "OC", "ETA", "Cantidad"]


def validar_y_construir(row: dict, snapshot_id: int, ctx: ValidationContext) -> Compra:
    sku = to_str(row.get("SKU"))
    nombre = to_str(row.get("Producto"))
    planta_codigo = to_str(row.get("Planta"))
    oc = to_str(row.get("OC"), required=False) or None
    eta = to_date(row.get("ETA"))
    cantidad = to_float(row.get("Cantidad"))

    producto = ctx.get_or_create_producto(sku, nombre)
    planta = ctx.get_or_create_planta(planta_codigo)

    return Compra(
        snapshot_id=snapshot_id,
        producto_id=producto.id,
        planta_id=planta.id,
        oc=oc,
        eta=eta,
        cantidad=cantidad,
    )
