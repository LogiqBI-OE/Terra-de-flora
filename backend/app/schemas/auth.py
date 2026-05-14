from pydantic import BaseModel

from app.models.user import UserRole


class LoginRequest(BaseModel):
    # Acepta email o username. El backend resuelve cual es cual.
    identifier: str
    password: str
    role: UserRole | None = None  # opcional — el toggle del frontend se quita


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    email: str
    username: str | None = None
    full_name: str | None = None
    level: int
    level_label: str
    permissions: list[str]


class UserOut(BaseModel):
    id: int
    email: str
    username: str | None = None
    full_name: str | None
    role: UserRole
    level: int
    permissions: list[str]
    is_active: bool

    model_config = {"from_attributes": True}
