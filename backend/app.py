from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
from backend/database import sqlite3
import sqlite3
from backend/database importsave_prediction,init_db,get_predictions,delete_predictions,save_feedback,prepare_training_dataset,TRAINING_DATASET

app = Flask(__name__)
CORS(app,origins=["http://localhost:5173",
"http://127.0.0.1.5173"])

model = joblib.load("student_performance-model.pkl")
encoder = joblib.load("student_performance_encoder.pkl")
MODEL_VERSION=1.0
df = pd.read_csv("StudentPerformanceFactors.csv")

# Separate input columns
X = df.drop("Exam_Score", axis=1)

# Identify categorical and numerical columns
categorical_columns = X.select_dtypes(include="object").columns
numerical_columns = X.select_dtypes(exclude="object").columns


@app.route("/")
def home():
    return "Student Performance Prediction API is running"


@app.route("/predict", methods=["POST"])
def predict():
    
    # Get data sent from React
    data = request.get_json()

    # Convert received data into DataFrame
    student_df = pd.DataFrame([data])

    # Convert numerical values from strings to numbers
    for column in numerical_columns:
        student_df[column] = pd.to_numeric(student_df[column])

    # Encode categorical data
    student_encoded = encoder.transform(
        student_df[categorical_columns]
    )

    # Get numerical data
    student_numeric = student_df[numerical_columns].values

    # Combine numerical + encoded categorical data
    student_final = np.hstack(
        (student_numeric, student_encoded)
    )

    # Make prediction
    prediction = model.predict(student_final)

    predicted_score = round(
    max(0, min(100, float(prediction[0]))),
    2
)
    

    # Performance category
    if predicted_score >= 90:
        performance = "Excellent"
    elif predicted_score >= 75:
        performance = "Good"
    elif predicted_score >= 60:
        performance = "Average"
    else:
        performance = "Needs Improvement"

    save_prediction(predicted_score, performance)
    
    return jsonify({
        "predicted_score": predicted_score,
        "performance": performance
    })


@app.route("/history", methods=["GET"])
def history():

    connection = sqlite3.connect(
        "student_predictions.db"
    )

    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM predictions ORDER BY id DESC"
    )

    records = cursor.fetchall()

    connection.close()

    return jsonify(records)


@app.route("/history", methods=["DELETE"])
def delete_history():

    connection = sqlite3.connect(
        "student_predictions.db"
    )

    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM predictions"
    )

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Prediction history deleted successfully"
    })
@app.route("/feedback",methods=["POST"])
def feedback():
    data=request.get_json()

    success,message=save_feedback(
        data.get("prediction_id"),
        data.get("feedback"),
        data.get("actual_exam_score")
    )
if not success:
     return jsonify({"error":message}),400
     
return jsonify({"message":message})

 @app.route("/prepare-dataset",methods=["POST"])
 def prepare_dataset():
    success,message,count=prepare_training_dataset()
    return jsonify({"message":message,"records":count})

 @app.route("/training-dataset")
 def training_datset():
    if not TRAINING_DATASET.exists():
        return jsonify({"error":"dataset not ready"}),404
    return send_files(
        TRAINING_DATASET,as_attachment=True,

 download_name="feedback_training_dataset.csv"
    )

if __name__ == "__main__":
    app.run(debug=True)