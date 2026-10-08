import sqlite3
import json
from pathlib import Path
from datetime import datetime

BASE_DIR=Path(__file__).resolve().parent
DB_PATH=BASE_DIR/"student_predictions.db"
TRAINING_DATASET=BASE_DIR/"feedback_training_dataset.csv"
def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    connection=get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
          CREATE TABLE IF NOT EXISTS predictions (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         predicted_score REAL,
         performance TEXT
    ) 
""")
        cursor.execute("""
         CREATE TABLE IF NOT EXISTS feedback(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          prediction_id INTEGER UNIQUE NOT NULL,
          feedback TEXT,
          actual_exam_score REAL,
          input_data TEXT NOT NULL
           processed INTEGER DEFAULT 0,
           created_at TEXT NOT NULL,
           FOREIGN KEY(prediction_id)
           REFERENCES predictions(id))""")

        connection.commit()
    finally:
        connection.close()

def save_prediction(predicted_score:float, performance:str,input_data:dict):
    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute(
          "INSERT INTO predictions (predicted_score, performance) VALUES (?, ?)",
          (predicted_score, performance)
    )   

        connection.commit()
    finally:
       connection.close()

       
    
def get_predictions()->list[dict]:
    connection=get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id,predicted_score,performance FROM predictions ORDER BY id DESC")

        return cursor.fetchall()
    finally:
        connection.close()
        return [dict(row) for row in rows]

def delete_predictions():
    connection=get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("DELETE FROM predictions")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='predictions")

        connection.commit()
    finally:
        connection.close()

def save_feedback(
    prediction_id:int,feedback:str|None=None, actual_exam_score:float|None=None)->tuple[bool,str]:
    connection=get_connection()
    try:
     cursor=connection.cursor()
     cursor.execute("""SELECT * FROM predictions WHERE id=?""",(prediction_id))
     prediction=cursor.fetchone()

     if prediction is None:
        connection.close()
        return False,"Prediction Not FOUND"

    cursor.execute("""SELECT * FROM feedback WHERE prediction_id=?""",(prediction_id))
    
    if cursor.fetchone():
        connection.close()
        return False,"Feedback already submitted for this prediction"

    if(
        (feedback is None or str(feedback).strip()=="")and actual_exam_score is None
    ):
       connection.close()
       return False,"Please provide feedback and actual exam score"

    if actual_exam_score is not None:
        try:
            actual_exam_score=float(actual_exam_score)
        except(ValueError,TypeError):
            connection.close()
            return False,"Actual exam score must be between 0 and 100"

    input_data=prediction["input_data"]

    cursor.execute(f"""
      INSERT INTO feedback(
        prediction_id,
        feedback,
        actual_exam_score,
        input_data,
        processed,
        created_at) 
        VALUES(?,?,?,?,0,?)""",
        (
        prediction_id,
        feedback,
        actual_exam_score,input_data,datetime.now().isoformat()))
    connection.commit()
    connection.close()
    return True,"Feedback saved successfully"

def prepare_training_dataset():
    connection=get_connection()
    cursor=connection.cursor()

    cursor.execute("""
    SELECT id,actual_exam_score,input_data
    FROM feedback 
    WHERE processed=0""")

    rows=cursor.fetchall()

    if not rows:
        connection.close()
        return False,"No new feedback records",0

    training_rows=[]
    processed_ids=[]

    for row in rows:
        if row[actual_exam_score] is None:
            continue
        try:
            actual_exam_score=float(row["actual_exam_score)"])
        except(ValueError,TypeError):
            continue
        i
        if actual_score<0 or actual_score>100:
            continue

        try:
            input_data=json.loads(row["input_data"])
        except(json.JSONDecodeError,TypeError):
            continue

        if not isinstance(input_data,dict):
            continue
        input_data["Exam_Score"]=actual_exam_score
        training_rows.append(input_data)
        processed_ids.append(row['id'])

        if not training_rows:
            connection.close()
            return False,"No valid records found",0

        columns=lisy(training_rows[0].keys())

        with open(
            TRAINING_DATASET,"w",
            newline="",encoding="utf-8"
        )as file:
        writer=csv.DictWriter(
            file,
            fieldnames=columns
        )
        writer.writeheader()
        writer.writerows(training_rows)

        for feedback_id in processed_ids:

            cursor.execute("UPDATE feedback SET processed=1 WHERE id=?",(feedback_id))
        connection.commit()
        connection.close()


def add_input_data_column():
    connection=get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("PRAGMA table_info(predictions)")
        columns=[row[1] for row in cursor.fetchall()]
        if"input_data" not in columns:
            cursor.execute("ALTER TABLE predictions ADD COLUMN input_data TEXT")

        connection.commit()
    finally:
        connection.close()


if __name__=="__main__":
    init_db()
    add_input_data_column()
    print("database created susccefully")