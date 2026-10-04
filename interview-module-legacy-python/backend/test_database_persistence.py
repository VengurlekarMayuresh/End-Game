"""
Validation script for Database Persistence (Step 2).

Tests creating, querying, logging turns, saving evaluations,
and listing sessions from SQLite DB via SQLAlchemy.

Run:
  python test_database_persistence.py
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from uuid import uuid4
from database import (
    init_db,
    db_create_session,
    db_get_session,
    db_log_turn,
    db_update_session_status,
    db_save_evaluation,
    db_list_sessions,
)


def test_persistence():
    print("=" * 70)
    print("Testing Step 2: Database Persistence Layer (SQLite + SQLAlchemy)...")
    print("=" * 70)

    # 1. Initialize schema
    init_db()
    test_session_id = f"test_session_{uuid4().hex[:8]}"

    # 2. Create Session
    resume_data = {
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "projects": [{"name": "AuraFit", "tech_stack": "React Native, Node.js"}],
    }
    job_description = {
        "role": "Backend Engineer Intern",
        "required_skills": ["Python", "PostgreSQL", "Redis"],
    }
    plan = [{"type": "intro"}, {"type": "core_subject", "topic_tag": "DSA"}]
    keywords = {"overlap": ["Python", "PostgreSQL"], "jd_only": ["Redis"], "resume_only": ["Docker"]}

    created = db_create_session(
        session_id=test_session_id,
        candidate_id="cand_db_test_01",
        job_id="job_backend_01",
        resume_data=resume_data,
        job_description=job_description,
        plan=plan,
        keywords=keywords,
    )
    assert created is not None, "Failed to create session in DB"
    assert created["session_id"] == test_session_id
    print("  [✓] Successfully created session in SQLite database.")

    # 3. Log Interview Turns
    db_log_turn(test_session_id, "interviewer", "Welcome, introduce yourself.", question_type="intro")
    db_log_turn(test_session_id, "candidate", "Hello! I am a software engineer.")
    db_log_turn(test_session_id, "interviewer", "What is binary search complexity?", question_type="core_subject", topic_tag="DSA")
    db_log_turn(test_session_id, "candidate", "It is O(log n).")

    session_with_turns = db_get_session(test_session_id)
    assert len(session_with_turns["turns"]) == 4, f"Expected 4 turns, found {len(session_with_turns['turns'])}"
    print(f"  [✓] Successfully logged and retrieved {len(session_with_turns['turns'])} turns.")

    # 4. Update status & Save Evaluation
    db_update_session_status(test_session_id, plan_index=2, status="completed")
    eval_payload = {
        "overall_score": 90,
        "hiring_recommendation": "Strong Hire",
        "category_scores": {
            "technical_depth": {"score": 9, "feedback": "Great DSA knowledge."},
            "problem_solving": {"score": 9, "feedback": "Fast and accurate."},
            "communication_clarity": {"score": 9, "feedback": "Concise answers."},
            "behavioral_fit": {"score": 9, "feedback": "Polite and professional."},
        },
        "key_strengths": ["Clear communication", "Strong CS fundamentals"],
        "areas_for_improvement": ["Elaborate on edge cases"],
        "question_breakdown": [],
        "executive_summary": "Top performing candidate with strong algorithmic fundamentals.",
    }
    db_save_evaluation(test_session_id, eval_payload)

    completed_session = db_get_session(test_session_id)
    assert completed_session["status"] == "completed"
    assert completed_session["evaluation"]["overall_score"] == 90
    assert completed_session["evaluation"]["hiring_recommendation"] == "Strong Hire"
    print("  [✓] Successfully saved and retrieved evaluation scorecard.")

    # 5. List Sessions
    sessions_list = db_list_sessions(limit=10)
    assert len(sessions_list) >= 1
    found = any(s["session_id"] == test_session_id for s in sessions_list)
    assert found, "Created session not found in session list"
    print(f"  [✓] Successfully queried session history ({len(sessions_list)} sessions listed).")

    print("\n" + "=" * 70)
    print("ALL STEP 2 DATABASE PERSISTENCE TESTS PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    test_persistence()
