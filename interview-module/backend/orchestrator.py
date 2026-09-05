"""
Question orchestration logic with Dynamic Topic Sampling & Zero Repetition.

Features:
- Dynamic domain & subtopic sampling across DSA, OS, Networks, DBMS, System Design, Backend, ML, Frontend.
- Randomized non-repetitive HR behavioral questions.
- Multi-dimensional slot instructions avoiding duplicate questions.
- Single-pass combined follow-up judgment + next question generation.
"""

import json
import random
from pathlib import Path
from nlp_extract import extract_resume_jd_overlap

QUESTION_BANK = json.loads(Path(__file__).parent.joinpath("question_bank.json").read_text())

CLOSING_REMARK = (
    "Thank you for your time and for sharing your answers with us today. That concludes our interview. "
    "Our hiring team will carefully review your responses, and we will let you know about the next steps very soon. Have a wonderful day!"
)

# Pool of introductory questions to ensure variety
INTRO_VARIATIONS = [
    "Welcome! To begin our interview today, could you please introduce yourself, your academic/professional background, and what areas in software engineering excite you most?",
    "Hello and welcome! Let's kick things off with a brief introduction about your journey in technology and the key projects you've been working on recently.",
    "Welcome to the interview session. Could you please give a brief overview of your background, your core technical strengths, and what motivated you to pursue this role?",
]

# Detailed Subtopic Taxonomy for rich question generation variety
SUBTOPIC_MAP = {
    "DSA": [
        "Binary Trees, BSTs & Balancing",
        "Hash Tables, Collisions & O(1) Lookups",
        "Dynamic Programming, Memoization & Tabulation",
        "Graph Algorithms (BFS/DFS, Topological Sort, Shortest Path)",
        "Heaps, Priority Queues & Top-K Elements",
        "Two Pointers & Sliding Window Optimization",
        "Stack & Queue Applications",
        "Searching, Binary Search on Rotated Arrays & Sorting Complexity",
        "Trie & Prefix Search",
    ],
    "OS": [
        "Process vs Thread Memory Isolation & IPC",
        "Deadlocks, Coffman Conditions & Prevention",
        "Virtual Memory, Paging & Page Faults",
        "CPU Scheduling Algorithms & Context Switching",
        "Concurrency, Mutexes, Semaphores & Race Conditions",
        "System Calls & Kernel vs User Space",
        "I/O Multiplexing (epoll/select) & Asynchronous I/O",
        "Memory Fragmentation & Thrashing Mitigation",
    ],
    "Computer Networks": [
        "TCP vs UDP Reliability & Connection Handshakes",
        "End-to-End URL Request Lifecycle (DNS, TCP, TLS, HTTP)",
        "DNS Hierarchy & Recursive Resolution",
        "HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)",
        "HTTPS Encryption & TLS 1.3 Handshake",
        "Reverse Proxies, Forward Proxies & CDN Caching",
        "WebSockets vs Long Polling vs Server-Sent Events",
        "Subnetting, CIDR & IP Packet Routing",
    ],
    "DBMS": [
        "ACID Properties & Transaction Durability (WAL)",
        "B-Tree vs B+ Tree Indexing & Query Plan Optimization",
        "Database Normalization (1NF to 3NF) vs Denormalization",
        "SQL vs NoSQL Tradeoffs & Data Modeling",
        "Transaction Isolation Levels & Concurrency Anomalies",
        "Database Sharding vs Master-Replica Replication",
        "N+1 Query Problem & ORM Optimization",
        "Clustered vs Non-Clustered Indexes",
    ],
    "System Design": [
        "CAP Theorem & High Availability Tradeoffs",
        "Distributed Caching Strategies & Cache Invalidation",
        "Load Balancing Algorithms & Consistent Hashing",
        "Microservices Architecture vs Modular Monolith",
        "Message Queues (Kafka/RabbitMQ) & Event-Driven Processing",
        "Distributed Rate Limiting (Token Bucket / Leaky Bucket)",
    ],
    "Backend": [
        "RESTful API Idempotency & Resource Design",
        "JWT vs Stateful Session Cookie Authentication",
        "Async Event Loops & Non-Blocking I/O Concurrency",
        "Database Connection Pooling & Resource Leaks",
        "Secure API Pagination, Filtering & Injection Defense",
    ],
    "Frontend": [
        "Virtual DOM Reconciliation & Diffing Mechanisms",
        "SSR vs CSR vs SSG Performance Tradeoffs",
        "DOM Event Bubbling, Capturing & Delegation",
        "Core Web Vitals & Bundle Size Optimization",
        "Browser Storage (Cookies vs LocalStorage vs IndexedDB)",
    ],
    "Machine Learning": [
        "Overfitting Mitigation & Regularization Techniques",
        "Bias-Variance Tradeoff & Model Evaluation Metrics",
        "Precision vs Recall vs F1-Score in Imbalanced Datasets",
        "Transformer Self-Attention Mechanism",
        "Vector Embeddings & Semantic Search Vector Databases",
    ],
}


