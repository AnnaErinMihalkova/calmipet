import os
import base64
import hashlib
from typing import Tuple

def gen_salt(length: int = 16) -> str:
    return base64.b64encode(os.urandom(length)).decode('utf-8')

def hash_password(password: str, salt: str) -> str:
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100_000)
    return base64.b64encode(dk).decode('utf-8')

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    return hash_password(password, salt) == expected_hash

def make_token_for_user(user_id: int) -> str:
    return f"uid:{user_id}"

def parse_user_id_from_token(token: str) -> int | None:
    try:
        if token.startswith("Bearer "):
            token = token.split(" ", 1)[1]
        if token.startswith("uid:"):
            return int(token.split(":", 1)[1])
    except:
        return None
    return None
