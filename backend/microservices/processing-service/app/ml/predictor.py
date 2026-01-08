import pandas as pd
from app.ml.loader import load_artifacts
from app.ml.schemas import UserMetrics
from app.recommendations.engine import generate_recommendations

def encode_features(df: pd.DataFrame, gender_encoder, bmi_encoder):
    """Encode categorical features"""
    df = df.copy()
    df['gender'] = gender_encoder.transform(df['gender'])
    df['bmi_category'] = bmi_encoder.transform(df['bmi_category'])
    return df

def predict_stress(user_data: UserMetrics):
    """Predict stress level category (Uses 10 features)"""
    artifacts = load_artifacts()
    df = pd.DataFrame([user_data.model_dump()])
    
    stress_features = [
        'gender', 'age', 'sleep_duration', 'quality_of_sleep', 
        'physical_activity_level', 'bmi_category', 'systolic_bp', 
        'diastolic_bp', 'heart_rate', 'daily_steps'
    ]
    
    # Filter the dataframe to ONLY these features
    df_filtered = df[stress_features]
    
    df_encoded = encode_features(df_filtered, artifacts.stress_gender_encoder, artifacts.stress_bmi_encoder)
    
    pred_class = artifacts.stress_model.predict(df_encoded)[0]
    pred_prob = artifacts.stress_model.predict_proba(df_encoded)[0]
    
    category = artifacts.stress_target_encoder.inverse_transform([pred_class])[0]
    return category, pred_prob

def predict_health_risk(user_data: UserMetrics):
    """Predict health risk category (Uses 11 features)"""
    artifacts = load_artifacts()
    df = pd.DataFrame([user_data.model_dump()])
    
    # Define the 11 features the Health Model expects (includes stress_level)
    health_features = [
        'gender', 'age', 'sleep_duration', 'quality_of_sleep', 
        'physical_activity_level', 'stress_level', 'bmi_category', 
        'systolic_bp', 'diastolic_bp', 'heart_rate', 'daily_steps'
    ]
    
    # Filter the dataframe
    df_filtered = df[health_features]
    
    df_encoded = encode_features(df_filtered, artifacts.health_gender_encoder, artifacts.health_bmi_encoder)
    
    pred_class = artifacts.health_model.predict(df_encoded)[0]
    pred_prob = artifacts.health_model.predict_proba(df_encoded)[0]
    
    category = artifacts.health_target_encoder.inverse_transform([pred_class])[0]
    return category, pred_prob

def predict_all(user_data: UserMetrics):
    print("DEBUG: 1. Starting predictions...") #
    stress_label, stress_prob = predict_stress(user_data)
    health_category, health_prob = predict_health_risk(user_data)
    
    print(f"DEBUG: 2. Models finished. Stress: {stress_label}")

    stress_score = int(stress_label)
    if stress_score <= 4:
        stress_category = "low"
    elif stress_score <= 6:
        stress_category = "moderate"
    else:
        stress_category = "high"
    
    engine_input = {
        "stress": {"category": str(stress_category), "confidence": float(max(stress_prob))},
        "health_risk": {"category": str(health_category).lower(), "confidence": float(max(health_prob))}
    }
    
    print("DEBUG: 3. Calling Recommendation Engine...")
    recs = generate_recommendations(engine_input) #
    
    print("DEBUG: 4. Engine finished successfully!")
    return {
        "predictions": {"stress": stress_category, "health": health_category},
        "recommendations": recs
    }