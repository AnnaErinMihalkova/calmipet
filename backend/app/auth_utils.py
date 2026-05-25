import base64
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt  # pip install PyJWT

LEGACY_PBKDF2_ITERATIONS = 100_000
 
# --------------------------------------------------------------------------- 
# Configuration — set JWT_SECRET in your environment; never hard-code this. 
# --------------------------------------------------------------------------- 
JWT_SECRET: str = os.environ.get("JWT_SECRET", "CHANGE_ME_BEFORE_PRODUCTION") 
JWT_ALGORITHM: str = "HS256" 
JWT_EXPIRY_HOURS: int = int(os.environ.get("JWT_EXPIRY_HOURS", "24")) 
 
 
# --------------------------------------------------------------------------- 
# Password hashing 
# --------------------------------------------------------------------------- 
 
def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def generate_salt() -> str:
    return secrets.token_hex(16)


def _is_modern_hex_hash(stored_hash: str) -> bool:
    return (
        len(stored_hash) == 64
        and all(ch in "0123456789abcdefABCDEF" for ch in stored_hash)
    )


def generate_salt_legacy(length: int = 16) -> str:
    return base64.b64encode(os.urandom(length)).decode("utf-8")


def hash_password_legacy(password: str, salt: str) -> str:
    """PBKDF2-SHA256 + base64, used before the hex SHA256 scheme."""
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        LEGACY_PBKDF2_ITERATIONS,
    )
    return base64.b64encode(dk).decode("utf-8")


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    if not salt or not expected_hash:
        return False
    if _is_modern_hex_hash(expected_hash):
        return hash_password(password, salt) == expected_hash
    return hash_password_legacy(password, salt) == expected_hash


def is_legacy_password_record(stored_hash: str) -> bool:
    return bool(stored_hash) and not _is_modern_hex_hash(stored_hash)

# --------------------------------------------------------------------------- 
# Token creation & parsing — now uses real JWTs (#1) 
# --------------------------------------------------------------------------- 
 
def make_token_for_user(user_id: int) -> str: 
    """Return a signed JWT containing the user id with an expiry.""" 
    payload = { 
        "sub": str(user_id), 
        "iat": datetime.now(timezone.utc), 
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS), 
    } 
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM) 
 
 
def parse_user_id_from_token(auth_header: str) -> int | None: 
    """ 
    Validate a Bearer JWT and return the user id, or None on any failure. 
    Replaces bare except: with specific exception types (#2). 
    """ 
    if not auth_header: 
        return None 
    parts = auth_header.split() 
    if len(parts) != 2 or parts[0].lower() != "bearer": 
        return None 
    token = parts[1] 
    try: 
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM]) 
        return int(payload["sub"]) 
    except jwt.ExpiredSignatureError: 
        return None 
    except jwt.InvalidTokenError: 
        return None 
    except (KeyError, ValueError): 
        return None