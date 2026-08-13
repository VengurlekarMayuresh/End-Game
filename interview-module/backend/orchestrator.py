"""
Question orchestration logic.

Design: the interview plan is a fixed SEQUENCE OF SLOTS decided up front
(e.g. intro -> core_subject x3 -> resume_based x2 -> jd_based x1 -> close).
Only the actual question TEXT is generated live, using just the context
that slot needs — keeps each LLM call small and fast.

Wire in your own LLM client in `call_llm()`. Kept provider-agnostic here
so you can swap OpenAI / Claude / Groq without touching the rest of the file.
"""

import json
import random
from pathlib import Path
from nlp_extract import extract_resume_jd_overlap

QUESTION_BANK = json.loads(Path(__file__).parent.joinpath("question_bank.json").read_text())


CLOSING_REMARK = (
    "Thank you for your time and thoughtful answers today. We've noted everything you've shared, "
    "and our team will review your interview and get back to you soon regarding next steps."
)


def build_question_plan(resume_data: dict, job_description: dict) -> tuple[list[dict], dict]:
    """
    Decide the ordered sequence of question slots for this interview,
    and run NLP keyword extraction once up front (not per-question — no
    need to re-run spaCy on every turn).

    resume_data / job_description can include "raw_text" (full resume/JD
    text) for extraction. Falls back to joining structured fields if not given.
    """
    resume_text = resume_data.get("raw_text") or _flatten_resume(resume_data)
    jd_text = job_description.get("raw_text") or _flatten_jd(job_description)
    keywords = extract_resume_jd_overlap(resume_text, jd_text)

    plan = [{"type": "intro"}]  # mandatory, fixed — "introduce yourself"

    # Core subject slots — pick topics based on role, cap at 3 for time
    topics = job_description.get("core_topics", ["DSA", "OS", "Computer Networks"])
    for topic in topics[:3]:
        plan.append({"type": "core_subject", "topic_tag": topic})

    # Resume-based slots — one per notable project, cap at 2
    projects = resume_data.get("projects", [])
    for project in projects[:2]:
        plan.append({"type": "resume_based", "topic_tag": f"project:{project.get('name', 'unknown')}"})

    # JD/role-specific slot
    plan.append({"type": "jd_based", "topic_tag": job_description.get("role", "role")})

    # HR round — mandatory, fixed set, always asked in the same order for
    # standardized, comparable evaluation across candidates
    for i in range(len(QUESTION_BANK["HR"])):
        plan.append({"type": "hr", "index": i})

    plan.append({"type": "close"})
    return plan, keywords


def _flatten_resume(resume_data: dict) -> str:
    parts = [p for p in resume_data.get("skills", [])]
    for project in resume_data.get("projects", []):
        parts.append(f"{project.get('name', '')} {project.get('description', '')} {project.get('tech_stack', '')}")
    return " ".join(parts)


def _flatten_jd(job_description: dict) -> str:
    parts = [job_description.get("role", "")] + job_description.get("required_skills", [])
    return " ".join(parts)


def _slot_instructions(session: dict, slot: dict) -> str | None:
    """
    Returns generation instructions for a slot (without calling the LLM),
    or None for slots that use fixed text (intro/hr/close). Shared by
    generate_next_question() and the combined follow-up+next call so the
    two paths can't drift out of sync.
    """
    if not slot:
        return None
    slot_type = slot["type"]

    if slot_type == "core_subject":
        topic = slot["topic_tag"]
        asked_already = [t["text"] for t in session["turns"] if t.get("topic_tag") == topic]
        return (
            f"Generate ONE interview question testing core {topic} fundamentals, "
            "appropriate for a student/entry-level candidate. "
            + (f"Do NOT repeat or closely resemble these already-asked questions: {asked_already}. "
               if asked_already else "")
            + "Keep it a single, clear, answerable-in-conversation question."
        )

    elif slot_type == "resume_based":
        project_name = slot["topic_tag"].split(":", 1)[-1]
        project = next((p for p in session["resume_data"].get("projects", []) if p.get("name") == project_name), {})
        overlap_skills = session["keywords"]["overlap"]
        return (
            "Generate ONE interview question probing this candidate's project. "
            f"Project: {project.get('name')}. Description: {project.get('description', '')}. "
            f"Tech stack: {project.get('tech_stack', '')}. "
            + (f"They also listed these skills relevant to the role: {overlap_skills}. "
               if overlap_skills else "")
            + "Ask about a specific technical decision or challenge, not a generic 'tell me about it'."
        )

    elif slot_type == "jd_based":
        role = session["job_description"].get("role", "this role")
        jd_only_skills = session["keywords"]["jd_only"]
        return (
            f"Generate ONE interview question assessing fit for the role '{role}'. "
            + (f"The role requires these skills the candidate's resume does NOT clearly mention: "
               f"{jd_only_skills}. Ask whether/how they have this experience. "
               if jd_only_skills else
               "The candidate's resume already covers the role's key required skills — "
               "ask a practical, scenario-based question to verify depth, not just familiarity. ")
        )

    return None  # intro/hr/close — fixed text, no LLM needed


