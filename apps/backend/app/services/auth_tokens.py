from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

from app.config import load_config

ALGORITHM = "HS256"


def create_session_token(email: str, keep_signed_in: bool) -> str:
    config = load_config()

    expires_delta = timedelta(days=30) if keep_signed_in else timedelta(hours=8)

    now = datetime.now(timezone.utc)
    payload = {
        "sub": email.strip().lower(),
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }

    return jwt.encode(payload, config["jwt_secret"], algorithm=ALGORITHM)


def decode_session_token(token: str) -> str | None:
    config = load_config()

    try:
        payload = jwt.decode(token, config["jwt_secret"], algorithms=[ALGORITHM])
        email = payload.get("sub")
        return email.strip().lower() if email else None
    except JWTError:
        return None