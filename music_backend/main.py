from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, relationship
from typing import List
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
import mimetypes

from database import Base, engine, get_db
from models import User, Track, Cart, CartItem, Purchase, PurchaseItem, Comment
from schemas import UserRegister, UserLogin, UserResponse, TokenResponse, UserUpdate, ChangeEmail, ChangePassword
from schemas import TrackCreate, TrackResponse, CartResponse, PurchaseResponse, CommentCreate, CommentResponse
from auth import hash_password, verify_password, create_access_token
from auth import get_current_user, require_admin, get_optional_user
from sqlalchemy.sql import func
import os
import shutil
from fastapi import UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from schemas import MyTrackResponse
import stripe


from dotenv import load_dotenv
load_dotenv()

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8001")

Base.metadata.create_all(bind=engine)

from fastapi import FastAPI
from sqlalchemy import text


app = FastAPI()  # ← СНАЧАЛА создаём app

@app.on_event("startup")
def run_migrations():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100)"))
        conn.execute(text("ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE tracks ADD COLUMN IF NOT EXISTS buyer_user_id INTEGER REFERENCES users(id)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ"))
        conn.execute(text("ALTER TABLE tracks ADD COLUMN IF NOT EXISTS description TEXT"))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content VARCHAR(200) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        conn.commit()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Music Store API is working"}


@app.post("/auth/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует"
        )

    new_user = User(
        name=user_data.name or "",
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/auth/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Неверный email или пароль"
        )

    if user.is_blocked:
        raise HTTPException(
            status_code=403,
            detail="Ваш аккаунт заблокирован"
        )

    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Неверный email или пароль"
        )

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.patch("/auth/me", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.nickname is not None:
        current_user.nickname = data.nickname.strip() or None
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/auth/change-email", response_model=UserResponse)
def change_email(
    data: ChangeEmail,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Невірний поточний пароль")
    existing = db.query(User).filter(User.email == data.new_email).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Email вже використовується")
    current_user.email = data.new_email
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/auth/change-password")
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Невірний поточний пароль")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Пароль має містити мінімум 6 символів")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Пароль змінено"}


@app.post("/auth/avatar", response_model=UserResponse)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    os.makedirs("uploads/images", exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"avatar_{current_user.id}{ext}"
    path = f"uploads/images/{filename}"
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    current_user.avatar_url = f"{BACKEND_URL}/{path}"
    db.commit()
    db.refresh(current_user)
    return current_user


@app.get("/admin/test")
def admin_test(admin: User = Depends(require_admin)):
    return {
        "message": "Ты админ",
        "admin_email": admin.email
    }

@app.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    now = datetime.now(timezone.utc)

    def get_period_stats(since=None):
        def apply_filter(q):
            return q.filter(Purchase.created_at >= since) if since else q

        income = float(
            apply_filter(
                db.query(func.coalesce(func.sum(Track.price), 0))
                .join(PurchaseItem, PurchaseItem.track_id == Track.id)
                .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
            ).scalar()
        )

        unique_buyers = (
            apply_filter(
                db.query(func.count(func.distinct(Purchase.user_id)))
                .join(PurchaseItem, PurchaseItem.purchase_id == Purchase.id)
            ).scalar() or 0
        )

        sold_tracks = (
            apply_filter(
                db.query(func.count(PurchaseItem.id))
                .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
            ).scalar() or 0
        )

        top_rows = (
            apply_filter(
                db.query(
                    Track.id,
                    Track.title,
                    Track.genre,
                    Track.price,
                    func.count(PurchaseItem.id).label("sales_count"),
                    func.sum(Track.price).label("income")
                )
                .join(PurchaseItem, PurchaseItem.track_id == Track.id)
                .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
            )
            .group_by(Track.id)
            .order_by(func.count(PurchaseItem.id).desc())
            .limit(5)
            .all()
        )

        return {
            "unique_buyers": unique_buyers,
            "total_income": income,
            "sold_tracks": sold_tracks,
            "top_tracks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "genre": t.genre,
                    "price": float(t.price),
                    "sales_count": t.sales_count,
                    "income": float(t.income)
                }
                for t in top_rows
            ]
        }

    return {
        "periods": {
            "day":   get_period_stats(now - timedelta(days=1)),
            "week":  get_period_stats(now - timedelta(weeks=1)),
            "month": get_period_stats(now - timedelta(days=30)),
            "total": get_period_stats()
        }
    }

