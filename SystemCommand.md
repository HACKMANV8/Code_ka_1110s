# Drishti - New Feature Implementation Plan

This document outlines the plan for extending the Drishti platform with new functionality for exam creation, enhanced database design, and advanced student performance analytics.

## 1. Enhanced Database Schema (Normalized Design)

As per your analysis, we will implement the "Normalized Design" (Approach 2) for maximum flexibility and scalability. This modifies and extends the existing database schema.

### New Table: `Questions`

This table stores individual questions, linking them to a specific exam.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Unique identifier for the question. |
| `exam_id` | `uuid` (FK) | Foreign key referencing `Exams.id`. |
| `question_text` | `text` | The full text of the question. |
| `question_type` | `text` | e.g., 'multiple-choice', 'true-false', 'text'. |
| `sort_order` | `int` | The display order of the question within the exam. |

### New Table: `Options`

This table stores all possible answers for a given question, allowing for any number of options.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Unique identifier for the option. |
| `question_id` | `uuid` (FK) | Foreign key referencing `Questions.id`. |
| `option_text` | `text` | The text for this answer choice (e.g., "Paris", "True"). |
| `is_correct` | `boolean` | `true` if this is a correct answer. `false` otherwise. |

### New Table: `StudentAnswers`

This table is essential for storing a student's response to each question, enabling grading and performance analysis.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Unique identifier for the answer. |
| `session_id` | `uuid` (FK) | Foreign key referencing `ExamSessions.id`. |
| `question_id` | `uuid` (FK) | Foreign key referencing `Questions.id`. |
| `selected_option_id` | `uuid` (FK) | Foreign key to `Options.id` (for MCQs). `NULL` for text. |
| `answer_text` | `text` | The student's written answer (for 'text' type). `NULL` for MCQs. |

---

## 2. New Admin Functionality: Exam Creation

This feature will enable users with the `admin` role to create new exams and populate them with questions.

### 2.1. API Endpoint: `POST /api/admin/exam`

* **Purpose**: A secure API route for creating a new exam and its associated questions/options.
* **Authentication**: The endpoint must verify the user is an admin by checking their `role` in the `profiles` table.
* **Request Body (Example)**:
    ```json
    {
      "title": "Introduction to AI",
      "description": "Midterm exam for CS101",
      "duration_minutes": 60,
      "start_time": "2025-11-10T09:00:00Z",
      "end_time": "2025-11-10T17:00:00Z",
      "questions": [
        {
          "question_text": "What is the capital of France?",
          "question_type": "multiple-choice",
          "options": [
            { "option_text": "Paris", "is_correct": true },
            { "option_text": "London", "is_correct": false },
            { "option_text": "Berlin", "is_correct": false }
          ]
        },
        {
          "question_text": "Explain the concept of machine learning.",
          "question_type": "text"
        }
      ]
    }
    ```
* **Logic**: The endpoint will use a Supabase transaction to:
    1.  Create the `Exam` record.
    2.  Loop through the `questions` array and create a `Questions` record for each, linking it to the new `exam_id`.
    3.  For each question, loop through its `options` array and create the `Options` records, linking them to the new `question_id`.

### 2.2. Frontend: New Admin Page (e.g., `/admin/create-exam`)

* **Location**: A new page accessible from the Admin Dashboard (`/admin`).
* **Functionality**:
    * A form for basic exam details (title, duration, start/end times).
    * A dynamic, nested form component that allows an admin to:
        * Add one or more questions.
        * For each question, select a type (e.g., "Multiple Choice", "Text").
        * For "Multiple Choice" questions, dynamically add/remove option fields and mark one or more as `is_correct`.
    * On submission, this page will send the structured JSON (see 2.1) to the new API endpoint.

---

## 3. New Student Functionality: Performance Dashboard

This feature provides students with a dedicated dashboard to analyze their historical exam performance.

### 3.1. API Endpoint: `GET /api/student/performance`

* **Purpose**: Securely fetch all historical performance data for the currently logged-in student.
* **Authentication**: The endpoint will use the student's Supabase session to get their `user_id`.
* **Logic**:
    1.  Fetch all `ExamSessions` for the `student_id` where `submitted_at` is not `NULL`.
    2.  Join with the `Exams` table to get exam details (title, date).
    3.  For each session, query the `StudentAnswers` table to count correct vs. incorrect answers (by joining with `Options.is_correct`).
    4.  Return an array of performance objects.
* **Response Body (Example)**:
    ```json
    [
      {
        "session_id": "uuid-...",
        "exam_title": "Introduction to AI",
        "submitted_at": "2025-11-10T10:00:00Z",
        "final_cheat_score": 15, // From ExamSessions
        "status": "flagged", // From ExamSessions
        "accuracy": 80.0 // (e.g., 8/10 correct)
      },
      {
        "session_id": "uuid-...",
        "exam_title": "History 101",
        "submitted_at": "2025-10-20T14:30:00Z",
        "final_cheat_score": 5,
        "status": "submitted",
        "accuracy": 95.0
      }
    ]
    ```

### 3.2. Frontend: New Student Page (e.g., `/dashboard/performance`)

* **Location**: A new tab or link within the Student Dashboard (`/dashboard`).
* **Functionality**:
    * **Historical Exam Table**: A table listing all completed exams, showing the Exam Title, Date, Accuracy, and Final Cheat Score.
    * **Performance Charts**:
        * A line chart tracking "Cheat Score Over Time" to visualize proctoring trends.
        * A bar chart showing "Accuracy by Exam" to track academic performance.
    * Clicking on an exam in the table could navigate to a detailed results page.

---

## 4. New Feature: "Analyze with AI" (Post-Exam Analysis)

This feature addresses the request for AI analysis, re-interpreting it as AI-powered feedback for students on their completed exams.

### 4.1. API Endpoint: `POST /api/exam/analyze-answers`

* **Purpose**: To provide AI-driven feedback on a student's answers for a specific exam.
* **Trigger**: A button on the student's performance dashboard (see 3.2) next to a completed exam.
* **Request Body**:
    ```json
    {
      "session_id": "uuid-of-exam-session-to-analyze"
    }
    ```
* **Logic**:
    1.  Verify the `session_id` belongs to the logged-in student.
    2.  Fetch all `StudentAnswers` for that session.
    3.  Fetch the corresponding `Questions` and `Options` (to find the correct answers).
    4.  **For Text Answers**:
        * For each text-based question, create a prompt for a generative AI model (e.g., via an API call).
        * **Prompt Example**: "Analyze the following student's answer for completeness and accuracy. Question: 'Explain machine learning.' Correct Answer Concepts: '...' Student Answer: '...'"
        * Return the AI-generated feedback.
    5.  **For MCQs**:
        * Simply return the correct answer vs. the student's selected answer.
* **Response**: Returns a detailed breakdown of each question, the student's answer, the correct answer, and (for text) AI-generated feedback.