def build_question_plan(resume_data: dict, job_description: dict) -> tuple[list[dict], dict]:
    """
    Decides a dynamic, varied 10-slot question blueprint tailored to the candidate
    and job description with high entropy so questions never repeat.
    """
    resume_text = resume_data.get("raw_text") or _flatten_resume(resume_data)
    jd_text = job_description.get("raw_text") or _flatten_jd(job_description)
    keywords = extract_resume_jd_overlap(resume_text, jd_text)

    # 1. Randomized Intro Slot
    plan = [{"type": "intro", "intro_text": random.choice(INTRO_VARIATIONS)}]

    # 2. Dynamic Core Subject Slots (3 slots) with randomized subtopics
    role_text = (job_description.get("role", "") + " " + job_description.get("title", "")).lower()
    configured_topics = job_description.get("core_topics", [])
    
    # Candidate pool of domain topics
    all_domains = list(SUBTOPIC_MAP.keys())
    if "machine learning" in role_text or "ai" in role_text or "data" in role_text:
        priority_domains = ["DSA", "Machine Learning", "DBMS", "System Design", "Backend"]
    elif "frontend" in role_text or "ui" in role_text or "web" in role_text:
        priority_domains = ["DSA", "Frontend", "Computer Networks", "System Design"]
    elif "backend" in role_text or "software" in role_text or "api" in role_text:
        priority_domains = ["DSA", "OS", "DBMS", "Computer Networks", "System Design", "Backend"]
    else:
        priority_domains = configured_topics if configured_topics else ["DSA", "OS", "Computer Networks", "DBMS", "System Design"]

    # Select 3 distinct random domains from priority domains
    selected_domains = random.sample(priority_domains, min(3, len(priority_domains)))
    while len(selected_domains) < 3:
        remaining = [d for d in all_domains if d not in selected_domains]
        selected_domains.append(random.choice(remaining))

    for domain in selected_domains:
        subtopics = SUBTOPIC_MAP.get(domain, ["Core Fundamentals"])
        chosen_subtopic = random.choice(subtopics)
        plan.append({
            "type": "core_subject",
            "topic_tag": domain,
            "subtopic": chosen_subtopic
        })

    # 3. Resume-based slots (2 slots) targeting specific projects
    projects = resume_data.get("projects", [])
    if projects:
        chosen_projects = random.sample(projects, min(2, len(projects)))
        for proj in chosen_projects:
            plan.append({"type": "resume_based", "topic_tag": f"project:{proj.get('name', 'project')}"})
    while len([p for p in plan if p["type"] == "resume_based"]) < 2:
        plan.append({"type": "resume_based", "topic_tag": "project:experience"})

    # 4. JD/Role-specific slot (1 slot)
    plan.append({"type": "jd_based", "topic_tag": job_description.get("role", "role")})

    # 5. HR Behavioral slots (2 slots) randomly sampled from HR bank
    hr_questions_total = len(QUESTION_BANK.get("HR", []))
    hr_indices = random.sample(range(hr_questions_total), min(2, hr_questions_total))
    for idx in hr_indices:
        plan.append({"type": "hr", "index": idx})

    # 6. Wrap-up slot (1 slot)
    plan.append({"type": "close"})

    return plan[:10], keywords


