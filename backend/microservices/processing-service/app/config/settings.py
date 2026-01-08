from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path

# Moves up 3 levels: app/config/settings.py -> app/config -> app -> processing-service
BASE_DIR = Path(__file__).resolve().parent.parent.parent 

class Settings(BaseSettings):
    # =========================
    # Service Config
    # =========================
    SERVICE_NAME: str = "processing-service"
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # =========================
    # Kafka Config
    # =========================
    # These fields map your .env keys to your code variables
    KAFKA_BOOTSTRAP_SERVERS: str = Field(default="kafka:29092")
    KAFKA_GROUP_ID: str = Field(default="processing-service-group")
    
    # Validation Alias links the code name to the .env name
    KAFKA_INPUT_TOPIC: str = Field(validation_alias="RAW_METRICS_TOPIC")
    KAFKA_OUTPUT_TOPIC: str = Field(validation_alias="PROCESSED_INSIGHTS_TOPIC")
    
    KAFKA_AUTO_OFFSET_RESET: str = "earliest"
    KAFKA_ENABLE_AUTO_COMMIT: bool = False

    # =========================
    # Model paths
    # =========================
    STRESS_MODEL_PATH: Path = BASE_DIR / "models" / "stress" / "model.pkl"
    HEALTH_MODEL_PATH: Path = BASE_DIR / "models" / "health_risk" / "model.pkl"

    STRESS_GENDER_ENCODER_PATH: Path = BASE_DIR / "models" / "stress" / "gender_encoder.pkl"
    STRESS_BMI_ENCODER_PATH: Path = BASE_DIR / "models" / "stress" / "bmi_encoder.pkl"
    STRESS_TARGET_ENCODER_PATH: Path = BASE_DIR / "models" / "stress" / "stress_encoder.pkl"

    # Health Encoders
    HEALTH_GENDER_ENCODER_PATH: Path = BASE_DIR / "models" / "health_risk" / "gender_encoder.pkl"
    HEALTH_BMI_ENCODER_PATH: Path = BASE_DIR / "models" / "health_risk" / "bmi_encoder.pkl"
    HEALTH_TARGET_ENCODER_PATH: Path = BASE_DIR / "models" / "health_risk" / "stress_encoder.pkl"

    # =========================
    # Pydantic V2 Config
    # =========================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra="ignore"  # Tells Pydantic not to crash if extra vars exist in .env
    )

settings = Settings()