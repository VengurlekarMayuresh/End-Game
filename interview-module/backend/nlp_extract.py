"""
Extracts keywords from resume and JD text using spaCy — noun chunks and
named entities as candidates, filtered against a curated tech/domain
skill list for precision (raw noun-chunk extraction alone is noisy).

Setup (run once):
  pip install spacy --break-system-packages
  python -m spacy download en_core_web_sm
"""

import spacy
import re
from pathlib import Path
import json

nlp = spacy.load("en_core_web_sm")

SKILL_VOCAB = json.loads(Path(__file__).parent.joinpath("skill_vocab.json").read_text())
SKILL_VOCAB_LOWER = {s.lower(): s for s in SKILL_VOCAB}


def extract_keywords(text: str) -> dict:
    """
    Returns:
      {
        "matched_skills": [...],   # exact matches against curated vocab (high precision)
        "candidate_phrases": [...] # noun chunks / entities not in vocab (for manual review /
                                    # vocab expansion — don't feed these into prompts blindly)
      }
    """
    doc = nlp(text)

    matched_skills = set()
    for skill_lower, skill_original in SKILL_VOCAB_LOWER.items():
        # word-boundary match — plain substring matching would let short
        # skills like "C" or "Go" match inside unrelated words (e.g. "Computer")
        pattern = r"(?<![A-Za-z0-9])" + re.escape(skill_lower) + r"(?![A-Za-z0-9])"
        if re.search(pattern, text.lower()):
            matched_skills.add(skill_original)

    candidate_phrases = set()
    for chunk in doc.noun_chunks:
        phrase = chunk.text.strip()
        if 2 <= len(phrase) <= 40 and phrase.lower() not in SKILL_VOCAB_LOWER:
            candidate_phrases.add(phrase)
    for ent in doc.ents:
        if ent.label_ in ("ORG", "PRODUCT", "LANGUAGE") and ent.text.lower() not in SKILL_VOCAB_LOWER:
            candidate_phrases.add(ent.text.strip())

    return {
        "matched_skills": sorted(matched_skills),
        "candidate_phrases": sorted(candidate_phrases),
    }


def extract_resume_jd_overlap(resume_text: str, jd_text: str) -> dict:
    """
    The actually useful output for question generation: skills present in
    BOTH resume and JD (safe to ask deeper questions on — candidate claims
    it, role needs it) vs JD-only (worth probing: does candidate actually
    have this?) vs resume-only (candidate's extra strengths).
    """
    resume_kw = extract_keywords(resume_text)
    jd_kw = extract_keywords(jd_text)

    resume_skills = set(resume_kw["matched_skills"])
    jd_skills = set(jd_kw["matched_skills"])

    return {
        "overlap": sorted(resume_skills & jd_skills),
        "jd_only": sorted(jd_skills - resume_skills),
        "resume_only": sorted(resume_skills - jd_skills),
        "resume_candidate_phrases": resume_kw["candidate_phrases"],
        "jd_candidate_phrases": jd_kw["candidate_phrases"],
    }
