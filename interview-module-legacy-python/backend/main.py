"""
HireSense AI — Interview Module backend (Production-ready with SQLite DB persistence)

Endpoints:
  GET  /candidates               -> lists all candidates and their stored resumes
  POST /candidates               -> registers candidate and parses/stores their resume
  GET  /jobs                     -> lists recruiter job descriptions
  POST /jobs                     -> recruiter creates a new job posting
  POST /session/start-by-id      -> starts interview from stored candidate resume + recruiter JD
  POST /session/start           -> creates an interview session with explicit data
  POST /session/start-with-file  -> creates an interview session directly from uploaded file + JD
  POST /session/answer          -> submits candidate answer, returns next question
  GET  /session/{id}            -> returns full session state and turns
  GET  /session/{id}/transcript -> returns full transcript (txt / md / docx)
  GET  /session/{id}/report     -> returns evaluation matrix (json / markdown)
  GET  /sessions                -> lists all historical interview sessions

Run:
  python -m uvicorn main:app --reload
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()  # reads backend/.env for API keys

from orchestrator import build_question_plan, generate_next_question, judge_follow_up, judge_follow_up_and_advance, CLOSING_REMARK
from transcript import export_transcript
from voice import transcribe_audio, synthesize_speech
from evaluator import evaluate_interview, format_report_markdown
from resume_parser import extract_text_from_file, parse_resume_data, parse_job_description
from database import (
    init_db,
    db_create_session,
    db_get_session,
    db_log_turn,
    db_update_session_status,
    db_save_evaluation,
    db_list_sessions,
    db_list_candidates,
    db_get_candidate,
    db_create_candidate,
    db_list_jobs,
    db_get_job,
    db_create_job,
)
from fastapi.middleware.cors import CORSMiddleware

# Initialize DB tables & seed initial sample records
init_db()

app = FastAPI(title="HireSense AI - Interview Module")

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class StartSessionRequest(BaseModel):
    candidate_id: str
    job_id: str
    resume_data: dict      # parsed resume: {skills, projects, experience, education}
    job_description: dict  # {role, required_skills, seniority}


class StartByIdRequest(BaseModel):
    candidate_id: str
    job_id: str


class CreateJobRequest(BaseModel):
    title: str
    description: str
    department: Optional[str] = "Engineering"
    required_skills: Optional[List[str]] = []
    core_topics: Optional[List[str]] = ["DSA", "OS", "DBMS"]


class AnswerRequest(BaseModel):
    session_id: str
    answer_text: str


# -----------------------------------------------------------------------------
# 1. Candidate Records Endpoints
# -----------------------------------------------------------------------------

@app.get("/candidates")
def list_candidates():
    """Returns all candidates with stored resume records."""
    return {"candidates": db_list_candidates()}


@app.get("/candidate/{candidate_id}")
def get_candidate(candidate_id: str):
    """Retrieves full candidate record and parsed resume."""
    c = db_get_candidate(candidate_id)
    if not c:
        raise HTTPException(404, "Candidate not found")
    return c


@app.post("/candidate/upload-resume")
async def upload_candidate_resume(
    resume_file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
):
    """Parses and permanently stores a candidate's resume into the database."""
    file_bytes = await resume_file.read()
    raw_text = extract_text_from_file(file_bytes, resume_file.filename)
    parsed_data = parse_resume_data(raw_text)

    candidate_name = name or parsed_data.get("name") or "Candidate"
    candidate_id = f"cand_{candidate_name.replace(' ', '_').lower()}_{uuid4().hex[:4]}"
    candidate_email = email or f"{candidate_name.replace(' ', '.').lower()}@example.com"

    saved = db_create_candidate(
        candidate_id=candidate_id,
        name=candidate_name,
        email=candidate_email,
        resume_raw_text=raw_text,
        resume_data=parsed_data,
    )
    return {"message": "Candidate resume stored successfully", "candidate": saved}


# -----------------------------------------------------------------------------
# 2. Recruiter Job Postings Endpoints
# -----------------------------------------------------------------------------

@app.get("/jobs")
def list_jobs():
    """Returns all recruiter job descriptions stored in the system."""
    return {"jobs": db_list_jobs()}


