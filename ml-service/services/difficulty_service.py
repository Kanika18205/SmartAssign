import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from schemas.schemas import DifficultyInput, DifficultyOutput

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'difficulty_classifier.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'difficulty_scaler.pkl')

# Bootstrap training data: [correct_rate, avg_time_sec, skip_rate] -> label
BOOTSTRAP_DATA = [
    # Easy questions: high correct rate, low time, low skip
    [0.90, 20, 0.01], [0.85, 15, 0.02], [0.88, 25, 0.01],
    [0.82, 18, 0.03], [0.91, 12, 0.01], [0.78, 22, 0.04],
    # Medium questions
    [0.60, 45, 0.07], [0.55, 50, 0.08], [0.65, 40, 0.06],
    [0.50, 55, 0.10], [0.58, 48, 0.09], [0.62, 42, 0.07],
    # Hard questions: low correct rate, high time, high skip
    [0.25, 90, 0.20], [0.20, 100, 0.25], [0.30, 85, 0.15],
    [0.15, 110, 0.30], [0.22, 95, 0.22], [0.18, 105, 0.28],
]
BOOTSTRAP_LABELS = ['easy']*6 + ['medium']*6 + ['hard']*6

def load_or_train():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        return model, scaler

    X = np.array(BOOTSTRAP_DATA)
    y = BOOTSTRAP_LABELS
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_scaled, y)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    return model, scaler

_model, _scaler = load_or_train()

def classify_difficulty(input: DifficultyInput) -> DifficultyOutput:
    X = np.array([[input.correct_rate, input.avg_time, input.skip_rate]])
    X_scaled = _scaler.transform(X)
    label = _model.predict(X_scaled)[0]
    proba = _model.predict_proba(X_scaled)[0]
    confidence = float(max(proba))
    return DifficultyOutput(label=label, confidence=round(confidence, 3))
