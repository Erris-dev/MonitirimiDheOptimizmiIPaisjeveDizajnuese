import os
import joblib
import xgboost as xgb
from sklearn.model_selection import train_test_split

from preprocessor import load_and_preprocess
from encoder import EncoderBundle
from evaluate import evaluate


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_OUTPUT_DIR = os.path.join(BASE_DIR, "..", "models", "stress")

DATASET_PATH = os.path.join(BASE_DIR, "sleep_activity.csv")
os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)


def main():
    # ---------------------------
    # Load & preprocess data
    # ---------------------------
    df = load_and_preprocess(DATASET_PATH)

    # ---------------------------
    # Encode categorical data
    # ---------------------------
    encoders = EncoderBundle()
    df = encoders.fit_transform(df)

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
            'bmi_category',
            'systolic_bp',
            'diastolic_bp',
            'heart_rate',
            'daily_steps'
        ]
    ]

    y = df['stress_level']

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
        n_estimators=300,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='multi:softprob',
        num_class=len(encoders.target.classes_),
        eval_metric='mlogloss'
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

    print("\n✅ Training completed successfully")
    print(f"📦 Model artifacts saved to `{MODEL_OUTPUT_DIR}`")


if __name__ == "__main__":
    main()