@app.post("/tracks", response_model=TrackResponse)
def create_track(
    track_data: TrackCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    new_track = Track(**track_data.model_dump())

    db.add(new_track)
    db.commit()
    db.refresh(new_track)

    return new_track


@app.get("/tracks", response_model=List[TrackResponse])
def get_tracks(db: Session = Depends(get_db)):
    tracks = db.query(Track).filter(Track.is_sold == False).all()
    return tracks


@app.get("/tracks/{track_id}", response_model=TrackResponse)
def get_track(
    track_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    track = db.query(Track).filter(Track.id == track_id).first()

    if not track:
        raise HTTPException(status_code=404, detail="Трек не найден")

    if track.is_sold:
        is_buyer = current_user and current_user.id == track.buyer_user_id
        is_admin = current_user and current_user.role == "admin"
        if not (is_buyer or is_admin):
            raise HTTPException(
                status_code=403,
                detail="Цей трек вже придбано іншим користувачем"
            )

    return track


@app.delete("/tracks/{track_id}")
def delete_track(
    track_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    track = db.query(Track).filter(Track.id == track_id).first()

    if not track:
        raise HTTPException(
            status_code=404,
            detail="Трек не знайдено"
        )

    try:
        # Видаляємо трек з кошиків користувачів
        db.query(CartItem).filter(
            CartItem.track_id == track_id
        ).delete(synchronize_session=False)

        # Видаляємо зв'язки з покупками
        db.query(PurchaseItem).filter(
            PurchaseItem.track_id == track_id
        ).delete(synchronize_session=False)

        # Видаляємо сам трек
        db.delete(track)
        db.commit()

        return {"message": "Трек видалено"}

    except Exception as e:
        db.rollback()
        print("DELETE TRACK ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail="Помилка видалення треку"
        )

@app.get("/cart", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart


@app.post("/cart/{track_id}", response_model=CartResponse)
def add_to_cart(
    track_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    track = db.query(Track).filter(Track.id == track_id).first()

    if not track:
        raise HTTPException(status_code=404, detail="Трек не найден")

    if track.is_sold:
        raise HTTPException(status_code=400, detail="Цей трек вже придбано іншим користувачем")

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.track_id == track_id
    ).first()

    if existing_item:
        raise HTTPException(status_code=400, detail="Трек уже в корзине")

    item = CartItem(cart_id=cart.id, track_id=track_id)
    db.add(item)
    db.commit()
    db.refresh(cart)

    return cart


@app.delete("/cart/{track_id}", response_model=CartResponse)
def remove_from_cart(
    track_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart:
        raise HTTPException(status_code=404, detail="Корзина не найдена")

    item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.track_id == track_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Трека нет в корзине")

    db.delete(item)
    db.commit()
    db.refresh(cart)

    return cart



@app.post("/purchase", response_model=PurchaseResponse)
def create_purchase(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart or len(cart.items) == 0:
        raise HTTPException(
            status_code=400,
            detail="Корзина пустая"
        )

    purchase = Purchase(user_id=current_user.id)
    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    for item in cart.items:
        purchase_item = PurchaseItem(
            purchase_id=purchase.id,
            track_id=item.track_id
        )
        db.add(purchase_item)

        track = db.query(Track).filter(Track.id == item.track_id).first()
        if track:
            track.is_sold = True
            track.buyer_user_id = current_user.id

    for item in cart.items:
        db.delete(item)

    db.commit()
    db.refresh(purchase)

    return purchase


@app.get("/purchases", response_model=List[PurchaseResponse])
def get_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchases = db.query(Purchase).filter(
        Purchase.user_id == current_user.id
    ).all()

    return purchases

@app.get("/my-tracks")
def get_my_tracks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = (
        db.query(Track, Purchase.created_at)
        .join(PurchaseItem, PurchaseItem.track_id == Track.id)
        .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
        .filter(Purchase.user_id == current_user.id)
        .all()
    )

    my_tracks = []

    for track, purchased_at in results:
        my_tracks.append({
            "id": track.id,
            "title": track.title,
            "genre": track.genre,
            "mood": track.mood,
            "bpm": track.bpm,
            "key": track.key,
            "price": float(track.price),
            "duration": track.duration,
            "image_url": track.image_url,
            "demo_file_url": track.demo_file_url,
            "full_file_url": track.full_file_url,
            "purchased_at": purchased_at.isoformat()
        })

    return my_tracks

@app.put("/tracks/{track_id}", response_model=TrackResponse)
def update_track(
    track_id: int,
    track_data: TrackCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    track = db.query(Track).filter(Track.id == track_id).first()

    if not track:
        raise HTTPException(status_code=404, detail="Трек не найден")

    for key, value in track_data.model_dump().items():
        setattr(track, key, value)

    db.commit()
    db.refresh(track)

    return track

@app.post("/tracks/upload", response_model=TrackResponse)
def create_track_with_files(
    title: str = Form(...),
    genre: str = Form(None),
    mood: str = Form(None),
    bpm: int = Form(None),
    key: str = Form(None),
    price: float = Form(...),
    duration: int = Form(None),
    description: str = Form(None),
    demo_file: UploadFile = File(...),
    full_file: UploadFile = File(...),
    image_file: UploadFile = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    os.makedirs("uploads/demos", exist_ok=True)
    os.makedirs("uploads/tracks", exist_ok=True)
    os.makedirs("uploads/images", exist_ok=True)

    demo_path = f"uploads/demos/{demo_file.filename}"
    full_path = f"uploads/tracks/{full_file.filename}"

    with open(demo_path, "wb") as buffer:
        shutil.copyfileobj(demo_file.file, buffer)

    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(full_file.file, buffer)

    image_url = None

    if image_file:
        image_path = f"uploads/images/{image_file.filename}"

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)

        image_url = f"{BACKEND_URL}/{image_path}"

    new_track = Track(
        title=title,
        genre=genre,
        mood=mood,
        bpm=bpm,
        key=key,
        price=price,
        duration=duration,
        demo_file_url=f"{BACKEND_URL}/{demo_path}",
        full_file_url=f"{BACKEND_URL}/{full_path}",
        image_url=image_url,
        description=description
    )

    db.add(new_track)
    db.commit()
    db.refresh(new_track)

    return new_track

@app.post("/create-checkout-session")
def create_checkout_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

        if not cart or len(cart.items) == 0:
            raise HTTPException(status_code=400, detail="Кошик порожній")

        line_items = []

        for item in cart.items:
            track = db.query(Track).filter(Track.id == item.track_id).first()

            if not track:
                continue

            line_items.append({
                "price_data": {
                    "currency": "uah",
                    "product_data": {
                        "name": track.title,  # назва треку в Stripe
                        "description": f"{track.genre or 'Жанр не вказано'} • {track.bpm or '-'} BPM",
                    },
                    "unit_amount": int(float(track.price) * 100),
                },
                "quantity": 1,
            })

        if len(line_items) == 0:
            raise HTTPException(
                status_code=400,
                detail="У кошику немає доступних треків"
            )

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url="http://localhost:3000/payment-success",
            cancel_url="http://localhost:3000/cart",
        )

        return {"url": session.url}

    except HTTPException:
        raise

    except Exception as e:
        print("STRIPE ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="Помилка створення Stripe-сесії"
        )
    
@app.get("/admin/tracks-info")
def get_admin_tracks_info(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    tracks = db.query(Track).order_by(Track.id.desc()).all()
    result = []
    for track in tracks:
        buyer = None
        if track.is_sold and track.buyer_user_id:
            buyer = db.query(User).filter(User.id == track.buyer_user_id).first()
        result.append({
            "id": track.id,
            "title": track.title,
            "genre": track.genre,
            "mood": track.mood,
            "bpm": track.bpm,
            "key": track.key,
            "price": float(track.price),
            "duration": track.duration,
            "image_url": track.image_url,
            "demo_file_url": track.demo_file_url,
            "full_file_url": track.full_file_url,
            "created_at": track.created_at.isoformat() if track.created_at else None,
            "is_sold": track.is_sold,
            "buyer": {
                "id": buyer.id,
                "name": buyer.name,
                "nickname": buyer.nickname,
                "email": buyer.email
            } if buyer else None
        })
    return result


@app.get("/admin/users", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    users = db.query(User).order_by(User.id.desc()).all()
    return users


@app.patch("/admin/users/{user_id}/block", response_model=UserResponse)
def toggle_user_block(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Нельзя заблокировать самого себя")

    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Нельзя заблокировать администратора")

    user.is_blocked = not user.is_blocked

    db.commit()
    db.refresh(user)

    return user


@app.delete("/admin/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")

    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Нельзя удалить администратора")

    db.delete(user)
    db.commit()

    return {"message": "Пользователь удалён"}


# ── Comments ──────────────────────────────────────────────

@app.get("/tracks/{track_id}/comments", response_model=List[CommentResponse])
def get_comments(track_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Comment)
        .filter(Comment.track_id == track_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


@app.post("/tracks/{track_id}/comments", response_model=CommentResponse)
def add_comment(
    track_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Трек не знайдено")

    content = comment_data.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Коментар не може бути порожнім")

    comment = Comment(
        track_id=track_id,
        user_id=current_user.id,
        content=content[:200]
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@app.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Коментар не знайдено")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Немає доступу")
    db.delete(comment)
    db.commit()
    return {"ok": True}


# ── Secure download ───────────────────────────────────────

@app.get("/tracks/{track_id}/download")
def download_track(
    track_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Трек не знайдено")

    is_admin = current_user.role == "admin"

    has_purchased = (
        db.query(PurchaseItem)
        .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
        .filter(
            PurchaseItem.track_id == track_id,
            Purchase.user_id == current_user.id
        )
        .first()
    )

    if not (has_purchased or is_admin):
        raise HTTPException(status_code=403, detail="Ви не придбали цей трек")

    if not track.full_file_url:
        raise HTTPException(status_code=404, detail="Файл не знайдено")

    # Extract relative path from the stored URL
    base_url = f"{BACKEND_URL}/"
    relative_path = track.full_file_url.replace(base_url, "")

    # Absolute path based on main.py location
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, relative_path)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Файл не знайдено: {relative_path}")

    ext = os.path.splitext(file_path)[1].lower()
    media_type = mimetypes.types_map.get(ext, "application/octet-stream")
    filename = f"{track.title}{ext}"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
    )