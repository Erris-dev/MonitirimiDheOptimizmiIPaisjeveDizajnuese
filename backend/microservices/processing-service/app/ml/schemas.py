from pydantic import BaseModel, Field
from typing import Literal, Optional

class UserMetrics(BaseModel):
    gender: Literal["Male", "Female"]
    age: int = Field(..., ge=0, le=120)

    sleep_duration: float = Field(..., ge=0, le=24)
    quality_of_sleep: int = Field(..., ge=1, le=10)

    physical_activity_level: int = Field(..., ge=0)
    stress_level: Optional[int] = Field(None, ge=1, le=10)  # optional for health risk model

    bmi_category: Literal["Underweight", "Normal", "Overweight", "Obese"]

    systolic_bp: int = Field(..., ge=80, le=250)
    diastolic_bp: int = Field(..., ge=40, le=150)

    heart_rate: int = Field(..., ge=30, le=220)
    daily_steps: int = Field(..., ge=0)
