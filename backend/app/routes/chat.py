from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from app.auth import get_current_user
from app.models import ChatMessage, User
from app.schemas import ChatMessageResponse
from app.database import get_shard1_db, get_shard2_db, SessionLocalShard1, SessionLocalShard2
from app.websocket import manager

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.get("/history/{department_name}", response_model=List[ChatMessageResponse])
def get_chat_history(department_name: str, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    if not current_user.department or current_user.department != department_name:
        raise HTTPException(status_code=403, detail="Not authorized to access this department's chat")
        
    messages = db.query(ChatMessage).filter(
        ChatMessage.department_name == department_name
    ).order_by(ChatMessage.timestamp.asc()).limit(100).all()
    return messages

@router.websocket("/ws/{department_name}/{user_id}")
async def websocket_chat(websocket: WebSocket, department_name: str, user_id: int):
    # Note: simple auth by passing user_id over WS url
    global_db = SessionLocalShard1()
    try:
        user = global_db.query(User).filter(User.id == user_id).first()
        if not user or not user.department or user.department != department_name:
            await websocket.close(code=1008)
            return
    finally:
        global_db.close()
        
    db = SessionLocalShard2()
    
    await manager.connect(websocket, room=department_name)
    try:
        while True:
            raw_data = await websocket.receive_text()
            
            try:
                data = json.loads(raw_data)
                
                if data.get("type") == "typing":
                    # Broadcast typing event to the room
                    typing_event = {
                        "type": "typing",
                        "sender_id": user.id,
                        "name": user.name
                    }
                    await manager.broadcast_to_room(department_name, json.dumps(typing_event))
                    continue
                else:
                    content = data.get("content", "")
            except json.JSONDecodeError:
                # Fallback to plain text if not JSON
                content = raw_data
                
            if not content.strip():
                continue

            # Save chat message to database
            new_msg = ChatMessage(
                sender_id=user_id,
                department_name=department_name,
                content=content,
                timestamp=datetime.utcnow()
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)
            
            # Create a response dictionary
            response = {
                "type": "message",
                "id": new_msg.id,
                "sender_id": new_msg.sender_id,
                "department_name": new_msg.department_name,
                "content": new_msg.content,
                "timestamp": new_msg.timestamp.isoformat(),
                "sender": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "profile_pic_url": user.profile_pic_url
                }
            }
            await manager.broadcast_to_room(department_name, json.dumps(response))
    except WebSocketDisconnect:
        manager.disconnect(websocket, room=department_name)
    finally:
        db.close()
