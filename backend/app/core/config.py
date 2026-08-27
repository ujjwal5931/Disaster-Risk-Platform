from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Disaster Risk Intelligence Platform"
    secret_key: str = "supersecretkey12345"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    demo_disclaimer: str = "Demonstration data only. Not for operational use."

settings = Settings()
