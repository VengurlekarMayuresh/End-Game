"""
Day 1 validation: run keyword extraction on 5 sample resume/JD pairs and
inspect the output BEFORE wiring this into question generation prompts.
Look at candidate_phrases especially — that's what tells you if
SKILL_VOCAB in skill_vocab.json needs expanding.

Run: python test_nlp_pipeline.py
"""

from nlp_extract import extract_resume_jd_overlap

SAMPLES = [
    {
        "label": "Backend Developer",
        "resume": """
            Final year Computer Science student with hands-on experience in
            backend development. Built AuraFit, a React Native fitness app
            with a Node.js and Express backend, using PostgreSQL for data
            storage and Redis for caching. Familiar with Docker and basic
            AWS deployment. Strong fundamentals in Data Structures, Algorithms,
            and Operating Systems from coursework.
        """,
        "jd": """
            We are looking for a Backend Developer Intern with experience in
            Node.js and REST API design. Familiarity with PostgreSQL or
            MongoDB is required. Experience with Docker and CI/CD pipelines
            is a plus. Strong understanding of Data Structures and
            Computer Networks fundamentals expected.
        """,
    },
    {
        "label": "Frontend Developer",
        "resume": """
            Built several React and Next.js projects including an e-commerce
            dashboard using Redux for state management and Tailwind CSS for
            styling. Comfortable with TypeScript and REST API integration.
            Some exposure to GraphQL in a college project.
        """,
        "jd": """
            Frontend Developer role requiring strong React skills, experience
            with TypeScript, and familiarity with modern CSS frameworks like
            Tailwind CSS. Next.js experience preferred. Knowledge of GraphQL
            and testing frameworks is a bonus.
        """,
    },
    {
        "label": "ML/Data Role",
        "resume": """
            Worked on a machine learning project predicting student placement
            outcomes using scikit-learn and Pandas. Familiar with TensorFlow
            for a computer vision mini-project involving OpenCV for face
            detection. Solid grasp of Python and basic NLP concepts.
        """,
        "jd": """
            Looking for a Machine Learning intern with strong Python skills.
            Experience with TensorFlow or PyTorch required. Exposure to
            Computer Vision (OpenCV) and NLP is a strong plus. Familiarity
            with Pandas and NumPy for data processing expected.
        """,
    },
    {
        "label": "Full Stack",
        "resume": """
            Developed HireSense AI, a recruitment automation platform, using
            React for the frontend and FastAPI for the backend, with
            PostgreSQL as the database. Used JWT for authentication and
            deployed via Docker on AWS. Comfortable with Git and basic
            Kubernetes concepts.
        """,
        "jd": """
            Full Stack Developer role requiring React and a Python backend
            framework (FastAPI or Django). Must understand REST APIs, JWT
            authentication, and containerization with Docker. AWS or GCP
            experience preferred. Familiarity with Kubernetes is a bonus.
        """,
    },
    {
        "label": "Mobile Developer",
        "resume": """
            Built AuraFit, a cross-platform fitness app using React Native
            with real-time pose detection powered by TensorFlow. Integrated
            Firebase for authentication and data storage. Some backend work
            using Node.js and Express for API endpoints.
        """,
        "jd": """
            Mobile Developer position focused on React Native. Experience
            integrating Firebase (auth, Firestore) required. Bonus points
            for exposure to on-device ML (TensorFlow Lite) and basic
            Node.js backend familiarity.
        """,
    },
]


def run():
    for sample in SAMPLES:
        result = extract_resume_jd_overlap(sample["resume"], sample["jd"])
        print(f"\n{'=' * 60}\n{sample['label']}\n{'=' * 60}")
        print(f"Overlap (resume + JD both):  {result['overlap']}")
        print(f"JD-only (worth probing):     {result['jd_only']}")
        print(f"Resume-only (extra strength): {result['resume_only']}")
        print(f"Resume candidate phrases (review these): {result['resume_candidate_phrases'][:8]}")


if __name__ == "__main__":
    run()
