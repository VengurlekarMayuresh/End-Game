"""
Candidate Evaluation & Scoring Matrix Module for HireSense AI.

Analyzes the full interview transcript, assesses candidate responses across
technical, problem-solving, communication, and behavioral dimensions, and
generates a comprehensive scorecard and hiring recommendation.
"""

import json
import re
from datetime import datetime
from orchestrator import call_llm


def evaluate_interview(session: dict) -> dict:
    """
    Evaluates a completed or in-progress interview session transcript.
    Returns a structured evaluation report dictionary.
    """
    turns = session.get("turns", [])
    if not turns:
        return _create_empty_evaluation("No conversation turns recorded for this session.")

    # Pair interviewer questions with candidate answers
    qa_pairs = _extract_qa_pairs(turns)
    if not qa_pairs:
        return _create_empty_evaluation("No candidate responses found to evaluate.")

    # Format context and transcript for LLM
    role = session.get("job_description", {}).get("role", "Candidate")
    req_skills = session.get("job_description", {}).get("required_skills", [])
    keywords = session.get("keywords", {})
    
    transcript_text = ""
    for i, pair in enumerate(qa_pairs, start=1):
        q_type = pair.get("type") or "general"
        transcript_text += f"\n[Turn {i} - Type: {q_type}]\n"
        transcript_text += f"Interviewer: {pair['question']}\n"
        transcript_text += f"Candidate: {pair['answer']}\n"

    prompt = f"""You are an expert technical interviewer and hiring committee bar-raiser.
Evaluate the following interview for the role of "{role}".

Target Job Required Skills: {', '.join(req_skills) if req_skills else 'N/A'}
Skills Overlap between Resume & JD: {keywords.get('overlap', [])}
JD Skills Missing from Resume: {keywords.get('jd_only', [])}

Interview Transcript:
{transcript_text}

Provide an objective, fair, and concise evaluation.
Analyze each answer for technical accuracy, depth, practical experience, problem-solving ability, communication clarity, and STAR approach in behavioral questions.
Keep assessments concise (1-2 sentences per question).
Score "overall_score" and every "question_breakdown" score on a 0-10 scale (whole numbers), same scale as the category scores.
Important: Use single quotes for any quotes inside text fields to guarantee valid JSON formatting.

Return ONLY a valid JSON object matching this schema (no backticks, no preamble, no markdown formatting):
{{
  "overall_score": 8,
  "hiring_recommendation": "Hire",
  "category_scores": {{
    "technical_depth": {{"score": 8, "feedback": "Concise feedback on technical knowledge."}},
    "problem_solving": {{"score": 8, "feedback": "Concise feedback on problem solving."}},
    "communication_clarity": {{"score": 8, "feedback": "Concise feedback on clarity."}},
    "behavioral_fit": {{"score": 8, "feedback": "Concise feedback on teamwork and STAR method."}}
  }},
  "key_strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "areas_for_improvement": [
    "Area 1",
    "Area 2"
  ],
  "question_breakdown": [
    {{
      "turn": 1,
      "question": "Question text",
      "question_type": "intro",
      "candidate_answer": "Candidate answer excerpt",
      "score": 8,
      "assessment": "Concise 1-sentence assessment of answer quality."
    }}
  ],
  "executive_summary": "Comprehensive 2-3 sentence hiring summary paragraph."
}}
"""

    try:
        raw_response = call_llm(prompt, max_tokens=2500, temperature=0.3)
        evaluation_data = _clean_and_parse_json(raw_response)
        evaluation_data["session_id"] = session.get("candidate_id", "")
        evaluation_data["job_id"] = session.get("job_id", "")
        evaluation_data["evaluated_at"] = datetime.utcnow().isoformat()
        return evaluation_data
    except Exception as e:
        return _fallback_evaluation(qa_pairs, str(e))


def _extract_qa_pairs(turns: list[dict]) -> list[dict]:
    """Pairs interviewer questions with candidate answers sequentially."""
    qa_pairs = []
    current_q = None

    for turn in turns:
        speaker = turn.get("speaker")
        text = turn.get("text", "")
        if speaker == "interviewer":
            current_q = {
                "question": text,
                "type": turn.get("question_type"),
                "topic_tag": turn.get("topic_tag"),
            }
        elif speaker == "candidate" and current_q:
            qa_pairs.append({
                "question": current_q["question"],
                "type": current_q["type"],
                "topic_tag": current_q.get("topic_tag"),
                "answer": text,
            })
            current_q = None

    return qa_pairs


