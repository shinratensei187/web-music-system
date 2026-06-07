from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, EmailStr, model_validator
from typing import List
from datetime import datetime


class UserRegister(BaseModel):
    name: Optional[str] = ""
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: Optional[str] = ""
    nickname: Optional[str] = None
    email: EmailStr
    role: str
    is_blocked: bool
    avatar_url: Optional[str] = None
    last_seen: Optional[datetime] = None

    @model_validator(mode='after')
    def set_default_nickname(self):
        if not self.nickname:
            self.nickname = self.email.split('@')[0]
        return self

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    nickname: Optional[str] = None


class ChangeEmail(BaseModel):
    new_email: EmailStr
    current_password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TrackCreate(BaseModel):
    title: str
    genre: Optional[str] = None
    mood: Optional[str] = None
    bpm: Optional[int] = None
    key: Optional[str] = None
    price: Decimal
    duration: Optional[int] = None
    image_url: Optional[str] = None
    demo_file_url: Optional[str] = None
    full_file_url: Optional[str] = None
    description: Optional[str] = None


class TrackResponse(TrackCreate):
    id: int
    created_at: datetime
    is_sold: bool = False

    class Config:
        from_attributes = True

class CartItemResponse(BaseModel):
    id: int
    track: TrackResponse

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse]

    class Config:
        from_attributes = True

class PurchaseItemResponse(BaseModel):
    id: int
    track: TrackResponse

    class Config:
        from_attributes = True


class PurchaseResponse(BaseModel):
    id: int
    user_id: int
    items: List[PurchaseItemResponse]

    class Config:
        from_attributes = True

class MyTrackResponse(TrackResponse):
    purchased_at: datetime


class CommentAuthor(BaseModel):
    id: int
    nickname: Optional[str] = None
    name: Optional[str] = None
    email: str
    avatar_url: Optional[str] = None

    @model_validator(mode='after')
    def set_default_nickname(self):
        if not self.nickname:
            self.nickname = self.email.split('@')[0]
        return self

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: int
    track_id: int
    content: str
    created_at: datetime
    user: CommentAuthor

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str