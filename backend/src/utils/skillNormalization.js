/**
 * Skill Normalization Module
 * 
 * Maps different variations of the same skill to a canonical name.
 * Examples:
 * - React, ReactJS, React.js -> "React"
 * - Node, NodeJS, Node.js -> "Node"
 * - Python, Py -> "Python"
 * - JavaScript, JS -> "JavaScript"
 * - HTML, HTML5 -> "HTML"
 * - CSS, CSS3 -> "CSS"
 */

const SYNONYM_MAP = {
  // Web Frontend Skills
  react: "React",
  "reactjs": "React",
  "react.js": "React",
  "reactjs": "React",
  
  "vue": "Vue",
  "vuejs": "Vue",
  "vue.js": "Vue",
  
  "angular": "Angular",
  "angularjs": "Angular",
  "angular.js": "Angular",
  
  "html": "HTML",
  "html5": "HTML",
  
  "css": "CSS",
  "css3": "CSS",
  
  "javascript": "JavaScript",
  "js": "JavaScript",
  
  "typescript": "TypeScript",
  "ts": "TypeScript",
  
  // Backend/Server Skills
  "node": "Node",
  "nodejs": "Node",
  "node.js": "Node",
  
  "express": "Express",
  
  "python": "Python",
  "py": "Python",
  
  "java": "Java",
  "javascript": "JavaScript",
  
  "ruby": "Ruby",
  "rails": "Ruby",
  
  "php": "PHP",
  "laravel": "PHP",
  
  "go": "Go",
  "golang": "Go",
  
  "c#": "C Sharp",
  "csharp": "C Sharp",
  "csharp.net": "C Sharp",
  
  "c++": "C Plus Plus",
  "cpp": "C Plus Plus",
  
  // Databases
  "mysql": "MySQL",
  "postgresql": "PostgreSQL",
  "postgres": "PostgreSQL",
  "mongo": "MongoDB",
  "mongodb": "MongoDB",
  "redis": "Redis",
  
  // Cloud/DevOps
  "aws": "AWS",
  "azure": "Azure",
  "gcp": "GCP",
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  
  // Mobile
  "swift": "Swift",
  "kotlin": "Kotlin",
  "java": "Java",
  "android": "Android",
  
  // Data Science/Analytics
  "sql": "SQL",
  "excel": "Excel",
  "tableau": "Tableau",
  "powerbi": "PowerBI",
  "r": "R",
  "spark": "Spark",
  
  // Tools & Others
  "git": "Git",
  "github": "Git",
  "jira": "Jira",
  "confluence": "Confluence",
  "junit": "JUnit",
  "pytest": "Pytest",
  
  // Framework variations
  "spring": "Spring",
  "spring boot": "Spring Boot",
  "laravel": "Laravel",
  "django": "Django",
  "flask": "Flask",
};

const NORMALIZE_CACHE = new Map();

/**
 * Normalize a skill name to its canonical form.
 * Returns the original input if no match is found.
 */
function normalizeSkill(skill) {
  if (!skill) return null;
  
  const lowerSkill = skill.toLowerCase().trim();
  
  // Check cache first
  if (NORMALIZE_CACHE.has(lowerSkill)) {
    return NORMALIZE_CACHE.get(lowerSkill);
  }
  
  // Direct match
  const normalized = SYNONYM_MAP[lowerSkill] || lowerSkill;
  
  // Cache the result
  NORMALIZE_CACHE.set(lowerSkill, normalized);
  
  return normalized;
}

/**
 * Normalize an array of skills.
 * Returns array of canonical skill names with duplicates removed.
 */
function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  
  const normalized = new Set();
  
  for (const skill of skills) {
    const canonical = normalizeSkill(skill);
    if (canonical) {
      normalized.add(canonical);
    }
  }
  
  return Array.from(normalized);
}

/**
 * Get all normalized skills from a Student's skills array.
 */
function getNormalizedStudentSkills(studentSkills) {
  if (!studentSkills || !Array.isArray(studentSkills)) return new Set();
  
  const normalized = new Set();
  
  for (const skill of studentSkills) {
    if (skill.name) {
      const canonical = normalizeSkill(skill.name);
      if (canonical) {
        normalized.add(canonical);
      }
    }
    if (skill.skillName) {
      const canonical = normalizeSkill(skill.skillName);
      if (canonical) {
        normalized.add(canonical);
      }
    }
  }
  
  return normalized;
}

/**
 * Get all normalized skills from a Job's skills array.
 */
function getNormalizedJobSkills(jobSkills) {
  if (!jobSkills || !Array.isArray(jobSkills)) return new Set();
  
  const normalized = new Set();
  
  for (const skill of jobSkills) {
    const canonical = normalizeSkill(skill);
    if (canonical) {
      normalized.add(canonical);
    }
  }
  
  return normalized;
}

/**
 * Check if a normalized skill is in a set of normalized skills.
 */
function skillInSet(normalizedSkill, skillSet) {
  if (!normalizedSkill || !skillSet || !(skillSet instanceof Set)) return false;
  return skillSet.has(normalizedSkill);
}

/**
 * Get the matching status between two skill sets.
 * Returns an object with matched and missing skills.
 */
function getSkillMatching(jobSkills, studentSkills) {
  const normalizedJobSkills = getNormalizedJobSkills(jobSkills);
  const normalizedStudentSkills = getNormalizedStudentSkills(studentSkills);
  
  const matched = new Set();
  const missing = new Set();
  
  // Find matched skills (skills the student has that are in the job requirements)
  for (const skill of normalizedJobSkills) {
    if (normalizedStudentSkills.has(skill)) {
      matched.add(skill);
    } else {
      missing.add(skill);
    }
  }
  
  // Also check for student skills not in job requirements (optional/preferred)
  for (const skill of normalizedStudentSkills) {
    if (!normalizedJobSkills.has(skill)) {
      // Student has skills not required - could be preferred
      if (!missing.has(skill)) {
        // This is fine - just extra skills
      }
    }
  }
  
  return {
    matched: Array.from(matched),
    missing: Array.from(missing),
    totalRequired: normalizedJobSkills.size,
    matchedCount: matched.size,
    missingCount: missing.size,
  };
}

module.exports = {
  normalizeSkill,
  normalizeSkills,
  getNormalizedStudentSkills,
  getNormalizedJobSkills,
  skillInSet,
  getSkillMatching,
};