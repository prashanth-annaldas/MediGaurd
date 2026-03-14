import pandas as pd
import numpy as np
import joblib
import os
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "uploads", "dataset.csv")

if not os.path.exists(DATASET_PATH):
    # Try one level up if uploads/dataset.csv isn't found, or check downloads
    print(f"Dataset not found at {DATASET_PATH}. Please ensure it exists.")
    exit(1)

print("Loading dataset...")
df = pd.read_csv(DATASET_PATH)
print("Dataset shape:", df.shape)

# Convert symptom string -> list with robust cleaning
def clean_symptoms(s):
    if not isinstance(s, str): return []
    # Replace comma+space with just comma, then split by comma
    parts = s.replace(', ', ',').split(',')
    # Lowercase and strip whitespace for every symptom
    return [p.strip().lower() for p in parts if p.strip()]

df["symptoms_list"] = df["symptoms"].apply(clean_symptoms)

# Encode symptoms into binary features
print("Encoding symptoms...")
mlb = MultiLabelBinarizer()
X = pd.DataFrame(
    mlb.fit_transform(df["symptoms_list"]),
    columns=mlb.classes_
)

# Target variable
y = df["disease"]

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train Model
print("Training Random Forest Classifier...")
model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

# Evaluate Model
y_pred = model.predict(X_test)
print("\nModel Accuracy:", accuracy_score(y_test, y_pred))

# Save Model for Website
MODEL_PATH = os.path.join(BASE_DIR, "disease_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "symptom_encoder.pkl")

joblib.dump(model, MODEL_PATH)
joblib.dump(mlb, ENCODER_PATH)

print("\nModel saved successfully!")
print(f"- {MODEL_PATH}")
print(f"- {ENCODER_PATH}")
