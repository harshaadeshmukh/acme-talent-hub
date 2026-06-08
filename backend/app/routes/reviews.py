from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.auth import get_current_user, get_current_manager
from app.database import get_shard1_db, get_shard2_db
from app.models import User, PerformanceReview, RoleEnum
from app.schemas import PerformanceReviewResponse, PerformanceReviewCreate, PerformanceReviewUpdate
from app.database import get_shard1_db, get_shard2_db

router = APIRouter(prefix="/api/reviews", tags=["Performance Reviews"])

@router.post("/", response_model=PerformanceReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(review: PerformanceReviewCreate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_manager)):
    """Create performance review (manager/manager only)"""
    # Verify employee and reviewer exist
    employee = db.query(User).filter(User.id == review.employee_id, User.is_active == True).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    reviewer = db.query(User).filter(User.id == review.reviewer_id, User.is_active == True).first()
    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer not found")
    
    # Verify current user is the reviewer 
    if current_user.id != review.reviewer_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only create reviews as the reviewer")
    
    new_review = PerformanceReview(
        employee_id=review.employee_id,
        reviewer_id=review.reviewer_id,
        rating=review.rating,
        feedback=review.feedback,
        review_period=review.review_period
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@router.get("/", response_model=List[PerformanceReviewResponse])
def list_reviews(skip: int = 0, limit: int = 100, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """List all reviews"""
    reviews = db.query(PerformanceReview).offset(skip).limit(limit).all()
    return reviews

@router.get("/employee/{employee_id}", response_model=List[PerformanceReviewResponse])
def get_employee_reviews(employee_id: int, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Get all reviews for an employee"""
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    reviews = db.query(PerformanceReview).filter(PerformanceReview.employee_id == employee_id).all()
    return reviews

@router.get("/{review_id}", response_model=PerformanceReviewResponse)
def get_review(review_id: int, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Get review by ID"""
    review = db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@router.put("/{review_id}", response_model=PerformanceReviewResponse)
def update_review(review_id: int, review_update: PerformanceReviewUpdate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_manager)):
    """Update performance review (manager/manager only)"""
    review = db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Verify authorization
    if current_user.id != review.reviewer_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only update your own reviews")
    
    if review_update.rating is not None:
        review.rating = review_update.rating
    if review_update.feedback is not None:
        review.feedback = review_update.feedback
    if review_update.review_period is not None:
        review.review_period = review_update.review_period
    
    db.commit()
    db.refresh(review)
    return review

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_manager)):
    """Delete performance review (manager/manager only)"""
    review = db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Verify authorization
    if current_user.id != review.reviewer_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
    
    db.delete(review)
    db.commit()
    return None

@router.get("/employee/{employee_id}/average", tags=["Performance Reviews"])
def get_employee_average_rating(employee_id: int, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Get average rating for an employee"""
    from sqlalchemy import func
    
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    avg_rating = db.query(func.avg(PerformanceReview.rating)).filter(
        PerformanceReview.employee_id == employee_id
    ).scalar()
    
    total_reviews = db.query(PerformanceReview).filter(
        PerformanceReview.employee_id == employee_id
    ).count()
    
    return {
        "employee_id": employee_id,
        "average_rating": float(avg_rating) if avg_rating else 0.0,
        "total_reviews": total_reviews
    }