def _flatten_resume(resume_data: dict) -> str:
    parts = [p for p in resume_data.get("skills", [])]
    for project in resume_data.get("projects", []):
        parts.append(f"{project.get('name', '')} {project.get('description', '')} {project.get('tech_stack', '')}")
    return " ".join(parts)


def _flatten_jd(job_description: dict) -> str:
    parts = [job_description.get("role", "")] + job_description.get("required_skills", [])
    return " ".join(parts)


def _slot_instructions(session: dict, slot: dict) -> str | None:
    if not slot:
        return None
    slot_type = slot["type"]
    candidate_name = session.get("resume_data", {}).get("name", "the candidate")
    role = session.get("job_description", {}).get("role", "Software Engineer")
    asked_already = [t["text"] for t in session.get("turns", []) if t.get("speaker") == "interviewer"]

    if slot_type == "core_subject":
        topic = slot.get("topic_tag", "DSA")
        subtopic = slot.get("subtopic", "Core Fundamentals")
        return (
            f"You are a senior technical interviewer interviewing {candidate_name} for the role of '{role}'.\n"
            f"Generate ONE novel, scenario-based technical interview question testing {topic} (specific focus: {subtopic}).\n"
            "Requirements:\n"
            "- The question must be generated freshly by you. Do NOT ask textbook definitions.\n"
            "- Ask a practical problem-solving, trade-off, or architectural scenario question.\n"
            + (f"- CRITICAL: Do NOT repeat or resemble any of these already-asked questions: {asked_already}\n" if asked_already else "")
            + "- Output ONLY the question text without any quotation marks or preamble."
        )

    elif slot_type == "resume_based":
        project_name = slot["topic_tag"].split(":", 1)[-1]
        project = next((p for p in session.get("resume_data", {}).get("projects", []) if p.get("name") == project_name), {})
        overlap_skills = session.get("keywords", {}).get("overlap", [])
        return (
            f"You are a senior technical interviewer interviewing {candidate_name}.\n"
            f"Generate ONE in-depth technical question probing their project '{project.get('name', 'Key Project')}'.\n"
            f"Project description: {project.get('description', 'software development project')}. Tech stack: {project.get('tech_stack', '')}.\n"
            f"Candidate skills: {overlap_skills}.\n"
            "Ask about a specific technical hurdle, architecture decision, scaling challenge, or concurrency issue they handled.\n"
            + (f"- Do NOT repeat these already-asked questions: {asked_already}\n" if asked_already else "")
            + "Output ONLY the single question text."
        )

    elif slot_type == "jd_based":
        jd_only_skills = session.get("keywords", {}).get("jd_only", [])
        return (
            f"You are interviewing {candidate_name} for the '{role}' position.\n"
            f"Generate ONE real-world technical scenario question assessing their readiness for this job.\n"
            + (f"Focus on assessing their experience or approach to these required skills: {jd_only_skills}.\n" if jd_only_skills else
               "Ask a realistic production system scenario question assessing their depth in building systems for this role.\n")
            + (f"- Do NOT repeat these already-asked questions: {asked_already}\n" if asked_already else "")
            + "Output ONLY the single question text."
        )

    elif slot_type == "hr":
        hr_themes = [
            "handling technical disagreements with teammates",
            "overcoming a major project mistake or technical outage",
            "prioritizing tasks and delivering under tight deadline pressure",
            "taking initiative to learn a new framework or technology quickly",
            "navigating ambiguous or rapidly shifting project requirements",
            "receiving and incorporating constructive code review feedback"
        ]
        chosen_theme = random.choice(hr_themes)
        return (
            f"You are an HR and engineering hiring manager interviewing {candidate_name} for '{role}'.\n"
            f"Generate ONE targeted behavioral interview question assessing: {chosen_theme}.\n"
            "Ask the candidate to describe a real situation, the specific actions they took, and the outcome.\n"
            + (f"- Do NOT repeat these already-asked questions: {asked_already}\n" if asked_already else "")
            + "Output ONLY the single question text."
        )

    return None


