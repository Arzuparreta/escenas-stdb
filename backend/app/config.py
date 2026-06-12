from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    stdbkit_db_path: Path = Path("data/cinema.db")
    youtube_playlist_url: str = ""
    stdbkit_secret: str | None = None
    relay_interval_sec: int = 30
    webhook_host: str = "127.0.0.1"
    webhook_port: int = 8787
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
