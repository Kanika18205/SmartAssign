from fastapi import APIRouter
from schemas.schemas import AdaptiveInput, AdaptiveOutput
from services.adaptive_service import get_adaptive_questions

router = APIRouter(tags=["Adaptive"])

@router.post("/adaptive-questions", response_model=AdaptiveOutput)
def adaptive(input: AdaptiveInput):
    return get_adaptive_questions(input)
