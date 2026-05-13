"""Validadores por tipo de dataset.

Cada módulo expone:
  - `COLUMNAS: list[str]` (debe coincidir con excel_templates.TEMPLATES[<tipo>][\"columnas\"])
  - `validar_y_construir(row, ctx) -> tuple[Optional[ORM_object], Optional[str_error]]`

Donde `ctx` contiene los caches de productos/plantas/customers para evitar N queries.
"""
