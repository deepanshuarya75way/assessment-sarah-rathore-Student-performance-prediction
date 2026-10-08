import pandas as pd
import numpy as np
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

# STEP 1: Load the dataset
csv_path = Path(__file__).resolve().parent / "StudentPerformanceFactors.csv"

df = pd.read_csv(csv_path)

print("Dataset shape:", df.shape)
df = df[(df["Exam_Score"] >= 0) & (df["Exam_Score"] <= 100)]

print("Dataset shape after cleaning:", df.shape)
print("\nFirst five rows:")
print(df.head())

print("\nMissing values:")
print(df.isnull().sum())


# STEP 2: Separate input features and target
X = df.drop(columns=["Exam_Score"])
y = df["Exam_Score"]

print("\nInput shape:", X.shape)
print("Output shape:", y.shape)


# STEP 3: Split into training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("\nTraining data:", X_train.shape)
print("Testing data:", X_test.shape)


# STEP 4: Identify numerical and categorical columns
categorical_columns = X.select_dtypes(
    include=["object"]
).columns.tolist()

numerical_columns = X.select_dtypes(
    include=["number"]
).columns.tolist()


# STEP 5: Prepare categorical data
# Fill missing values and convert text into numbers
categorical_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(handle_unknown="ignore")
        )
    ]
)

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            categorical_transformer,
            categorical_columns
        ),
        (
            "numerical",
            "passthrough",
            numerical_columns
        )
    ]
)


# STEP 6: Create the complete ML pipeline
model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("regressor", LinearRegression())
    ]
)


# STEP 7: Train the model
model.fit(X_train, y_train)

print("\nModel trained successfully!")


# STEP 8: Make predictions
y_pred = model.predict(X_test)

print("\nFirst five predictions:")
print(np.round(y_pred[:5], 2))

print("\nFirst five actual scores:")
print(y_test.iloc[:5].values)


# STEP 9: Evaluate the model
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("\n===== MODEL PERFORMANCE =====")
print("MAE:", round(mae, 4))
print("RMSE:", round(rmse, 4))
print("R² Score:", round(r2, 4))


import joblib

# Save the complete trained pipeline
model_path = Path(__file__).resolve().parent / "student_performance_pipeline.pkl"

joblib.dump(model, model_path)

print("\nModel saved successfully!")
print("Saved at:", model_path)

