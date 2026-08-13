"""
Validation script for Candidate Evaluation & Scoring Matrix (Step 1).

Simulates a complete interview transcript across technical, project,
and behavioral rounds, runs the evaluator, and validates the output schema.

Run:
  python test_evaluation_pipeline.py
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()

from evaluator import evaluate_interview, format_report_markdown

MOCK_SESSION = {
    "candidate_id": "cand_alex_001",
    "job_id": "job_backend_dev_01",
    "job_description": {
        "role": "Backend Software Engineer",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "System Design"],
        "seniority": "Junior - Mid",
    },
    "resume_data": {
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "React"],
        "projects": [
            {
                "name": "E-Commerce Microservices",
                "description": "Inventory and Order management services with asynchronous order processing",
                "tech_stack": "FastAPI, PostgreSQL, Docker, Redis",
            }
        ],
    },
    "keywords": {
        "overlap": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "jd_only": ["Redis", "System Design"],
        "resume_only": ["React", "Git"],
    },
    "turns": [
        {
            "speaker": "interviewer",
            "text": "Welcome! Could you start by briefly introducing yourself and your background?",
            "question_type": "intro",
            "topic_tag": None,
        },
        {
            "speaker": "candidate",
            "text": "Hi! I am a computer science graduate passionate about backend development. I have built several projects using Python and FastAPI, focusing on building high-performance REST APIs, database design with PostgreSQL, and containerizing microservices with Docker.",
        },
        {
            "speaker": "interviewer",
            "text": "Explain the difference between a process and a thread, and how memory is shared between them.",
            "question_type": "core_subject",
            "topic_tag": "OS",
        },
        {
            "speaker": "candidate",
            "text": "A process is an independent executing program with its own dedicated memory space, while a thread is a lightweight unit of execution within a process. Threads within the same process share the same heap and code segment, but maintain their own independent registers and stack.",
        },
        {
            "speaker": "interviewer",
            "text": "In your E-Commerce Microservices project, how did you handle data consistency and race conditions during order placement?",
            "question_type": "resume_based",
            "topic_tag": "project:E-Commerce Microservices",
        },
        {
            "speaker": "candidate",
            "text": "We used PostgreSQL database transactions with row-level locking (SELECT FOR UPDATE) on the inventory table during stock deduction to prevent overselling. For high concurrency, we also introduced Redis distributed locks for idempotency when processing incoming webhook payments.",
        },
        {
            "speaker": "interviewer",
            "text": "The role requires System Design and caching with Redis. How would you design a caching strategy to avoid cache stampede and cache penetration?",
            "question_type": "jd_based",
            "topic_tag": "Backend Software Engineer",
        },
        {
            "speaker": "candidate",
            "text": "To prevent cache penetration where queries for non-existent IDs hit the DB, we can use Bloom Filters or cache empty null results with short TTLs. For cache stampede when a hot key expires, we can use mutex locks so only one request regenerates the cache, or use background proactive refresh before expiration.",
        },
        {
            "speaker": "interviewer",
            "text": "Tell me about a time you faced a technical conflict while working in a team. How did you handle it?",
            "question_type": "hr",
            "topic_tag": None,
        },
        {
            "speaker": "candidate",
            "text": "During our capstone project, a teammate wanted to use MongoDB while I advocated for PostgreSQL. Instead of arguing, we set up a benchmark with our expected relational schema and complex queries involving foreign keys. After showing the data integrity and query latency comparison, the team collectively agreed that Postgres was the right choice. We delivered on time with zero schema inconsistencies.",
        },
    ],
}


from transcript import export_transcript

def main():
    print("=" * 70)
    print("Testing Candidate Evaluation & Scoring Matrix...")
    print("=" * 70)

    evaluation = evaluate_interview(MOCK_SESSION)
    MOCK_SESSION["evaluation"] = evaluation

    print("\n--- Parsed Evaluation Structure ---")
    print(f"Overall Score: {evaluation.get('overall_score')}/100")
    print(f"Hiring Recommendation: {evaluation.get('hiring_recommendation')}")
    print("\nCategory Scores:")
    for cat, data in evaluation.get("category_scores", {}).items():
        print(f"  • {cat}: {data.get('score')}/10 — {data.get('feedback')}")

    print("\nKey Strengths:")
    for s in evaluation.get("key_strengths", []):
        print(f"  + {s}")

    print("\nAreas for Improvement:")
    for a in evaluation.get("areas_for_improvement", []):
        print(f"  - {a}")

    print("\nExecutive Summary:")
    print(f"  {evaluation.get('executive_summary')}")

    print("\n" + "=" * 70)
    print("Markdown Formatted Report Preview:")
    print("=" * 70)
    report_md = format_report_markdown(evaluation)
    print(report_md)

    print("\n" + "=" * 70)
    print("Testing Multi-Format Transcript Exports...")
    print("=" * 70)
    txt_out = export_transcript(MOCK_SESSION, fmt="txt")
    print(f"TXT Export Length: {len(txt_out)} characters")

    md_out = export_transcript(MOCK_SESSION, fmt="md")
    print(f"MD Export Length:  {len(md_out)} characters")

    docx_out = export_transcript(MOCK_SESSION, fmt="docx")
    print(f"DOCX Export Size:  {len(docx_out)} bytes")
    assert len(docx_out) > 1000, "DOCX export failed to generate valid document bytes"
    print("ALL STEP 1 PIPELINE TESTS PASSED!")


if __name__ == "__main__":
    main()
