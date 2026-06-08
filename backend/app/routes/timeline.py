from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_shard1_db, get_shard2_db
from app.models import WorkTimelineEvent, User
from app.schemas import TimelineEventCreate, TimelineEventUpdate, TimelineEventResponse
from app.database import get_shard1_db, get_shard2_db, get_current_user

router = APIRouter(prefix="/api/timeline", tags=["Timeline"])

@router.get("/employee/{employee_id}", response_model=List[TimelineEventResponse])
def get_employee_timeline(employee_id: int, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    # Anyone authenticated can view a timeline (managers, peers, etc.)
    events = db.query(WorkTimelineEvent).filter(WorkTimelineEvent.employee_id == employee_id).order_by(WorkTimelineEvent.start_date.desc()).all()
    return events

@router.post("/", response_model=TimelineEventResponse, status_code=201)
def create_timeline_event(event: TimelineEventCreate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    # Employees can add events to their own timeline
    new_event = WorkTimelineEvent(employee_id=current_user.id, **event.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@router.patch("/{event_id}", response_model=TimelineEventResponse)
def update_timeline_event(event_id: int, event: TimelineEventUpdate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    db_event = db.query(WorkTimelineEvent).filter(WorkTimelineEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    # Only allow the owner (or an admin) to update it. We will just check owner for now.
    if db_event.employee_id != current_user.id :
        raise HTTPException(status_code=403, detail="Not authorized to update this event")
    
    update_data = event.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{event_id}", status_code=204)
def delete_timeline_event(event_id: int, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    db_event = db.query(WorkTimelineEvent).filter(WorkTimelineEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
        
    if db_event.employee_id != current_user.id :
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
        
    db.delete(db_event)
    db.commit()
    return None
