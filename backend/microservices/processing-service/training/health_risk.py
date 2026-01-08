import os
import joblib
import xgboost as xgb
from sklearn.model_selection import train_test_split

from preprocessor import load_and_preprocess
from encoder import EncoderBundle
from evaluate import evaluate


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_OUTPUT_DIR = os.path.join(BASE_DIR, "..", "models", "health_risk")

DATASET_PATH = os.path.join(BASE_DIR, "sleep_activity.csv")
os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)


def derive_health_risk(row):
    score = 0

    if row.age >= 45:
        score += 2
    if row.bmi_category == "Obese":
        score += 3
    if row.sleep_duration < 5:
        score += 2
    if row.stress_level >= 8:
        score += 2
    if row.systolic_bp >= 140:
        score += 3
    if row.daily_steps < 3000:
        score += 2

    if score >= 8:
        return "High"
    elif score >= 4:
        return "Moderate"
    return "Low"


def main():
    # ---------------------------
    # Load & preprocess data
    # ---------------------------
    df = load_and_preprocess(DATASET_PATH)

    # ---------------------------
    # Create health risk label
    # ---------------------------
    df['health_risk'] = df.apply(derive_health_risk, axis=1)

    # ---------------------------
    # Encode categorical data
    # ---------------------------
    encoders = EncoderBundle()
    df = encoders.fit_transform(df)
    y = encoders.encode_target(df['health_risk'])

    # ---------------------------
    # Feature selection
    # ---------------------------
    X = df[
        [
            'gender',
            'age',
            'sleep_duration',
            'quality_of_sleep',
            'physical_activity_level',
            'stress_level',
            'bmi_category',
            'systolic_bp',
            'diastolic_bp',
            'heart_rate',
            'daily_steps'
        ]
    ]

    # ---------------------------
    # Train / validation split
    # ---------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    # ---------------------------
    # Train model
    # ---------------------------
    model = xgb.XGBClassifier(
        n_estimators=350,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="multi:softprob",
        num_class=len(encoders.target.classes_),
        eval_metric="mlogloss"
    )

    model.fit(X_train, y_train)

    # ---------------------------
    # Evaluate
    # ---------------------------
    evaluate(model, X_test, y_test, encoders.target)

    # ---------------------------
    # Persist artifacts
    # ---------------------------
    joblib.dump(model, f"{MODEL_OUTPUT_DIR}/model.pkl")
    encoders.save(MODEL_OUTPUT_DIR)

    print("\n✅ Health Risk model trained successfully")
    print(f"📦 Artifacts saved to `{MODEL_OUTPUT_DIR}`")


if __name__ == "__main__":
    main()
