from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole | None = None  # opcional — el toggle del frontend se quita


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    email: EmailStr
    full_name: str | None = None
    level: int
    level_label: str
    permissions: list[str]


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    role: UserRole
    level: int
    permissions: list[str]
    is_active: bool

    model_config = {"from_attributes": True}
