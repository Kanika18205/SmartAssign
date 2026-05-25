import numpy as np
from schemas.schemas import GapInput, GapOutput

RECOMMENDATIONS = {
    "Struggling":    "Strongly recommended to review foundational material and attend extra sessions.",
    "Average":       "Focus on your weak topics to move into the Strong group.",
    "Strong":        "Great performance! Consider helping peers or exploring advanced material.",
}

def detect_gaps(input: GapInput) -> GapOutput:
    topic_scores = input.topic_scores

    if not topic_scores:
        return GapOutput(
            cluster="Unknown", weak_topics=[], strong_topics=[],
            recommendation="No topic data available for analysis."
        )

    scores = list(topic_scores.values())
    avg_score = np.mean(scores) if scores else 0.5
    
    # Simple threshold-based clustering (K-Means approximation)
    # In production: collect all student vectors and run sklearn KMeans
    if avg_score < 0.40:
        cluster = "Struggling"
    elif avg_score < 0.70:
        cluster = "Average"
    else:
        cluster = "Strong"

    weak_topics = [t for t, s in topic_scores.items() if s < 0.50]
    strong_topics = [t for t, s in topic_scores.items() if s >= 0.75]

    return GapOutput(
        cluster=cluster,
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        recommendation=RECOMMENDATIONS.get(cluster, "Keep practicing!"),
    )
