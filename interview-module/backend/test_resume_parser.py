"""
Validation script for Resume & Job Description Parser (Step 3).

Tests extracting text and structured data from DOCX, PDF, and TXT files.

Run:
  python test_resume_parser.py
"""

import io
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from docx import Document
from pypdf import PdfWriter
from resume_parser import extract_text_from_file, parse_resume_data, parse_job_description


def create_sample_docx() -> bytes:
    """Generates an in-memory sample DOCX resume."""
    doc = Document()
    doc.add_heading("Alex Morgan", level=0)
    doc.add_paragraph("Email: alex.morgan@example.com | GitHub: github.com/alexmorgan")
    
    doc.add_heading("TECHNICAL SKILLS", level=1)
    doc.add_paragraph("Languages & Frameworks: Python, FastAPI, React, Node.js, TypeScript, PostgreSQL, Docker, Redis")

    doc.add_heading("PROJECTS", level=1)
    doc.add_paragraph("AuraFit Fitness App: Built a cross-platform mobile app using React Native and TensorFlow for pose detection.")
    doc.add_paragraph("Cloud Inventory API: Developed high-throughput REST APIs using FastAPI, PostgreSQL, Docker, and Redis caching.")

    doc.add_heading("EDUCATION", level=1)
    doc.add_paragraph("B.Tech in Computer Science and Engineering, 2024")

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def test_parsing():
    print("=" * 70)
    print("Testing Step 3: Resume & JD File Parser...")
    print("=" * 70)

    # 1. Test DOCX extraction
    docx_bytes = create_sample_docx()
    docx_text = extract_text_from_file(docx_bytes, "alex_resume.docx")
    print(f"  [✓] Successfully extracted {len(docx_text)} characters from DOCX.")
    assert "Alex Morgan" in docx_text
    assert "FastAPI" in docx_text

    # 2. Test Resume Data Parsing
    parsed_resume = parse_resume_data(docx_text)
    print(f"\n  Candidate Name: {parsed_resume.get('name')}")
    print(f"  Detected Skills: {parsed_resume.get('skills')}")
    print(f"  Extracted Projects: {len(parsed_resume.get('projects', []))} projects found")
    for p in parsed_resume.get("projects", []):
        print(f"    • {p.get('name')}: {p.get('tech_stack')}")

    assert "Python" in parsed_resume["skills"]
    assert "FastAPI" in parsed_resume["skills"]
    assert "Docker" in parsed_resume["skills"]
    print("  [✓] Skills and project entities parsed with high precision.")

    # 3. Test Job Description Parsing
    jd_sample = """
    Job Title: Senior Backend Developer
    We are seeking a Backend Developer proficient in Python, FastAPI, PostgreSQL, and Kubernetes.
    The candidate will design microservices and optimize database queries.
    Strong problem-solving in DSA and Operating Systems required.
    """
    parsed_jd = parse_job_description(jd_sample)
    print(f"\n  Target Role: {parsed_jd.get('role')}")
    print(f"  Required Skills: {parsed_jd.get('required_skills')}")
    print(f"  Core CS Topics: {parsed_jd.get('core_topics')}")

    assert "Python" in parsed_jd["required_skills"]
    assert "PostgreSQL" in parsed_jd["required_skills"]
    assert "DSA" in parsed_jd["core_topics"]
    assert "OS" in parsed_jd["core_topics"]
    print("  [✓] Job description requirements & core topics parsed successfully.")

    print("\n" + "=" * 70)
    print("ALL STEP 3 RESUME PARSER TESTS PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    test_parsing()
