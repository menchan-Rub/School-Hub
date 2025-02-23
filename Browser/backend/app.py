from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
import jwt
from typing import List, Optional
from pydantic import BaseModel
import bcrypt
from contextlib import contextmanager

# データベース設定
DATABASE_URL = "postgresql://user:password@localhost:5432/browser_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT設定
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# SQLAlchemyモデル
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    url = Column(Text, nullable=False)
    title = Column(Text)
    visit_count = Column(Integer, default=1)
    last_visit_time = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class Bookmark(Base):
    __tablename__ = "bookmarks"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    url = Column(Text, nullable=False)
    title = Column(Text)
    description = Column(Text)
    folder_id = Column(Integer, ForeignKey("folders.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    key = Column(String, nullable=False)
    value = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydanticモデル
class Token(BaseModel):
    access_token: str
    token_type: str

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class HistoryItem(BaseModel):
    url: str
    title: Optional[str] = None
    visit_count: int
    last_visit_time: datetime
    class Config:
        orm_mode = True

class BookmarkCreate(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    folder_id: Optional[int] = None

class BookmarkResponse(BookmarkCreate):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class SettingCreate(BaseModel):
    key: str
    value: str

class SettingResponse(SettingCreate):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

# FastAPIアプリケーション
app = FastAPI(title="Browser Backend API")

# データベースセッション
@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 認証関連
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
        return user_id
    except jwt.JWTError:
        raise HTTPException(status_code=401)

# APIエンドポイント
@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with get_db() as db:
        user = db.query(User).filter(User.username == form_data.username).first()
        if not user or not bcrypt.checkpw(form_data.password.encode(), user.password_hash.encode()):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        access_token = create_access_token({"sub": user.id})
        return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=UserInDB)
async def create_user(user: UserCreate):
    with get_db() as db:
        hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())
        db_user = User(username=user.username, password_hash=hashed_password.decode())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

@app.get("/history/", response_model=List[HistoryItem])
async def get_history(user_id: int = Depends(get_current_user)):
    with get_db() as db:
        history = db.query(History).filter(History.user_id == user_id).all()
        return history

@app.post("/history/")
async def add_history(item: HistoryItem, user_id: int = Depends(get_current_user)):
    with get_db() as db:
        existing = db.query(History).filter(
            History.user_id == user_id,
            History.url == item.url
        ).first()
        
        if existing:
            existing.visit_count += 1
            existing.last_visit_time = datetime.utcnow()
            db.commit()
            return existing
        
        new_history = History(
            user_id=user_id,
            url=item.url,
            title=item.title,
            visit_count=1
        )
        db.add(new_history)
        db.commit()
        return new_history

@app.get("/bookmarks/", response_model=List[BookmarkResponse])
async def get_bookmarks(user_id: int = Depends(get_current_user)):
    with get_db() as db:
        bookmarks = db.query(Bookmark).filter(Bookmark.user_id == user_id).all()
        return bookmarks

@app.post("/bookmarks/", response_model=BookmarkResponse)
async def add_bookmark(bookmark: BookmarkCreate, user_id: int = Depends(get_current_user)):
    with get_db() as db:
        new_bookmark = Bookmark(
            user_id=user_id,
            url=bookmark.url,
            title=bookmark.title,
            description=bookmark.description,
            folder_id=bookmark.folder_id
        )
        db.add(new_bookmark)
        db.commit()
        db.refresh(new_bookmark)
        return new_bookmark

@app.get("/settings/", response_model=List[SettingResponse])
async def get_settings(user_id: int = Depends(get_current_user)):
    with get_db() as db:
        settings = db.query(Setting).filter(Setting.user_id == user_id).all()
        return settings

@app.post("/settings/", response_model=SettingResponse)
async def update_setting(setting: SettingCreate, user_id: int = Depends(get_current_user)):
    with get_db() as db:
        existing = db.query(Setting).filter(
            Setting.user_id == user_id,
            Setting.key == setting.key
        ).first()
        
        if existing:
            existing.value = setting.value
            db.commit()
            return existing
        
        new_setting = Setting(
            user_id=user_id,
            key=setting.key,
            value=setting.value
        )
        db.add(new_setting)
        db.commit()
        db.refresh(new_setting)
        return new_setting 