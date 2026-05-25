from fastapi import APIRouter
from schemas.schemas import InsightsInput, InsightsOutput
from services.insights_service import get_class_insights

router = APIRouter(tags=["Insights"])

@router.post("/class-insights", response_model=InsightsOutput)
def insights(input: InsightsInput):
    return get_class_insights(input)
