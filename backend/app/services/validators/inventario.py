"""Validador: filas de inventario."""
from app.models import Inventario
from app.services.validators.common import ValidationContext, to_date, to_float, to_str

COLUMNAS = ["SKU", "Producto", "Planta", "Fecha", "Cantidad", "Unidad"]


def validar_y_construir(row: dict, snapshot_id: int, ctx: ValidationContext) -> Inventario:
    sku = to_str(row.get("SKU"))
    nombre = to_str(row.get("Producto"))
    planta_codigo = to_str(row.get("Planta"))
    fecha = to_date(row.get("Fecha"))
    cantidad = to_float(row.get("Cantidad"))
    unidad = to_str(row.get("Unidad"), required=False) or "kg"

    producto = ctx.get_or_create_producto(sku, nombre, unidad)
    planta = ctx.get_or_create_planta(planta_codigo)

    return Inventario(
        snapshot_id=snapshot_id,
        producto_id=producto.id,
        planta_id=planta.id,
        fecha=fecha,
        cantidad=cantidad,
    )
