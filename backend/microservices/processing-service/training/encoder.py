import joblib
from sklearn.preprocessing import LabelEncoder


class EncoderBundle:
    def __init__(self):
        self.gender = LabelEncoder()
        self.bmi = LabelEncoder()
        self.target = LabelEncoder()

    def fit_transform(self, df):
        df['gender'] = self.gender.fit_transform(df['gender'])
        df['bmi_category'] = self.bmi.fit_transform(df['bmi_category'])
        df['stress_level'] = self.target.fit_transform(df['stress_level'])
        return df
    
    def encode_target(self, series):
        return self.target.fit_transform(series)

    def save(self, output_dir: str):
        joblib.dump(self.gender, f"{output_dir}/gender_encoder.pkl")
        joblib.dump(self.bmi, f"{output_dir}/bmi_encoder.pkl")
        joblib.dump(self.target, f"{output_dir}/stress_encoder.pkl")
