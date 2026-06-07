from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)
    nickname = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    role = Column(String(20), nullable=False, default="user")
    is_blocked = Column(Boolean, nullable=False, default=False)
    avatar_url = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen  = Column(DateTime(timezone=True), nullable=True)


class Track(Base):
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    genre = Column(String(100), nullable=True)
    mood = Column(String(100), nullable=True)

    bpm = Column(Integer, nullable=True)
    key = Column(String(20), nullable=True)

    price = Column(Numeric(10, 2), nullable=False)

    duration = Column(Integer, nullable=True)

    image_url = Column(String, nullable=True)
    demo_file_url = Column(String, nullable=True)
    full_file_url = Column(String, nullable=True)
    description = Column(String, nullable=True)

    is_sold = Column(Boolean, nullable=False, default=False)
    buyer_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    buyer = relationship("User", foreign_keys=[buyer_user_id])

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    user = relationship("User")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False)

    cart = relationship("Cart", back_populates="items")
    track = relationship("Track")

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    track = relationship("Track")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


    