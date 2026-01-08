from app.recommendations.rules import STRESS_RECOMMENDATIONS, HEALTH_RISK_RECOMMENDATIONS
from app.recommendations.utils import determine_urgency

def generate_recommendations(predictions: dict) -> dict:
    """
    Generates recommendations for multiple ML models.

    predictions: dict
        Example:
        {
            "stress": {"category": "high", "confidence": 0.85},
            "health_risk": {"category": "medium", "confidence": 0.7},
        }
    """
    output = {}

    # Stress recommendations
    if "stress" in predictions:
        stress = predictions["stress"]
        recs = STRESS_RECOMMENDATIONS.get(stress["category"], [])
        urgency = determine_urgency(stress["category"], stress["confidence"])
        output["stress"] = {
            "category": stress["category"],
            "confidence": stress["confidence"],
            "urgency": urgency,
            "recommendations": recs,
        }

    # Health risk recommendations
    if "health_risk" in predictions:
        risk = predictions["health_risk"]
        recs = HEALTH_RISK_RECOMMENDATIONS.get(risk["category"], [])
        urgency = determine_urgency(risk["category"], risk["confidence"])
        output["health_risk"] = {
            "category": risk["category"],
            "confidence": risk["confidence"],
            "urgency": urgency,
            "recommendations": recs,
        }

    return output
