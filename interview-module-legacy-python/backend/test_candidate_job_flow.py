"""
Test script to verify Candidate Records & Recruiter Job Description workflow.

Verifies:
1. Fetching candidate records and stored resumes from SQLite DB.
2. Fetching recruiter job postings.
3. Starting an interview session automatically from candidate_id + job_id.

Run:
  python test_candidate_job_flow.py
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from database import init_db, db_list_candidates, db_get_candidate, db_list_jobs, db_get_job
from main import start_session_from_stored_records, StartByIdRequest


def main():
    print("=" * 70)
    print("Testing Candidate Records & Recruiter Job Selection Workflow...")
    print("=" * 70)

    # 1. Initialize schema & seed
    init_db()

    # 2. Check Candidate Records
    candidates = db_list_candidates()
    print(f"  [✓] Found {len(candidates)} stored candidate records:")
    for c in candidates:
        print(f"      • {c['name']} ({c['candidate_id']}) — Skills: {c['skills'][:4]}")
    assert len(candidates) >= 2, "Candidate records missing"

    # 3. Check Recruiter Job Postings
    jobs = db_list_jobs()
    print(f"\n  [✓] Found {len(jobs)} recruiter job postings:")
    for j in jobs:
        print(f"      • {j['title']} ({j['job_id']}) — Required: {j['required_skills'][:4]}")
    assert len(jobs) >= 2, "Job postings missing"

    # 4. Start Interview Session from Stored Records (Candidate + Job)
    selected_candidate = candidates[0]["candidate_id"]
    selected_job = jobs[0]["job_id"]
    print(f"\n  [➔] Starting interview for candidate '{selected_candidate}' on job '{selected_job}'...")

    result = start_session_from_stored_records(StartByIdRequest(
        candidate_id=selected_candidate,
        job_id=selected_job
    ))

    print(f"  [✓] Session created: {result['session_id']}")
    print(f"      Candidate Name: {result.get('candidate_name')}")
    print(f"      Target Role:    {result.get('role')}")
    print(f"      First Question: {result.get('question')}")
    print(f"      Question Type:  {result.get('type')}")

    assert result["session_id"] is not None
    assert result["question"] is not None

    print("\n" + "=" * 70)
    print("ALL CANDIDATE & RECRUITER STORED RECORD WORKFLOW TESTS PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    main()
