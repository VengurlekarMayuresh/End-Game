"""
Transcript and evaluation export module.
Supports plain text (.txt), Markdown (.md), and Word document (.docx).
"""

import io
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH


def export_transcript(session: dict, fmt: str = "txt"):
    """
    Exports transcript (and evaluation report if available) in txt, md, or docx format.
    For 'docx', returns bytes. For 'txt' and 'md', returns str.
    """
    if fmt == "txt":
        return _export_txt(session)
    elif fmt in ("md", "markdown"):
        return _export_md(session)
    elif fmt == "docx":
        return _export_docx(session)
    else:
        raise NotImplementedError(f"Format '{fmt}' not supported. Choose from 'txt', 'md', 'docx'.")


def _export_txt(session: dict) -> str:
    lines = [
        "============================================================",
        "             HIRESENSE AI — INTERVIEW TRANSCRIPT            ",
        "============================================================",
        f"Candidate ID: {session.get('candidate_id', 'N/A')}",
        f"Job ID:       {session.get('job_id', 'N/A')}",
        f"Role:         {session.get('job_description', {}).get('role', 'N/A')}",
        f"Started At:   {session.get('started_at', 'N/A')}",
        f"Status:       {session.get('status', 'N/A')}",
        "============================================================\n",
    ]

    for i, turn in enumerate(session.get("turns", []), start=1):
        speaker = "Interviewer" if turn.get("speaker") == "interviewer" else "Candidate"
        q_type = f" [{turn.get('question_type')}]" if turn.get("question_type") else ""
        lines.append(f"{speaker}{q_type}:")
        lines.append(f"  {turn.get('text', '')}\n")

    eval_data = session.get("evaluation")
    if eval_data and "overall_score" in eval_data:
        lines.append("\n============================================================")
        lines.append("                  EVALUATION & ASSESSMENT                   ")
        lines.append("============================================================")
        lines.append(f"Overall Score: {eval_data.get('overall_score')}/100")
        lines.append(f"Recommendation: {eval_data.get('hiring_recommendation')}")
        lines.append(f"\nExecutive Summary:\n  {eval_data.get('executive_summary')}\n")

    return "\n".join(lines)


def _export_md(session: dict) -> str:
    lines = [
        f"# HireSense AI — Interview Session Report",
        f"- **Candidate:** `{session.get('candidate_id', 'N/A')}`",
        f"- **Role:** `{session.get('job_description', {}).get('role', 'N/A')}`",
        f"- **Status:** `{session.get('status', 'N/A')}`",
        f"- **Date:** {session.get('started_at', 'N/A')}",
        "",
        "---",
        "## Interview Transcript",
        "",
    ]

    for turn in session.get("turns", []):
        speaker = "**Interviewer**" if turn.get("speaker") == "interviewer" else "**Candidate**"
        q_type = f" *(Type: {turn.get('question_type')})*" if turn.get("question_type") else ""
        lines.append(f"{speaker}{q_type}:")
        lines.append(f"> {turn.get('text', '')}\n")

    eval_data = session.get("evaluation")
    if eval_data and "overall_score" in eval_data:
        from evaluator import format_report_markdown
        lines.append("\n---")
        lines.append(format_report_markdown(eval_data))

    return "\n".join(lines)


def _export_docx(session: dict) -> bytes:
    doc = Document()

    # Title
    title = doc.add_heading("HireSense AI — Interview Report", level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Metadata Table
    meta_p = doc.add_paragraph()
    meta_p.add_run(f"Candidate ID: {session.get('candidate_id', 'N/A')}\n").bold = True
    meta_p.add_run(f"Target Role: {session.get('job_description', {}).get('role', 'N/A')}\n")
    meta_p.add_run(f"Date: {session.get('started_at', 'N/A')} | Status: {session.get('status', 'N/A')}\n")

    # Evaluation Summary if exists
    eval_data = session.get("evaluation")
    if eval_data and "overall_score" in eval_data:
        doc.add_heading("Assessment Summary", level=1)
        score_p = doc.add_paragraph()
        score_run = score_p.add_run(f"Overall Score: {eval_data.get('overall_score')}/100  |  Recommendation: {eval_data.get('hiring_recommendation')}")
        score_run.bold = True
        score_run.font.size = Pt(13)

        doc.add_paragraph(eval_data.get("executive_summary", ""))

        # Category scores
        doc.add_heading("Competency Breakdown", level=2)
        for cat, data in eval_data.get("category_scores", {}).items():
            cat_name = cat.replace("_", " ").title()
            p = doc.add_paragraph(style='List Bullet')
            p.add_run(f"{cat_name} ({data.get('score', 0)}/10): ").bold = True
            p.add_run(str(data.get("feedback", "")))

    # Transcript Section
    doc.add_heading("Interview Transcript", level=1)
    for turn in session.get("turns", []):
        speaker = "Interviewer" if turn.get("speaker") == "interviewer" else "Candidate"
        p = doc.add_paragraph()
        run = p.add_run(f"{speaker}: ")
        run.bold = True
        if speaker == "Interviewer":
            run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)
        p.add_run(turn.get("text", ""))

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