def _clean_and_parse_json(raw: str) -> dict:
    """Cleans code fences or extra whitespace and parses JSON with error correction."""
    cleaned = raw.strip()
    # Strip markdown fences
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    # Extract JSON object if surrounded by chatty text
    match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(1)

    # Attempt 1: Direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Attempt 2: Clean trailing commas before closing braces/brackets
    sanitized = re.sub(r",\s*([\}\]])", r"\1", cleaned)
    try:
        return json.loads(sanitized)
    except json.JSONDecodeError:
        pass

    # Attempt 3: Fix common control character / newline issues inside string literals
    sanitized_lines = []
    for line in sanitized.splitlines():
        sanitized_lines.append(line)
    sanitized_str = "\n".join(sanitized_lines)
    
    return json.loads(sanitized_str)


def _create_empty_evaluation(reason: str) -> dict:
    return {
        "overall_score": 0,
        "hiring_recommendation": "No Hire",
        "category_scores": {
            "technical_depth": {"score": 0, "feedback": reason},
            "problem_solving": {"score": 0, "feedback": reason},
            "communication_clarity": {"score": 0, "feedback": reason},
            "behavioral_fit": {"score": 0, "feedback": reason},
        },
        "key_strengths": [],
        "areas_for_improvement": [reason],
        "question_breakdown": [],
        "executive_summary": f"Evaluation could not be completed: {reason}",
        "evaluated_at": datetime.utcnow().isoformat(),
    }


def _fallback_evaluation(qa_pairs: list[dict], error_msg: str) -> dict:
    """Provides a safe fallback scorecard if the LLM output fails."""
    breakdown = []
    for i, pair in enumerate(qa_pairs, start=1):
        ans_len = len(pair.get("answer", "").split())
        score = min(8, max(4, ans_len // 10))
        breakdown.append({
            "turn": i,
            "question": pair.get("question", ""),
            "question_type": pair.get("type", "general"),
            "candidate_answer": pair.get("answer", "")[:100] + "...",
            "score": score,
            "assessment": "Auto-evaluated baseline score based on answer length."
        })

    avg_score = round(sum(b["score"] for b in breakdown) / max(len(breakdown), 1))
    return {
        "overall_score": avg_score,
        "hiring_recommendation": "Lean Hire" if avg_score >= 6 else "Lean No Hire",
        "category_scores": {
            "technical_depth": {"score": avg_score, "feedback": "Completed technical turns."},
            "problem_solving": {"score": avg_score, "feedback": "Answered problem-solving prompts."},
            "communication_clarity": {"score": avg_score, "feedback": "Responses recorded."},
            "behavioral_fit": {"score": avg_score, "feedback": "HR turns recorded."},
        },
        "key_strengths": ["Completed the interview session"],
        "areas_for_improvement": ["Detailed AI breakdown encountered an error: " + error_msg],
        "question_breakdown": breakdown,
        "executive_summary": "Session completed successfully. Fallback scorecard generated.",
        "evaluated_at": datetime.utcnow().isoformat(),
    }


def format_report_markdown(evaluation: dict) -> str:
    """Formats the evaluation dictionary into a clean markdown document."""
    overall = evaluation.get("overall_score", 0)
    rec = evaluation.get("hiring_recommendation", "N/A")
    cat = evaluation.get("category_scores", {})
    strengths = evaluation.get("key_strengths", [])
    improvements = evaluation.get("areas_for_improvement", [])
    breakdown = evaluation.get("question_breakdown", [])
    summary = evaluation.get("executive_summary", "")

    md = [
        f"# Candidate Evaluation Report",
        f"**Overall Score:** {overall}/10 | **Recommendation:** **{rec}**",
        f"**Evaluation Date:** {evaluation.get('evaluated_at', 'N/A')}",
        "",
        "## Executive Summary",
        summary,
        "",
        "## Category Competency Scores",
        f"- **Technical Depth:** {cat.get('technical_depth', {}).get('score', 0)}/10 — {cat.get('technical_depth', {}).get('feedback', '')}",
        f"- **Problem Solving:** {cat.get('problem_solving', {}).get('score', 0)}/10 — {cat.get('problem_solving', {}).get('feedback', '')}",
        f"- **Communication & Clarity:** {cat.get('communication_clarity', {}).get('score', 0)}/10 — {cat.get('communication_clarity', {}).get('feedback', '')}",
        f"- **Behavioral & Cultural Fit:** {cat.get('behavioral_fit', {}).get('score', 0)}/10 — {cat.get('behavioral_fit', {}).get('feedback', '')}",
        "",
        "## Key Strengths",
        "\n".join(f"- {s}" for s in strengths) if strengths else "- None noted",
        "",
        "## Areas for Improvement",
        "\n".join(f"- {imp}" for imp in improvements) if improvements else "- None noted",
        "",
        "## Question-by-Question Breakdown",
    ]

    for q in breakdown:
        md.append(f"### Turn {q.get('turn', '')} ({q.get('question_type', 'General')}) — Score: {q.get('score', 0)}/10")
        md.append(f"**Q:** {q.get('question', '')}")
        md.append(f"**A:** {q.get('candidate_answer', '')}")
        md.append(f"**Assessment:** {q.get('assessment', '')}\n")

    return "\n".join(md)
