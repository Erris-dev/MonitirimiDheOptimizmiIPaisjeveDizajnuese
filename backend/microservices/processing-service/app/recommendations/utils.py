def determine_urgency(category: str, confidence: float, thresholds: dict = None) -> str:
    """
    Determine the urgency level for a recommendation based on category and confidence.
    """
    if thresholds is None:
        thresholds = {
            "low": 0.3,
            "medium": 0.6,
            "high": 0.8
        }

    if category in ["high", "critical"] and confidence > thresholds["high"]:
        return "high"
    elif category in ["moderate", "medium"]:
        return "medium"
    else:
        return "low"
