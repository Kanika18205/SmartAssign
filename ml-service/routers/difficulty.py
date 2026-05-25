from fastapi import APIRouter
from schemas.schemas import DifficultyInput, DifficultyOutput
from services.difficulty_service import classify_difficulty

router = APIRouter(tags=["Difficulty"])

@router.post("/classify-difficulty", response_model=DifficultyOutput)
def classify(input: DifficultyInput):
    return classify_difficulty(input)
