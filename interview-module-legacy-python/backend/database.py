"""
Database Persistence Layer for HireSense AI Interview Module.
Uses SQLite and SQLAlchemy ORM for reliable local data persistence.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    desc,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, scoped_session

DB_PATH = Path(__file__).parent / "hiresense.db"
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()


class CandidateModel(Base):
    __tablename__ = "candidates"

    candidate_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=True)
    resume_raw_text = Column(Text, nullable=True)
    resume_data_json = Column(Text, default="{}")  # {skills, projects, education}
    created_at = Column(DateTime, default=datetime.utcnow)


class JobModel(Base):
    __tablename__ = "jobs"

    job_id = Column(String(64), primary_key=True, index=True)
    title = Column(String(128), nullable=False)
    department = Column(String(64), default="Engineering")
    description = Column(Text, nullable=False)
    required_skills_json = Column(Text, default="[]")
    core_topics_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)


class SessionModel(Base):
    __tablename__ = "interview_sessions"

    session_id = Column(String(64), primary_key=True, index=True)
    candidate_id = Column(String(64), ForeignKey("candidates.candidate_id"), index=True, nullable=True)
    job_id = Column(String(64), ForeignKey("jobs.job_id"), index=True, nullable=True)
    role = Column(String(128), default="Role")
    status = Column(String(32), default="in_progress")
    plan_index = Column(Integer, default=0)
    
    resume_data_json = Column(Text, default="{}")
    job_description_json = Column(Text, default="{}")
    plan_json = Column(Text, default="[]")
    keywords_json = Column(Text, default="{}")
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    turns = relationship("TurnModel", back_populates="session", cascade="all, delete-orphan", order_by="TurnModel.id")
    evaluation = relationship("EvaluationModel", back_populates="session", uselist=False, cascade="all, delete-orphan")


class TurnModel(Base):
    __tablename__ = "interview_turns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.session_id"), index=True, nullable=False)
    speaker = Column(String(32), nullable=False)  # "interviewer" | "candidate"
    text = Column(Text, nullable=False)
    question_type = Column(String(64), nullable=True)
    topic_tag = Column(String(128), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("SessionModel", back_populates="turns")


class EvaluationModel(Base):
    __tablename__ = "interview_evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.session_id"), unique=True, index=True, nullable=False)
    overall_score = Column(Integer, default=0)
    hiring_recommendation = Column(String(64), default="N/A")
    technical_depth_score = Column(Integer, default=0)
    problem_solving_score = Column(Integer, default=0)
    communication_score = Column(Integer, default=0)
    behavioral_score = Column(Integer, default=0)
    report_json = Column(Text, default="{}")
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("SessionModel", back_populates="evaluation")


def init_db():
    """Initializes the database schema and seeds initial records if empty."""
    Base.metadata.create_all(bind=engine)
    seed_initial_records()


# -----------------------------------------------------------------------------
# Candidate & Job Operations
# -----------------------------------------------------------------------------

def db_create_candidate(candidate_id: str, name: str, email: str, resume_raw_text: str, resume_data: dict) -> dict:
    db = SessionLocal()
    try:
        cand = CandidateModel(
            candidate_id=candidate_id,
            name=name,
            email=email,
            resume_raw_text=resume_raw_text,
            resume_data_json=json.dumps(resume_data),
            created_at=datetime.utcnow(),
        )
        db.merge(cand)  # insert or update
        db.commit()
        return db_get_candidate(candidate_id)
    finally:
        db.close()


def db_get_candidate(candidate_id: str) -> Optional[dict]:
    db = SessionLocal()
    try:
        c = db.query(CandidateModel).filter(CandidateModel.candidate_id == candidate_id).first()
        if not c:
            return None
        return {
            "candidate_id": c.candidate_id,
            "name": c.name,
            "email": c.email,
            "resume_raw_text": c.resume_raw_text,
            "resume_data": json.loads(c.resume_data_json or "{}"),
            "created_at": c.created_at.isoformat() if c.created_at else "",
        }
    finally:
        db.close()


def db_list_candidates() -> list[dict]:
    db = SessionLocal()
    try:
        candidates = db.query(CandidateModel).order_by(CandidateModel.name).all()
        results = []
        for c in candidates:
            r_data = json.loads(c.resume_data_json or "{}")
            results.append({
                "candidate_id": c.candidate_id,
                "name": c.name,
                "email": c.email,
                "skills": r_data.get("skills", []),
                "projects_count": len(r_data.get("projects", [])),
                "created_at": c.created_at.isoformat() if c.created_at else "",
            })
        return results
    finally:
        db.close()


def db_create_job(job_id: str, title: str, description: str, required_skills: list, core_topics: list, department: str = "Engineering") -> dict:
    db = SessionLocal()
    try:
        job = JobModel(
            job_id=job_id,
            title=title,
            department=department,
            description=description,
            required_skills_json=json.dumps(required_skills),
            core_topics_json=json.dumps(core_topics),
            created_at=datetime.utcnow(),
        )
        db.merge(job)
        db.commit()
        return db_get_job(job_id)
    finally:
        db.close()


def db_get_job(job_id: str) -> Optional[dict]:
    db = SessionLocal()
    try:
        j = db.query(JobModel).filter(JobModel.job_id == job_id).first()
        if not j:
            return None
        return {
            "job_id": j.job_id,
            "title": j.title,
            "role": j.title,
            "department": j.department,
            "description": j.description,
            "raw_text": j.description,
            "required_skills": json.loads(j.required_skills_json or "[]"),
            "core_topics": json.loads(j.core_topics_json or "[]"),
            "created_at": j.created_at.isoformat() if j.created_at else "",
        }
    finally:
        db.close()


def db_list_jobs() -> list[dict]:
    db = SessionLocal()
    try:
        jobs = db.query(JobModel).order_by(JobModel.title).all()
        results = []
        for j in jobs:
            results.append({
                "job_id": j.job_id,
                "title": j.title,
                "role": j.title,
                "department": j.department,
                "required_skills": json.loads(j.required_skills_json or "[]"),
                "core_topics": json.loads(j.core_topics_json or "[]"),
                "description": j.description,
            })
        return results
    finally:
        db.close()


# -----------------------------------------------------------------------------
# Interview Session Operations
# -----------------------------------------------------------------------------

def db_create_session(session_id: str, candidate_id: str, job_id: str, resume_data: dict, job_description: dict, plan: list, keywords: dict) -> dict:
    """Creates a new interview session row in the database."""
    db = SessionLocal()
    try:
        role = job_description.get("role") or job_description.get("title") or "Role"
        new_session = SessionModel(
            session_id=session_id,
            candidate_id=candidate_id,
            job_id=job_id,
            role=role,
            status="in_progress",
            plan_index=0,
            resume_data_json=json.dumps(resume_data),
            job_description_json=json.dumps(job_description),
            plan_json=json.dumps(plan),
            keywords_json=json.dumps(keywords),
            started_at=datetime.utcnow(),
        )
        db.add(new_session)
        db.commit()
        return db_get_session(session_id)
    finally:
        db.close()


def db_get_session(session_id: str) -> Optional[dict]:
    """Fetches a session by session_id and converts it to a standard dictionary."""
    db = SessionLocal()
    try:
        s = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
        if not s:
            return None

        turns = [
            {
                "speaker": t.speaker,
                "text": t.text,
                "question_type": t.question_type,
                "topic_tag": t.topic_tag,
                "timestamp": t.timestamp.isoformat() if t.timestamp else "",
            }
            for t in s.turns
        ]

        evaluation = None
        if s.evaluation:
            try:
                evaluation = json.loads(s.evaluation.report_json)
            except Exception:
                evaluation = {
                    "overall_score": s.evaluation.overall_score,
                    "hiring_recommendation": s.evaluation.hiring_recommendation,
                }

        return {
            "session_id": s.session_id,
            "candidate_id": s.candidate_id,
            "job_id": s.job_id,
            "role": s.role,
            "status": s.status,
            "plan_index": s.plan_index,
            "resume_data": json.loads(s.resume_data_json or "{}"),
            "job_description": json.loads(s.job_description_json or "{}"),
            "plan": json.loads(s.plan_json or "[]"),
            "keywords": json.loads(s.keywords_json or "{}"),
            "started_at": s.started_at.isoformat() if s.started_at else "",
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "turns": turns,
            "evaluation": evaluation,
        }
    finally:
        db.close()


def db_log_turn(session_id: str, speaker: str, text: str, question_type: str = None, topic_tag: str = None) -> None:
    """Appends a turn to an interview session."""
    db = SessionLocal()
    try:
        turn = TurnModel(
            session_id=session_id,
            speaker=speaker,
            text=text,
            question_type=question_type,
            topic_tag=topic_tag,
            timestamp=datetime.utcnow(),
        )
        db.add(turn)
        db.commit()
    finally:
        db.close()


def db_update_session_status(session_id: str, plan_index: int, status: str = None) -> None:
    """Updates session progression index and status."""
    db = SessionLocal()
    try:
        s = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
        if s:
            s.plan_index = plan_index
            if status:
                s.status = status
                if status == "completed":
                    s.completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


def db_save_evaluation(session_id: str, eval_data: dict) -> None:
    """Saves or updates evaluation matrix for a session."""
    db = SessionLocal()
    try:
        s = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
        if not s:
            return

        cat_scores = eval_data.get("category_scores", {})
        existing = db.query(EvaluationModel).filter(EvaluationModel.session_id == session_id).first()
        
        overall = eval_data.get("overall_score", 0)
        rec = eval_data.get("hiring_recommendation", "N/A")
        tech = cat_scores.get("technical_depth", {}).get("score", 0)
        prob = cat_scores.get("problem_solving", {}).get("score", 0)
        comm = cat_scores.get("communication_clarity", {}).get("score", 0)
        behav = cat_scores.get("behavioral_fit", {}).get("score", 0)
        report_str = json.dumps(eval_data)

        if existing:
            existing.overall_score = overall
            existing.hiring_recommendation = rec
            existing.technical_depth_score = tech
            existing.problem_solving_score = prob
            existing.communication_score = comm
            existing.behavioral_score = behav
            existing.report_json = report_str
            existing.evaluated_at = datetime.utcnow()
        else:
            eval_record = EvaluationModel(
                session_id=session_id,
                overall_score=overall,
                hiring_recommendation=rec,
                technical_depth_score=tech,
                problem_solving_score=prob,
                communication_score=comm,
                behavioral_score=behav,
                report_json=report_str,
                evaluated_at=datetime.utcnow(),
            )
            db.add(eval_record)
        
        db.commit()
    finally:
        db.close()


def db_list_sessions(limit: int = 50) -> list[dict]:
    """Lists recent interview sessions."""
    db = SessionLocal()
    try:
        sessions = db.query(SessionModel).order_by(desc(SessionModel.started_at)).limit(limit).all()
        results = []
        for s in sessions:
            results.append({
                "session_id": s.session_id,
                "candidate_id": s.candidate_id,
                "job_id": s.job_id,
                "role": s.role,
                "status": s.status,
                "started_at": s.started_at.isoformat() if s.started_at else "",
                "overall_score": s.evaluation.overall_score if s.evaluation else None,
                "hiring_recommendation": s.evaluation.hiring_recommendation if s.evaluation else None,
                "turn_count": len(s.turns),
            })
        return results
    finally:
        db.close()


def seed_initial_records():
    """Pre-populates sample candidates with resumes and job postings if database is fresh."""
    db = SessionLocal()
    try:
        if db.query(CandidateModel).count() == 0:
            # 1. Candidate: Alex Morgan
            c1_resume = {
                "name": "Alex Morgan",
                "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "React"],
                "projects": [
                    {
                        "name": "AuraFit Fitness Platform",
                        "description": "Cross-platform mobile fitness app with real-time pose analysis.",
                        "tech_stack": "React Native, TensorFlow, FastAPI",
                    },
                    {
                        "name": "E-Commerce Microservices",
                        "description": "High-throughput order processing and inventory locking.",
                        "tech_stack": "FastAPI, PostgreSQL, Docker, Redis",
                    }
                ],
                "education": [{"degree": "B.Tech in Computer Science, 2024"}]
            }
            cand1 = CandidateModel(
                candidate_id="cand_alex_morgan",
                name="Alex Morgan",
                email="alex.morgan@example.com",
                resume_raw_text="Alex Morgan. Skills: Python, FastAPI, PostgreSQL, Docker, Redis, React. Projects: AuraFit, E-Commerce Microservices.",
                resume_data_json=json.dumps(c1_resume),
            )

            # 2. Candidate: Priya Sharma
            c2_resume = {
                "name": "Priya Sharma",
                "skills": ["Python", "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NLP", "OpenCV"],
                "projects": [
                    {
                        "name": "Student Placement Predictor",
                        "description": "Predicting university placement outcomes with 92% accuracy.",
                        "tech_stack": "Python, scikit-learn, Pandas",
                    },
                    {
                        "name": "Medical Document Extractor",
                        "description": "Named entity extraction from clinical text.",
                        "tech_stack": "Python, spaCy, PyTorch",
                    }
                ],
                "education": [{"degree": "B.Tech in Data Science & AI, 2024"}]
            }
            cand2 = CandidateModel(
                candidate_id="cand_priya_sharma",
                name="Priya Sharma",
                email="priya.sharma@example.com",
                resume_raw_text="Priya Sharma. Skills: Python, TensorFlow, PyTorch, scikit-learn, Pandas, NLP, OpenCV.",
                resume_data_json=json.dumps(c2_resume),
            )

            db.add_all([cand1, cand2])

        if db.query(JobModel).count() == 0:
            # 1. Job: Backend Engineer
            job1 = JobModel(
                job_id="job_backend_dev",
                title="Backend Software Engineer",
                department="Engineering",
                description="We are seeking a Backend Software Engineer proficient in Python, FastAPI, PostgreSQL, and Docker. Experience with Redis caching and REST API design required. Strong CS fundamentals in DSA and Operating Systems.",
                required_skills_json=json.dumps(["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"]),
                core_topics_json=json.dumps(["DSA", "OS", "DBMS"]),
            )

            # 2. Job: Machine Learning Engineer
            job2 = JobModel(
                job_id="job_ml_engineer",
                title="Machine Learning Engineer Intern",
                department="AI Research",
                description="Looking for an ML Engineer with hands-on experience in Python, PyTorch or TensorFlow, Pandas, and NLP. Exposure to computer vision and model deployment is a plus.",
                required_skills_json=json.dumps(["Python", "PyTorch", "TensorFlow", "Pandas", "NLP"]),
                core_topics_json=json.dumps(["DSA", "Machine Learning", "Python"]),
            )

            db.add_all([job1, job2])

        db.commit()
    finally:
        db.close()
