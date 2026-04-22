from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any

class Message(BaseModel):
    role: str
    content: str

class ConversationBase(BaseModel):
    type: str
    title: str
    messages: List[Message]
    timestamp: datetime

class ConversationCreate(ConversationBase):
    id: str

class Conversation(ConversationBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

