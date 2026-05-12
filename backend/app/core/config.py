from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg://oleolab:oleolab_dev@db:5432/oleolab_coberturas"
    JWT_SECRET: str = "change-me-in-production-please-32chars+"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173"

    SEED_ADMIN_EMAIL: str = "orlando@logiqbi.com"
    SEED_CLIENT_EMAIL: str = "cliente.demo@oleolab.com"
    SEED_PASSWORD: str = "Oleolab2026!"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
