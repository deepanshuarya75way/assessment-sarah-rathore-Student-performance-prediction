import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:5000";

const initialFormData = {
  Hours_Studied: "",
  Attendance: "",
  Previous_Scores: "",
  Tutoring_Sessions: "",
  Sleep_Hours: "",
  Physical_Activity: "",

  Parental_Involvement: "Medium",
  Access_to_Resources: "Medium",
  Motivation_Level: "Medium",
  Teacher_Quality: "Medium",
  Family_Income: "Medium",
  Peer_Influence: "Neutral",

  Extracurricular_Activities: "No",
  Internet_Access: "Yes",
  School_Type: "Public",
  Learning_Disabilities: "No",

  Parental_Education_Level: "College",
  Distance_from_Home: "Near",
  Gender: "Female"
};

const numericRanges = {
  Hours_Studied: [1, 44],
  Attendance: [60, 100],
  Previous_Scores: [50, 100],
  Tutoring_Sessions: [0, 8],
  Sleep_Hours: [4, 10],
  Physical_Activity: [0, 6]
};

function App() {
  const [formData, setFormData] = useState(initialFormData);
  const [prediction, setPrediction] = useState(null);
  const[feedback,setFeedback]=useState("");
  const[actualscore,setActualScore]=useState("");
  const[message,setMessage]=useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPredictions = history.length;

  const scores = history
    .map((record) => Number(record.predicted_score))
    .filter(Number.isFinite);

  const averageScore = scores.length
    ? (
        scores.reduce((sum, score) => sum + score, 0) /
        scores.length
      ).toFixed(2)
    : 0;

  const highestScore = scores.length
    ? Math.max(...scores).toFixed(2)
    : 0;

  const lowestScore = scores.length
    ? Math.min(...scores).toFixed(2)
    : 0;

  async function loadHistory() {
    try {
      const response = await fetch(`${API_URL}/history`);

      if (!response.ok) {
        throw new Error("Could not load prediction history.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid history response.");
      }

      setHistory(data);
    } catch (err) {
      console.error("History error:", err);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function validateForm() {
    for (const [field, [minimum, maximum]] of Object.entries(
      numericRanges
    )) {
      const value = formData[field];

      if (value === "") {
        return "Please fill in all numerical fields.";
      }

      const number = Number(value);

      if (
        !Number.isFinite(number) ||
        number < minimum ||
        number > maximum
      ) {
        return `${field.replaceAll("_", " ")} must be between ${minimum} and ${maximum}.`;
      }
    }

    return null;
  }

  async function handlePredict() {
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setPrediction(null);

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Prediction failed. Please try again."
        );
      }

      const score = Number(result.predicted_score);

      if (!Number.isFinite(score)) {
        throw new Error("Flask returned an invalid prediction.");
      }

      if (!result.performance) {
        throw new Error(
          "Flask did not return a performance category."
        );
      }

      setPrediction({
        predicted_score: score,
        performance: result.performance
      });

      await loadHistory();
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setFormData({ ...initialFormData });
    setPrediction(null);
    setError("");
  }

  async function handleResetHistory() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all prediction history?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/history`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(
          "Could not delete history. Check whether Flask supports DELETE /history."
        );
      }

      setHistory([]);
      setPrediction(null);
    } catch (err) {
      console.error("Delete history error:", err);
      setError(err.message);
    }
  }

  return (
    <div className="app">

      <h1>Student Performance Prediction System</h1>

      <p className="app-description">
        Predict a student's exam score based on academic,
        lifestyle, and environmental factors.
      </p>

      <div className="form-container">

        <h2>Student Information</h2>

        <h3 className="section-title">
          Academic Information
        </h3>

        {/* Hours Studied */}
        <div className="input-group">
          <label>Hours Studied</label>

          <input
            type="number"
            name="Hours_Studied"
            value={formData.Hours_Studied}
            onChange={handleChange}
            min="1"
            max="44"
          />

          <small>Allowed range: 1–44</small>
        </div>

        {/* Attendance */}
        <div className="input-group">
          <label>Attendance (%)</label>

          <input
            type="number"
            name="Attendance"
            value={formData.Attendance}
            onChange={handleChange}
            min="60"
            max="100"
          />

          <small>Allowed range: 60–100</small>
        </div>

        {/* Previous Scores */}
        <div className="input-group">
          <label>Previous Scores</label>

          <input
            type="number"
            name="Previous_Scores"
            value={formData.Previous_Scores}
            onChange={handleChange}
            min="50"
            max="100"
          />

          <small>Allowed range: 50–100</small>
        </div>

        {/* Tutoring Sessions */}
        <div className="input-group">
          <label>Tutoring Sessions</label>

          <input
            type="number"
            name="Tutoring_Sessions"
            value={formData.Tutoring_Sessions}
            onChange={handleChange}
            min="0"
            max="8"
            step="1"
          />

          <small>Allowed range: 0–8</small>
        </div>

        <h3 className="section-title">
          Student Lifestyle
        </h3>

        {/* Sleep Hours */}
        <div className="input-group">
          <label>Sleep Hours</label>

          <input
            type="number"
            name="Sleep_Hours"
            value={formData.Sleep_Hours}
            onChange={handleChange}
            min="4"
            max="10"
          />

          <small>Allowed range: 4–10</small>
        </div>

        {/* Physical Activity */}
        <div className="input-group">
          <label>Physical Activity</label>

          <input
            type="number"
            name="Physical_Activity"
            value={formData.Physical_Activity}
            onChange={handleChange}
            min="0"
            max="6"
          />

          <small>Allowed range: 0–6</small>
        </div>

        <h3 className="section-title">
          Environment & Support
        </h3>

        <label>Parental Involvement</label>
        <select
          name="Parental_Involvement"
          value={formData.Parental_Involvement}
          onChange={handleChange}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <label>Access to Resources</label>
        <select
          name="Access_to_Resources"
          value={formData.Access_to_Resources}
          onChange={handleChange}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <label>Motivation Level</label>
        <select
          name="Motivation_Level"
          value={formData.Motivation_Level}
          onChange={handleChange}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <label>Teacher Quality</label>
        <select
          name="Teacher_Quality"
          value={formData.Teacher_Quality}
          onChange={handleChange}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <label>Family Income</label>
        <select
          name="Family_Income"
          value={formData.Family_Income}
          onChange={handleChange}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <label>Peer Influence</label>
        <select
          name="Peer_Influence"
          value={formData.Peer_Influence}
          onChange={handleChange}
        >
          <option>Negative</option>
          <option>Neutral</option>
          <option>Positive</option>
        </select>

        <label>Extracurricular Activities</label>
        <select
          name="Extracurricular_Activities"
          value={formData.Extracurricular_Activities}
          onChange={handleChange}
        >
          <option>Yes</option>
          <option>No</option>
        </select>

        <label>Internet Access</label>
        <select
          name="Internet_Access"
          value={formData.Internet_Access}
          onChange={handleChange}
        >
          <option>Yes</option>
          <option>No</option>
        </select>

        <label>School Type</label>
        <select
          name="School_Type"
          value={formData.School_Type}
          onChange={handleChange}
        >
          <option>Public</option>
          <option>Private</option>
        </select>

        <label>Learning Disabilities</label>
        <select
          name="Learning_Disabilities"
          value={formData.Learning_Disabilities}
          onChange={handleChange}
        >
          <option>Yes</option>
          <option>No</option>
        </select>

        <label>Parental Education Level</label>
        <select
          name="Parental_Education_Level"
          value={formData.Parental_Education_Level}
          onChange={handleChange}
        >
          <option>High School</option>
          <option>College</option>
          <option>Postgraduate</option>
        </select>

        <label>Distance from Home</label>
        <select
          name="Distance_from_Home"
          value={formData.Distance_from_Home}
          onChange={handleChange}
        >
          <option>Near</option>
          <option>Moderate</option>
          <option>Far</option>
        </select>

        <label>Gender</label>
        <select
          name="Gender"
          value={formData.Gender}
          onChange={handleChange}
        >
          <option>Female</option>
          <option>Male</option>
        </select>

        <button
          className="predict-btn"
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? "Predicting..." : "Predict Exam Score"}
        </button>

        <button
          className="clear-btn"
          onClick={handleClear}
        >
          Clear
        </button>

        {error && (
          <p
            role="alert"
            style={{
              color: "red",
              marginTop: "15px"
            }}
          >
            {error}
          </p>
        )}

        {prediction && (
          <div
            className={`prediction-result ${prediction.performance
              .toLowerCase()
              .replaceAll(" ", "-")}`}
          >
            <h2>Prediction Result</h2>

            <div className="score-display">
              <span>Predicted Exam Score</span>

              <strong>
                {prediction.predicted_score.toFixed(2)}
              </strong>
            </div>

            <div className="performance-display">
              <span>Performance</span>

              <strong>
                {prediction.performance}
              </strong>
            </div>

            <p className="prediction-message">
              {prediction.performance === "Excellent" &&
                "Excellent performance! Keep up the great work."}

              {prediction.performance === "Good" &&
                "Good performance! With a little more effort, you can improve further."}

              {prediction.performance === "Average" &&
                "Your performance is average. Focus on regular study and attendance to improve."}

              {prediction.performance === "Needs Improvement" &&
                "Your score needs improvement. Try increasing your study hours and maintaining regular attendance."}
            </p>
          </div>
        )}

      </div>

      <div className="history-section">

        <div className="stats-container">

          <div className="stat-card">
            <h3>Total Predictions</h3>
            <strong>{totalPredictions}</strong>
          </div>

          <div className="stat-card">
            <h3>Average Score</h3>
            <strong>{averageScore}</strong>
          </div>

          <div className="stat-card">
            <h3>Highest Score</h3>
            <strong>{highestScore}</strong>
          </div>

          <div className="stat-card">
            <h3>Lowest Score</h3>
            <strong>{lowestScore}</strong>
          </div>

        </div>

        <h2>Prediction History</h2>

        {history.length === 0 ? (
          <p className="no-history">
            No predictions yet.
          </p>
        ) : (
          <>
            <table className="history-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Predicted Score</th>
                  <th>Performance</th>
                </tr>
              </thead>

              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.predicted_score}</td>
                    <td>{record.performance}</td>
                  </tr>
                ))}
              </tbody>

            </table>

            <button
              className="reset-history-btn"
              onClick={handleResetHistory}
            >
              Reset History
            </button>
          </>
        )}

      </div>

      <footer className="footer">
        <p>Student Performance Prediction System</p>
        <p>Built with React, Flask and Machine Learning</p>
      </footer>

    </div>
  );
}

export default App;