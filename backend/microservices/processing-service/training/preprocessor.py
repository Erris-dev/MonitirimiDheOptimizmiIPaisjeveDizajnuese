import pandas as pd

def load_and_preprocess(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    # Normalize column names
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    # Split blood pressure into numeric features
    df[['systolic_bp', 'diastolic_bp']] = (
        df['blood_pressure']
        .str.split('/', expand=True)
        .astype(int)
    )

    # Drop unused columns
    df = df.drop(columns=[
        'person_id',
        'occupation',
        'blood_pressure'
    ], errors='ignore')

    return df
