from sqlalchemy import Column, String, DateTime, Text, JSON
from database import Base
import datetime

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    type = Column(String) # 'chat' or 'voice'
    title = Column(String)
    messages = Column(JSON) # Stores the full array of messages
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

