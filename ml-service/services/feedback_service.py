from schemas.schemas import FeedbackInput, FeedbackOutput
from typing import List, Dict

TIPS = {
    "Beginner": [
        "Start by reviewing fundamental concepts from your textbook.",
        "Make flashcards for key terms and definitions.",
        "Ask your instructor to clarify topics you're unsure about.",
        "Practice with simpler problems before attempting complex ones.",
    ],
    "Intermediate": [
        "Focus on your weak topics — review those chapters specifically.",
        "Try solving past papers under timed conditions.",
        "Understand why wrong answers are wrong, not just what's correct.",
        "Group study sessions can help solidify understanding.",
    ],
    "Advanced": [
        "You're performing well — challenge yourself with harder problems.",
        "Review any wrong answers to close remaining knowledge gaps.",
        "Try teaching the concepts you know to others to strengthen retention.",
        "Explore advanced resources for deeper understanding.",
    ],
}

TOPIC_TIPS = {
    "Arrays":        "Practice array traversal, sorting, and two-pointer techniques.",
    "Recursion":     "Trace through base cases and recursive calls step by step.",
    "Sorting":       "Compare time complexities of Quick, Merge, and Bubble sort.",
    "Trees":         "Practice inorder, preorder, postorder traversals.",
    "Graphs":        "Review BFS and DFS algorithms with example graphs.",
    "Dynamic Programming": "Break problems into overlapping subproblems and memoize.",
    "OOP":           "Review encapsulation, inheritance, polymorphism with examples.",
    "Databases":     "Practice writing JOIN, GROUP BY, and subquery SQL statements.",
    "Networking":    "Review OSI layers and common protocols (TCP/IP, HTTP, DNS).",
    "OS":            "Study process management, scheduling algorithms, and deadlocks.",
}

def get_level(percentage: float) -> str:
    if percentage >= 75: return "Advanced"
    if percentage >= 50: return "Intermediate"
    return "Beginner"

def generate_feedback(input: FeedbackInput) -> FeedbackOutput:
    level = get_level(input.percentage)

    # Identify weak and strong topics
    weak_topics = [t for t, score in input.topic_scores.items() if score < 0.5]
    strong_topics = [t for t, score in input.topic_scores.items() if score >= 0.75]

    # Use wrong_topics if topic_scores is sparse
    if not weak_topics and input.wrong_topics:
        weak_topics = list(set(input.wrong_topics))[:3]

    # Build summary
    if weak_topics:
        summary = f"You scored {input.percentage:.1f}% ({level} level). Focus areas: {', '.join(weak_topics[:3])}."
    else:
        summary = f"Excellent! You scored {input.percentage:.1f}% with strong performance across all topics."

    # Build topic-specific tips
    tips = list(TIPS[level])
    for topic in weak_topics[:2]:
        tip = TOPIC_TIPS.get(topic)
        if tip and tip not in tips:
            tips.insert(0, f"[{topic}] {tip}")
    tips = tips[:4]

    # Topic accuracy for radar chart
    topic_accuracy = [
        {"topic": t, "score": round(s * 100)}
        for t, s in input.topic_scores.items()
    ]

    return FeedbackOutput(
        summary=summary,
        level=level,
        weak_topics=weak_topics[:4],
        strong_topics=strong_topics[:4],
        tips=tips,
        topic_accuracy=topic_accuracy,
    )
