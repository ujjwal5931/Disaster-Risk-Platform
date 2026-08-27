import hashlib
import base64

MOCK_SECRET = "drips-demo-secret-2026"


def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return get_password_hash(plain) == hashed


def create_mock_token(username: str, role: str) -> str:
    payload = f"{username}:{role}:{MOCK_SECRET}"
    return base64.b64encode(payload.encode()).decode()


def decode_mock_token(token: str) -> dict:
    try:
        decoded = base64.b64decode(token.encode()).decode()
        parts = decoded.split(":")
        if len(parts) >= 3 and parts[2] == MOCK_SECRET:
            return {"username": parts[0], "role": parts[1]}
    except Exception:
        pass
    return {"username": "viewer", "role": "viewer"}
