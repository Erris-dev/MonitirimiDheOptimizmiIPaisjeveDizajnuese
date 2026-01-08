from app.config.settings import settings
import joblib

class ModelArtifacts:
    stress_model = None
    stress_gender_encoder = None
    stress_bmi_encoder = None
    stress_target_encoder = None

    health_model = None
    health_gender_encoder = None
    health_bmi_encoder = None
    health_target_encoder = None

def load_artifacts():
    # Only skip loading if EVERYTHING is already loaded
    if all([
        ModelArtifacts.stress_model, 
        ModelArtifacts.health_target_encoder,
        ModelArtifacts.health_model
    ]):
        return ModelArtifacts

    try:
        # Stress artifacts
        ModelArtifacts.stress_model = joblib.load(settings.STRESS_MODEL_PATH)
        ModelArtifacts.stress_gender_encoder = joblib.load(settings.STRESS_GENDER_ENCODER_PATH)
        ModelArtifacts.stress_bmi_encoder = joblib.load(settings.STRESS_BMI_ENCODER_PATH)
        ModelArtifacts.stress_target_encoder = joblib.load(settings.STRESS_TARGET_ENCODER_PATH)

        # Health artifacts
        ModelArtifacts.health_model = joblib.load(settings.HEALTH_MODEL_PATH)
        ModelArtifacts.health_gender_encoder = joblib.load(settings.HEALTH_GENDER_ENCODER_PATH)
        ModelArtifacts.health_bmi_encoder = joblib.load(settings.HEALTH_BMI_ENCODER_PATH)
        ModelArtifacts.health_target_encoder = joblib.load(settings.HEALTH_TARGET_ENCODER_PATH)
        
    except FileNotFoundError as e:
        print(f"❌ DEPLOYMENT ERROR: Missing ML artifact! {e}")
        raise e # Crash early so you know exactly which file is missing

    return ModelArtifacts
