from pydantic import BaseModel
from typing import Optional

class DataPayload(BaseModel):
    heart_rate: int
    spo2: int
    stress_level: Optional[float] = None

class AnalyzePayload(BaseModel):
    heart_rate: int
    spo2: Optional[int] = None

class User(BaseModel):
    id: int
    username: str
    email: str

class LoginPayload(BaseModel):
    email: str
    password: str

class SignupPayload(BaseModel):
    email: str
    username: str
    password: str