def generate_next_question(session: dict) -> dict:
    slot = session["plan"][session["plan_index"]]
    slot_type = slot["type"]

    if slot_type == "intro":
        text = slot.get("intro_text", "Welcome to the interview! Could you please introduce yourself, your technical background, and what areas in software engineering excite you most?")

    elif slot_type == "close":
        text = "Do you have any questions for us about the role, our engineering culture, or anything you would like to highlight before we conclude?"

    else:
        instructions = _slot_instructions(session, slot)
        try:
            # LLM generates the question dynamically
            text = call_llm(instructions, temperature=0.82)
            # Strip any extraneous quotes if returned
            text = text.strip('"\'')
        except Exception:
            text = _pick_bank_question(slot.get("topic_tag", "DSA"))

    return {"text": text, "type": slot_type, "topic_tag": slot.get("topic_tag")}


def judge_follow_up(question_text: str, answer_text: str, question_type: str = None) -> dict:
    if question_type == "intro":
        prompt = (
            "A candidate was asked to introduce themselves. Question: "
            f"\"{question_text}\" Answer: \"{answer_text}\"\n"
            "Check if the answer covers: name, background, relevant skills/experience. "
            "If too brief (under 15 words) or missing key background, ask ONE natural conversational follow-up. "
            "Reply ONLY as JSON: {\"follow_up\": true/false, \"follow_up_question\": \"...\" or null}"
        )
    elif question_type == "hr":
        prompt = (
            "You are an HR interviewer judging a behavioral answer. Question: "
            f"\"{question_text}\" Answer: \"{answer_text}\"\n"
            "Does the answer lack a concrete result/outcome or specific action taken? "
            "If vague, ask ONE brief probing follow-up. If reasonable, follow_up is false. "
            "Reply ONLY as JSON: {\"follow_up\": true/false, \"follow_up_question\": \"...\" or null}"
        )
    else:
        prompt = (
            "You are judging a technical interview answer. Question: "
            f"\"{question_text}\" Answer: \"{answer_text}\"\n"
            "Is the answer overly brief, inaccurate, or missing a critical technical nuance that invites ONE targeted follow-up? "
            "Reply ONLY as JSON: {\"follow_up\": true/false, \"follow_up_question\": \"...\" or null}"
        )

    raw = call_llm(prompt, max_tokens=150, temperature=0.6)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"follow_up": False, "follow_up_question": None}


def judge_follow_up_and_advance(session: dict, last_question: dict, answer_text: str) -> dict:
    next_index = session["plan_index"] + 1
    next_slot = session["plan"][next_index] if next_index < len(session["plan"]) else None
    next_instructions = _slot_instructions(session, next_slot) if next_slot else None

    if not next_instructions:
        verdict = judge_follow_up(last_question["text"], answer_text, last_question.get("question_type"))
        verdict["next_question"] = None
        verdict["combined"] = False
        return verdict

    prompt = (
        "You are conducting a live interview.\n"
        f"Question just asked: \"{last_question['text']}\"\n"
        f"Candidate's answer: \"{answer_text}\"\n\n"
        "STEP 1: Decide if this answer was superficial/vague and warrants ONE targeted follow-up.\n"
        "STEP 2: If NO follow-up is needed, ALSO generate the next question using these instructions: "
        f"{next_instructions}\n\n"
        "Reply ONLY as JSON: {\"follow_up\": true/false, \"follow_up_question\": \"...\" or null, "
        "\"next_question\": \"...\" or null (fill this ONLY if follow_up is false)}"
    )
    raw = call_llm(prompt, max_tokens=220, temperature=0.8)
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"follow_up": False, "follow_up_question": None, "next_question": None}
    result["combined"] = True
    return result


def _pick_bank_question(topic: str) -> str:
    bank = QUESTION_BANK.get(topic, [])
    if not bank:
        # Fallback across all available categories
        all_questions = [q for cat in QUESTION_BANK.values() for q in cat]
        return random.choice(all_questions) if all_questions else "Can you describe a challenging technical problem you solved?"
    return random.choice(bank)


def call_llm(prompt: str, max_tokens: int = 220, temperature: float = 0.8) -> str:
    import os
    from openai import OpenAI

    client = OpenAI(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )
    response = client.chat.completions.create(
        model="google/gemma-4-26b-a4b-it:free",
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()