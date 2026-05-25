from fastapi import APIRouter
from schemas.schemas import FeedbackInput, FeedbackOutput
from services.feedback_service import generate_feedback

router = APIRouter(tags=["Feedback"])

@router.post("/generate-feedback", response_model=FeedbackOutput)
def feedback(input: FeedbackInput):
    return generate_feedback(input)
