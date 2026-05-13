"""Validador: filas de demanda (por customer)."""
from app.models import Demanda
from app.services.validators.common import ValidationContext, to_date, to_float, to_str

COLUMNAS = ["SKU", "Producto", "Cliente", "Fecha", "Cantidad"]


def validar_y_construir(row: dict, snapshot_id: int, ctx: ValidationContext) -> Demanda:
    sku = to_str(row.get("SKU"))
    nombre = to_str(row.get("Producto"))
    cliente_codigo = to_str(row.get("Cliente"))
    fecha = to_date(row.get("Fecha"))
    cantidad = to_float(row.get("Cantidad"))

    producto = ctx.get_or_create_producto(sku, nombre)
    customer = ctx.get_or_create_customer(cliente_codigo)

    return Demanda(
        snapshot_id=snapshot_id,
        producto_id=producto.id,
        customer_id=customer.id,
        fecha=fecha,
        cantidad=cantidad,
    )
