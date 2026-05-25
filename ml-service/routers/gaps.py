from fastapi import APIRouter
from schemas.schemas import GapInput, GapOutput
from services.gap_service import detect_gaps

router = APIRouter(tags=["Gaps"])

@router.post("/detect-gaps", response_model=GapOutput)
def gaps(input: GapInput):
    return detect_gaps(input)
