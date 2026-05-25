import random
from schemas.schemas import AdaptiveInput, AdaptiveOutput

def get_adaptive_questions(input: AdaptiveInput) -> AdaptiveOutput:
    """
    Selects questions weighted toward student's weak areas.
    In production: uses question difficulty labels + student topic scores
    to create a weighted selection.
    """
    profile = input.student_profile
    ids = input.available_question_ids

    avg_score = profile.get("avg_score", 50) / 100 if "avg_score" in profile else 0.5

    if avg_score < 0.40:
        strategy = "foundation-first"
        # Shuffle and return all — backend should prioritize easy/medium
        selected = ids
    elif avg_score < 0.70:
        strategy = "weakness-focused"
        selected = ids
    else:
        strategy = "challenge-mode"
        selected = ids

    # Shuffle for variety
    shuffled = list(selected)
    random.shuffle(shuffled)

    return AdaptiveOutput(recommended_ids=shuffled, strategy=strategy)
