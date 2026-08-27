from fastapi import APIRouter
from app.models.schemas import BaseResponse, LoginRequest
from app.database import execute_one
from app.core.auth import verify_password, create_mock_token

router = APIRouter()


@router.post("/login", response_model=BaseResponse)
def login(req: LoginRequest):
    user = execute_one("SELECT * FROM users WHERE username = ?", (req.username,))
    if not user:
        return BaseResponse(success=False, message="Invalid credentials")
    if not verify_password(req.password, user["password"]):
        return BaseResponse(success=False, message="Invalid credentials")
    token = create_mock_token(user["username"], user["role"])
    return BaseResponse(data={
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name", user["username"]),
        "region": user.get("region", "All India"),
    }, message="Login successful")
