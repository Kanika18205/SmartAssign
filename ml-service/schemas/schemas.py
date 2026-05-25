from pydantic import BaseModel
from typing import Dict, List, Optional, Any

class DifficultyInput(BaseModel):
    correct_rate: float        # 0.0 to 1.0
    avg_time: float            # average seconds per question
    skip_rate: float = 0.0

class DifficultyOutput(BaseModel):
    label: str                 # "easy" | "medium" | "hard"
    confidence: float

class FeedbackInput(BaseModel):
    student_id: str
    percentage: float
    topic_scores: Dict[str, float]   # topic -> accuracy (0.0-1.0)
    wrong_topics: List[str] = []

class FeedbackOutput(BaseModel):
    summary: str
    level: str                        # "Beginner" | "Intermediate" | "Advanced"
    weak_topics: List[str]
    strong_topics: List[str]
    tips: List[str]
    topic_accuracy: List[Dict[str, Any]] = []

class GapInput(BaseModel):
    student_id: str
    topic_scores: Dict[str, float]

class GapOutput(BaseModel):
    cluster: str
    weak_topics: List[str]
    strong_topics: List[str]
    recommendation: str

class AdaptiveInput(BaseModel):
    student_profile: Dict[str, Any]
    available_question_ids: List[str]

class AdaptiveOutput(BaseModel):
    recommended_ids: List[str]
    strategy: str

class AttemptData(BaseModel):
    percentage: float
    responses: List[Dict[str, Any]] = []

class InsightsInput(BaseModel):
    test_id: str
    attempts: List[AttemptData]

class InsightsOutput(BaseModel):
    total_attempts: int
    avg_score: float
    struggling: int
    average: int
    strong: int
    weak_topics: List[str] = []
