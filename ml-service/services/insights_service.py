import numpy as np
from schemas.schemas import InsightsInput, InsightsOutput

def get_class_insights(input: InsightsInput) -> InsightsOutput:
    attempts = input.attempts
    if not attempts:
        return InsightsOutput(total_attempts=0, avg_score=0, struggling=0, average=0, strong=0)

    percentages = [a.percentage for a in attempts]
    avg_score = float(np.mean(percentages))

    struggling = sum(1 for p in percentages if p < 40)
    average = sum(1 for p in percentages if 40 <= p < 75)
    strong = sum(1 for p in percentages if p >= 75)

    return InsightsOutput(
        total_attempts=len(attempts),
        avg_score=round(avg_score, 2),
        struggling=struggling,
        average=average,
        strong=strong,
        weak_topics=[],
    )