def generate_next_question(session: dict) -> dict:
    slot = session["plan"][session["plan_index"]]
    slot_type = slot["type"]

    if slot_type == "intro":
        text = "Welcome — could you start by briefly introducing yourself and your background?"

    elif slot_type == "hr":
        text = QUESTION_BANK["HR"][slot["index"]]

    elif slot_type == "close":
        text = "Do you have any questions for us, or anything you'd like to add before we wrap up?"

    else:
        instructions = _slot_instructions(session, slot)
        try:
            text = call_llm(instructions + " Reply with ONLY the question text, no preamble.")
        except Exception:
            text = _pick_bank_question(slot.get("topic_tag", ""))  # fallback if the LLM call fails

    return {"text": text, "type": slot_type, "topic_tag": slot.get("topic_tag")}


def judge_follow_up(question_text: str, answer_text: str, question_type: str = None) -> dict:
    """
    Small, fast classification call — decides if a follow-up is warranted.
    Keep this prompt tiny; it runs after every single answer.
    """
    if question_type == "intro":
        prompt = (
            "A candidate was asked to introduce themselves. Question: "
            f"\"{question_text}\" Answer: \"{answer_text}\"\n"
            "Check whether the answer covers these: (1) their name, (2) their educational/professional "
            "background, (3) relevant experience, (4) their current working area or domain of interest. "
            "If one or more of these is missing or too vague, ask ONE natural follow-up question "
            "targeting the most important missing piece. If all are reasonably covered, no follow-up is needed. "
            "Reply ONLY as JSON: {\"follow_up\": true/false, \"follow_up_question\": \"...\" or null}"
        )
    elif question_type == "hr":
        prompt = (
            "You are an HR interviewer cross-questioning a candidate's behavioral story. "
            f"Question: \"{question_text}\" Answer: \"{answer_text}\"\n"
            "Does the answer lack specific, concrete detail (who, what, outcome), or would a real "
            "interviewer naturally probe deeper to verify the story or learn more? "
            "If the answer is already detailed and complete, no follow-up is needed. "
            "Reply ONLY as JSON: {\"follow_up\": true/false, \"follow_up_question\": \"...\" or null}"
        )
    else:
        prompt = (
            "You are judging an interview answer. Question: "
            f"\"{question_text}\" Answer: \"{answer_text}\"\n"
            "Is the answer vague, incomplete, or does it invite one natural probing follow-up? "
            "Reply ONLY as JSON: {\"follow_up\": true/false, \"follow_up_question\": \"...\" or null}"
        )

    raw = call_llm(prompt)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"follow_up": False, "follow_up_question": None}


def judge_follow_up_and_advance(session: dict, last_question: dict, answer_text: str) -> dict:
    """
    Combines the follow-up decision AND next-question generation into ONE
    LLM call instead of two sequential ones — halves perceived latency on
    technical slots (core_subject/resume_based/jd_based), which is where
    most interview turns happen.

    Only used when the upcoming slot also needs an LLM call. Falls back to
    the plain two-step flow for intro/hr/close (fixed/cheap lookups, so
    combining wouldn't save anything there).

    Returns: {"follow_up": bool, "follow_up_question": str|None,
              "next_question": str|None, "combined": bool}
    """
    next_index = session["plan_index"] + 1
    next_slot = session["plan"][next_index] if next_index < len(session["plan"]) else None
    next_instructions = _slot_instructions(session, next_slot) if next_slot else None

    if not next_instructions:
        verdict = judge_follow_up(last_question["text"], answer_text, last_question.get("question_type"))
        verdict["next_question"] = None
        verdict["combined"] = False
        return verdict

    prompt = (
        "You are running a live interview.\n"
        f"Question just asked: \"{last_question['text']}\" Candidate's answer: \"{answer_text}\"\n\n"
        "STEP 1: Decide if this answer is vague/incomplete and deserves ONE natural follow-up before moving on.\n"
        "STEP 2: If NO follow-up is needed, ALSO generate the next interview question using these instructions: "
        f"{next_instructions}\n\n"
        "Reply ONLY as JSON: {\"follow_up\": true/false, \"follow_up_question\": \"...\" or null, "
        "\"next_question\": \"...\" or null (fill this ONLY if follow_up is false)}"
    )
    raw = call_llm(prompt)
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"follow_up": False, "follow_up_question": None, "next_question": None}
    result["combined"] = True
    return result


def _pick_bank_question(topic: str) -> str:
    """Fallback only — used if the LLM call for a core_subject question fails."""
    bank = QUESTION_BANK.get(topic, [])
    if not bank:
        return f"Can you explain a core concept from {topic}?"
    return random.choice(bank)


def call_llm(prompt: str, max_tokens: int = 200, temperature: float = 0.7) -> str:
    """
    OpenRouter — one API key, access to many models (including free ones).
    Free tier, no card required: https://openrouter.ai/keys

    Uses OpenRouter's auto-router for free models (model="openrouter/free")
    so this doesn't break if a specific free model gets rotated out —
    the free lineup on OpenRouter changes fairly often.

    Setup:
      pip install openai --break-system-packages   (OpenRouter is OpenAI-compatible)
      Add OPENROUTER_API_KEY to backend/.env
    """
    import os
    from openai import OpenAI

    client = OpenAI(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )
    response = client.chat.completions.create(
        model="openrouter/free",
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()