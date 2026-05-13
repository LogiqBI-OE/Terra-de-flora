"""Router: descarga de templates Excel."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.core.deps import get_current_user
from app.models.user import User
from app.services.excel_templates import TEMPLATES, generar_template

router = APIRouter(prefix="/templates", tags=["templates"])

_MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/{tipo}.xlsx")
def descargar_template(tipo: str, _: User = Depends(get_current_user)) -> Response:
    if tipo not in TEMPLATES:
        raise HTTPException(404, f"Template '{tipo}' no existe. Opciones: {list(TEMPLATES.keys())}")
    contenido = generar_template(tipo)
    return Response(
        content=contenido,
        media_type=_MIME_XLSX,
        headers={"Content-Disposition": f'attachment; filename="template_{tipo}.xlsx"'},
    )


@router.get("/")
def listar_templates(_: User = Depends(get_current_user)) -> dict:
    """Devuelve el catálogo de templates disponibles + sus columnas (para el frontend)."""
    return {
        tipo: {"columnas": spec["columnas"]}
        for tipo, spec in TEMPLATES.items()
    }
