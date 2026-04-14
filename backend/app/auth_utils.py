""" 
auth_utils.py — Fixed version 
Changes (audit items #1, #2): 
  - Token is now a signed JWT (PyJWT) with expiry instead of a plain "uid:N" string 
  - Bare except: replaced with specific exception types 
""" 
 
import os 
import hashlib 
import secrets 
from datetime import datetime, timedelta, timezone 
 
import jwt  # pip install PyJWT 
 
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
 
def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    return hash_password(password, salt) == expected_hash

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