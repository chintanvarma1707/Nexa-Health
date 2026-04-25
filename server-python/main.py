from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import database, models, schemas
import os
import jwt
from typing import List, Optional

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Nexa Health API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user_id(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return "user_dev_123"
    
    token = authorization.split(" ")[1]
    try:
        # In a real app, verify with Clerk JWKS. For now, we extract sub.
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        return unverified_claims.get("sub", "user_dev_123")
    except Exception:
        return "user_dev_123"

@app.get("/api/user/conversations", response_model=List[schemas.Conversation])
def get_conversations(db: Session = Depends(database.get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(models.Conversation).filter(models.Conversation.user_id == user_id).order_by(models.Conversation.timestamp.desc()).all()

@app.post("/api/user/conversations", response_model=schemas.Conversation, status_code=status.HTTP_201_CREATED)
def save_conversation(entry: schemas.ConversationCreate, db: Session = Depends(database.get_db), user_id: str = Depends(get_current_user_id)):
    db_entry = models.Conversation(
        id=entry.id,
        user_id=user_id,
        type=entry.type,
        title=entry.title,
        messages=[m.dict() for m in entry.messages],
        timestamp=entry.timestamp
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.delete("/api/user/conversations/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(id: str, db: Session = Depends(database.get_db), user_id: str = Depends(get_current_user_id)):
    db_entry = db.query(models.Conversation).filter(models.Conversation.id == id, models.Conversation.user_id == user_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(db_entry)
    db.commit()
    return None

@app.get("/")
def read_root():
    return {"message": "Welcome to Nexa Health API"}