@app.get("/job/{job_id}")
def get_job(job_id: str):
    """Retrieves a specific job description."""
    j = db_get_job(job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    return j


@app.post("/jobs")
def create_job(req: CreateJobRequest):
    """Recruiter posts a new job description."""
    parsed_jd = parse_job_description(req.description, role=req.title)
    job_id = f"job_{req.title.replace(' ', '_').lower()}_{uuid4().hex[:4]}"
    
    skills = req.required_skills if req.required_skills else parsed_jd.get("required_skills", [])
    topics = req.core_topics if req.core_topics else parsed_jd.get("core_topics", ["DSA", "OS", "DBMS"])

    saved = db_create_job(
        job_id=job_id,
        title=req.title,
        description=req.description,
        required_skills=skills,
        core_topics=topics,
        department=req.department or "Engineering",
    )
    return {"message": "Job description created successfully", "job": saved}


# -----------------------------------------------------------------------------
# 3. Interview Session Initiation (From Stored Records or Direct Input)
# -----------------------------------------------------------------------------

@app.post("/session/start-by-id")
def start_session_from_stored_records(req: StartByIdRequest):
    """
    Automated workflow: fetches candidate's stored resume from DB records
    and recruiter's stored job description from DB, then starts the interview.
    """
    candidate = db_get_candidate(req.candidate_id)
    if not candidate:
        raise HTTPException(404, f"Candidate record '{req.candidate_id}' not found")
    
    job = db_get_job(req.job_id)
    if not job:
        raise HTTPException(404, f"Job description '{req.job_id}' not found")

    res = start_session(StartSessionRequest(
        candidate_id=req.candidate_id,
        job_id=req.job_id,
        resume_data=candidate["resume_data"],
        job_description=job,
    ))
    res["candidate_name"] = candidate.get("name")
    res["role"] = job.get("title") or job.get("role")
    return res


@app.post("/session/start")
def start_session(req: StartSessionRequest):
    session_id = str(uuid4())
    plan, keywords = build_question_plan(req.resume_data, req.job_description)

    session = db_create_session(
        session_id=session_id,
        candidate_id=req.candidate_id,
        job_id=req.job_id,
        resume_data=req.resume_data,
        job_description=req.job_description,
        plan=plan,
        keywords=keywords,
    )

    first_question = generate_next_question(session)
    db_log_turn(
        session_id=session_id,
        speaker="interviewer",
        text=first_question["text"],
        question_type=first_question["type"],
        topic_tag=first_question.get("topic_tag"),
    )

    return {
        "session_id": session_id,
        "question": first_question["text"],
        "type": first_question["type"],
        "candidate_id": req.candidate_id,
        "job_id": req.job_id,
    }


@app.post("/resume/parse")
async def parse_resume_file(resume_file: UploadFile = File(...)):
    """Uploads a PDF, DOCX, or TXT resume and returns parsed skills, projects, and metadata."""
    file_bytes = await resume_file.read()
    raw_text = extract_text_from_file(file_bytes, resume_file.filename)
    parsed_data = parse_resume_data(raw_text)
    return {"filename": resume_file.filename, "parsed": parsed_data}


@app.post("/session/start-with-file")
async def start_session_with_file(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    role: str = Form("Software Engineer"),
    candidate_id: str = Form(None),
    job_id: str = Form(None),
):
    """
    Direct 1-step interview initiation from uploaded PDF/DOCX/TXT resume and JD.
    Also stores candidate profile into database.
    """
    file_bytes = await resume_file.read()
    raw_text = extract_text_from_file(file_bytes, resume_file.filename)
    resume_data = parse_resume_data(raw_text)
    jd_data = parse_job_description(job_description, role=role)

    cand_name = resume_data.get("name") or "Candidate"
    cid = candidate_id or f"cand_{cand_name.replace(' ', '_').lower()}_{uuid4().hex[:4]}"
    jid = job_id or f"job_{role.replace(' ', '_').lower()}_{uuid4().hex[:4]}"

    # Save to candidate & job tables
    db_create_candidate(cid, cand_name, f"{cand_name.lower().replace(' ', '.')}@example.com", raw_text, resume_data)
    db_create_job(jid, role, job_description, jd_data.get("required_skills", []), jd_data.get("core_topics", ["DSA", "OS", "DBMS"]))

    req = StartSessionRequest(
        candidate_id=cid,
        job_id=jid,
        resume_data=resume_data,
        job_description=jd_data,
    )
    result = start_session(req)
    result["candidate_name"] = cand_name
    result["role"] = jd_data.get("role")
    result["extracted_skills"] = resume_data.get("skills", [])
    result["required_skills"] = jd_data.get("required_skills", [])
    return result


# -----------------------------------------------------------------------------
# 4. Turn-Based Interview Interaction & Follow-ups
# -----------------------------------------------------------------------------

@app.get("/session/{session_id}/question-audio")
def get_current_question_audio(session_id: str):
    """Returns TTS audio (mp3) for the most recent interviewer turn."""
    session = db_get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    interviewer_turns = [t for t in session["turns"] if t["speaker"] == "interviewer"]
    if not interviewer_turns:
        raise HTTPException(400, "No interviewer question found to synthesize")
    
    last_turn = interviewer_turns[-1]
    audio_bytes = synthesize_speech(last_turn["text"])
    return Response(content=audio_bytes, media_type="audio/mpeg")


@app.post("/session/answer-audio")
async def submit_answer_audio(session_id: str = Form(...), audio: UploadFile = File(...)):
    """Push-to-talk: candidate's recorded audio is transcribed via Deepgram STT."""
    session = db_get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    audio_bytes = await audio.read()
    answer_text = transcribe_audio(audio_bytes, mimetype=audio.content_type or "audio/webm")

    return submit_answer(AnswerRequest(session_id=session_id, answer_text=answer_text))


@app.post("/session/answer")
def submit_answer(req: AnswerRequest):
    session = db_get_session(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # 1. Log candidate turn
    db_log_turn(req.session_id, "candidate", req.answer_text)
    session = db_get_session(req.session_id)  # refresh turns

    # 2. Judge follow-up + (when possible) generate the next question in ONE LLM call
    last_question = session["turns"][-2]  # the interviewer turn just before this answer
    verdict = judge_follow_up_and_advance(session, last_question, req.answer_text)

    # Cap consecutive follow-ups on the same topic at 2
    recent_follow_ups = 0
    for turn in reversed(session["turns"][:-1]):
        if turn["speaker"] == "interviewer" and turn.get("question_type") == "follow_up":
            recent_follow_ups += 1
        elif turn["speaker"] == "interviewer":
            break

    if verdict["follow_up"] and recent_follow_ups < 2:
        next_q = {
            "text": verdict["follow_up_question"],
            "type": "follow_up",
            "topic_tag": last_question.get("topic_tag")
        }
    else:
        new_plan_index = session["plan_index"] + 1
        if new_plan_index >= len(session["plan"]):
            db_update_session_status(req.session_id, new_plan_index, status="completed")
            db_log_turn(req.session_id, "interviewer", CLOSING_REMARK, "closing", None)
            session = db_get_session(req.session_id)
            try:
                evaluation = evaluate_interview(session)
                db_save_evaluation(req.session_id, evaluation)
            except Exception as e:
                evaluation = {"error": str(e)}
            return {
                "session_id": req.session_id,
                "status": "completed",
                "message": CLOSING_REMARK,
                "score_out_of_10": evaluation.get("overall_score"),
                "hiring_recommendation": evaluation.get("hiring_recommendation"),
                "evaluation": evaluation
            }

        db_update_session_status(req.session_id, new_plan_index, status="in_progress")
        session["plan_index"] = new_plan_index

        if verdict.get("combined") and verdict.get("next_question"):
            # already generated in the same call as the follow-up decision — no second LLM round trip
            next_slot = session["plan"][new_plan_index]
            next_q = {"text": verdict["next_question"], "type": next_slot["type"], "topic_tag": next_slot.get("topic_tag")}
        else:
            next_q = generate_next_question(session)

    db_log_turn(
        req.session_id,
        "interviewer",
        next_q["text"],
        next_q["type"],
        next_q.get("topic_tag")
    )
    return {"session_id": req.session_id, "question": next_q["text"], "type": next_q["type"]}


# -----------------------------------------------------------------------------
# 5. Reporting & Transcripts
# -----------------------------------------------------------------------------

@app.get("/session/{session_id}/report")
def get_evaluation_report(session_id: str, fmt: str = "json"):
    """
    Returns candidate evaluation report.
    Supports fmt='json' or fmt='markdown'
    """
    session = db_get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    evaluation = session.get("evaluation")
    if not evaluation:
        evaluation = evaluate_interview(session)
        db_save_evaluation(session_id, evaluation)

    if fmt == "markdown":
        return Response(content=format_report_markdown(evaluation), media_type="text/markdown")
    return {"session_id": session_id, "evaluation": evaluation}


@app.post("/session/{session_id}/evaluate")
def trigger_evaluation(session_id: str):
    """Explicitly triggers/re-calculates evaluation for a session."""
    session = db_get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    evaluation = evaluate_interview(session)
    db_save_evaluation(session_id, evaluation)
    return {"session_id": session_id, "evaluation": evaluation}


@app.get("/session/{session_id}/transcript")
def get_transcript(session_id: str, fmt: str = "txt"):
    session = db_get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    result = export_transcript(session, fmt=fmt)
    if fmt == "docx":
        return Response(
            content=result,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename=transcript_{session_id}.docx"}
        )
    elif fmt in ("md", "markdown"):
        return Response(content=result, media_type="text/markdown")
    return {"transcript": result}


@app.get("/sessions")
def list_sessions(limit: int = 50):
    """Lists recent interview sessions and their scores."""
    return {"sessions": db_list_sessions(limit=limit)}


@app.get("/session/{session_id}")
def get_session_details(session_id: str):
    """Returns full details, turns, and evaluation for a session."""
    session = db_get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


# -----------------------------------------------------------------------------
# 6. Resume Builder & Ranking Endpoints
# -----------------------------------------------------------------------------

class BuilderCandidateRequest(BaseModel):
    candidate_name: str
    candidate_email: str
    current_role: str
    years_experience: float
    skills: List[str]
    projects: List[dict] = []
    education: str = ""


class RankingRequest(BaseModel):
    candidate_id: str
    job_id: str


@app.post("/builder/candidate")
async def create_builder_candidate(req: BuilderCandidateRequest):
    """Create a candidate profile directly from the resume builder form.
    Saves to database without requiring file upload."""
    import uuid
    from datetime import datetime
    
    candidate_id = f"cand_builder_{req.candidate_name.replace(' ', '_').lower()}_{uuid4().hex[:4]}"
    candidate_email = req.candidate_email or f"{req.candidate_name.replace(' ', '.').lower()}@example.com"
    
    # Parse skills from comma-separated string
    skills_list = [s.strip() for s in req.skills.split(",") if s.strip()]
    
    # Parse projects
    projects_list = []
    for proj in req.projects:
        if isinstance(proj, str):
            parts = proj.split(":")
            if len(parts) >= 2:
                projects_list.append({
                    "name": parts[0].strip(),
                    "tech_stack": [s.strip() for s in parts[1].split(",") if s.strip()],
                    "description": ""
                })
        elif isinstance(proj, dict):
            projects_list.append({
                "name": proj.get("name", "Unknown Project"),
                "tech_stack": proj.get("tech_stack", []),
                "description": proj.get("description", "")
            })
    
    # Parse education to extract degree info
    education_degree = "Candidate"
    edu_text = req.education.lower()
    if any(k in edu_text for k in ["bachelor", "b.sc", "b.s", "be", "btech"]):
        education_degree = "Bachelor"
    elif any(k in edu_text for k in ["master", "m.sc", "m.s", "mtech"]):
        education_degree = "Master"
    elif any(k in edu_text for k in ["phd", "doctorate"]):
        education_degree = "PhD"
    
    saved = db_create_candidate(
        candidate_id=candidate_id,
        name=req.candidate_name,
        email=candidate_email,
        resume_raw_text=f"Builder-Resume: {req.candidate_name}",
        resume_data={
            "name": req.candidate_name,
            "skills": skills_list,
            "projects": projects_list,
            "education": [{"degree": education_degree}],
            "years_experience": req.years_experience,
            "source": "builder"
        }
    )
    
    return {
        "message": "Candidate profile created from builder",
        "candidate_id": candidate_id,
        "name": saved.get("name")
    }


@app.post("/builder/rank")
async def rank_candidate_against_job(req: RankingRequest):
    """Rank a saved candidate against a job posting for screening."""
    from resume_parser import parse_job_description, calculate_skill_match
    from nlp_extract import extract_keywords
    
    # Get candidate from DB
    candidate = db_get_candidate(req.candidate_id)
    if not candidate:
        raise HTTPException(404, f"Candidate '{req.candidate_id}' not found")
    
    # Get job from DB
    job = db_get_job(req.job_id)
    if not job:
        raise HTTPException(404, f"Job '{req.job_id}' not found")
    
    # Parse job description
    jd_data = parse_job_description(job["description"], role=job["title"])
    
    # Get candidate skills from stored resume data
    candidate_skills = candidate.get("resume_data", {}).get("skills", [])
    
    # Calculate skill match
    skill_match = calculate_skill_match(candidate_skills, jd_data.get("required_skills", []))
    
    # Calculate experience match
    candidate_years = candidate.get("resume_data", {}).get("years_experience", 0)
    required_years = _extract_required_experience(jd_data.get("raw_text", ""))
    experience_match = min(candidate_years / max(required_years, 1), 1.0) * 100 if required_years else 100
    
    # Calculate project relevance
    candidate_projects = candidate.get("resume_data", {}).get("projects", [])
    project_score = _calculate_project_score(candidate_projects, jd_data)
    
    # Calculate education match
    education_match = _calculate_education_match(
        candidate.get("resume_data", {}).get("education", []),
        jd_data
    )
    
    # Overall weighted score
    overall = round(
        (skill_match["match_percentage"] * 0.5) +
        (experience_match * 0.3) +
        (project_score * 0.15) +
        (education_match * 0.05), 
        2
    )
    
    # Hiring recommendation
    if overall >= 8.0:
        verdict = "Strong Hire"
    elif overall >= 6.5:
        verdict = "Interview"
    else:
        verdict = "Reject"
    
    # Generate strengths and growth areas
    strengths = _generate_strengths(candidate_skills, jd_data)
    growth = _generate_growth_areas(candidate_skills, jd_data, skill_match)
    
    return {
        "candidate_id": req.candidate_id,
        "candidate_name": candidate.get("name"),
        "job_id": req.job_id,
        "job_title": job.get("title"),
        "overall_score": overall / 10,
        "hiring_recommendation": verdict,
        "skill_match": {
            "percentage": round(skill_match["match_percentage"], 2),
            "matched_skills": skill_match["matched_skills"],
            "missing_skills": skill_match.get("missing_skills", [])
        },
        "experience_match": {
            "candidate_years": candidate_years,
            "required_years": required_years,
            "percentage": round(experience_match, 2)
        },
        "project_relevance": {
            "score": round(project_score, 2),
            "details": "Tech stack alignment with job requirements"
        },
        "education_match": {
            "score": round(education_match, 2),
            "degree": _education_match_details(candidate.get("resume_data", {}).get("education", []), jd_data)
        },
        "breakdown": {
            "strengths": strengths,
            "growth_areas": growth
        }
    }


def _extract_required_experience(jd_text: str) -> float:
    """Extract required years of experience from job description."""
    import re
    matches = re.findall(r"(\d+)\+?\s*years?|(\d+)\s*to\s*(\d+)\s*years?", jd_text, re.IGNORECASE)
    if matches:
        for m in matches:
            if m[0]:  # "5 years" or "5+ years"
                return float(m[0].rstrip("+"))
            elif m[1] and m[2]:  # "3 to 5 years"
                return (float(m[1]) + float(m[2])) / 2
    return 3.0  # default


def _calculate_project_score(candidate_projects: list, jd_data: dict) -> float:
    """Calculate project relevance score against job requirements."""
    if not candidate_projects:
        return 0.5  # neutral score if no projects
    
    required_skills = set(s.lower() for s in jd_data.get("required_skills", []))
    total_score = 0
    
    for proj in candidate_projects[:3]:  # top 3 projects
        proj_skills = set(s.lower() for s in proj.get("tech_stack", []))
        if proj_skills:
            overlap = required_skills & proj_skills
            total_score += (len(overlap) / len(required_skills)) if required_skills else 0.5
    
    return min(total_score / len(candidate_projects), 1.0) if candidate_projects else 0.5


def _calculate_education_match(education: list, jd_data: dict) -> float:
    """Calculate education match score."""
    if not education:
        return 0.5
    
    degree_keywords = ["computer science", "engineering", "bs", "ba", "ms", "phd"]
    
    edu_text = " ".join(education).lower()
    matched = sum(1 for k in degree_keywords if k in edu_text)
    
    return min(matched / len(degree_keywords), 1.0) if degree_keywords else 0.5


def _generate_strengths(candidate_skills: list, jd_data: dict) -> list:
    """Generate candidate strengths based on skill match."""
    matched = set(s.lower() for s in candidate_skills) & set(s.lower() for s in jd_data.get("required_skills", []))
    extra = set(s.lower() for s in candidate_skills) - set(s.lower() for s in jd_data.get("required_skills", []))
    
    strengths = []
    for skill in matched:
        strengths.append(f"Has required skill: {skill.title()}")
    for skill in list(extra)[:3]:
        strengths.append(f"Additional expertise: {skill.title()}")
    
    return strengths if strengths else ["Relevant technical background"]


def _generate_growth_areas(candidate_skills: list, jd_data: dict, skill_match: dict) -> list:
    """Generate growth areas based on skill gaps."""
    required = set(s.lower() for s in jd_data.get("required_skills", []))
    candidate_set = set(s.lower() for s in candidate_skills)
    gaps = required - candidate_set
    
    areas = []
    for gap in list(gaps)[:5]:
        areas.append(f"Gain experience in {gap.title()}")
    
    if not areas:
        areas.append("Deepen expertise in existing technologies")
    
    return areas


def _education_match_details(education: list, jd_data: dict) -> str:
    """Get education degree details string."""
    if not education:
        return "Not specified"
    
    degrees = [e.get("degree", "") for e in education if e.get("degree")]
    if degrees:
        return degrees[0]
    return "Not specified"
