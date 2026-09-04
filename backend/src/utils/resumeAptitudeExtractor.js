const { normalizeSkill } = require('./skillNormalization');

/**
 * Extract candidate project technologies and perform skill gap analysis against JD
 * @param {Object} studentProfile - Complete student profile object (skills, projects, experience, summary)
 * @param {Object} jobDetails - Job details (title, description, requirements, skills)
 * @returns {Object} { matchedSkills, claimedUnverifiedSkills, missingSkills, projectTechStack, coreTopics }
 */
function extractSkillGapAndTopics(studentProfile, jobDetails) {
  const jdSkillSet = new Set();
  const studentSkillSet = new Set();
  const projectTechSet = new Set();

  // 1. Collect JD Skills
  if (jobDetails) {
    if (Array.isArray(jobDetails.skills)) {
      jobDetails.skills.forEach(s => {
        const norm = normalizeSkill(s);
        if (norm) jdSkillSet.add(norm);
      });
    }

    const jdText = `${jobDetails.title || ''} ${jobDetails.description || ''} ${jobDetails.requirements || ''}`.toLowerCase();
    const commonTechs = [
      'react', 'node.js', 'express', 'python', 'java', 'sql', 'postgresql', 'mongodb',
      'redis', 'docker', 'kubernetes', 'aws', 'graphql', 'rest api', 'microservices',
      'rag', 'vector database', 'embeddings', 'langchain', 'llama', 'dsa', 'system design',
      'operating systems', 'networking', 'dbms', 'oop', 'machine learning', 'ci/cd'
    ];

    commonTechs.forEach(tech => {
      if (jdText.includes(tech)) {
        jdSkillSet.add(tech);
      }
    });
  }

  // 2. Collect Candidate Skills & Project Technologies
  if (studentProfile) {
    // Explicit skills
    if (Array.isArray(studentProfile.skills)) {
      studentProfile.skills.forEach(s => {
        const name = typeof s === 'string' ? s : (s.name || '');
        const norm = normalizeSkill(name);
        if (norm) studentSkillSet.add(norm);
      });
    }

    // Projects
    if (Array.isArray(studentProfile.projects)) {
      studentProfile.projects.forEach(proj => {
        if (Array.isArray(proj.techStack)) {
          proj.techStack.forEach(tech => {
            const norm = normalizeSkill(tech);
            if (norm) {
              studentSkillSet.add(norm);
              projectTechSet.add(norm);
            }
          });
        }
        const projText = `${proj.title || ''} ${proj.description || ''}`.toLowerCase();
        if (projText.includes('rag') || projText.includes('retrieval')) projectTechSet.add('rag');
        if (projText.includes('vector') || projText.includes('pinecone') || projText.includes('chroma') || projText.includes('faiss')) projectTechSet.add('vector database');
        if (projText.includes('embed') || projText.includes('huggingface') || projText.includes('openai')) projectTechSet.add('embeddings');
        if (projText.includes('microservice') || projText.includes('docker') || projText.includes('kubernetes')) projectTechSet.add('microservices');
        if (projText.includes('redis') || projText.includes('cache')) projectTechSet.add('caching');
        if (projText.includes('graphql') || projText.includes('apollo')) projectTechSet.add('graphql');
        if (projText.includes('kafka') || projText.includes('rabbitmq') || projText.includes('queue')) projectTechSet.add('event-driven systems');
      });
    }

    // Work experience
    if (Array.isArray(studentProfile.experiences)) {
      studentProfile.experiences.forEach(exp => {
        const expText = `${exp.role || ''} ${exp.description || ''}`.toLowerCase();
        if (expText.includes('microservice')) projectTechSet.add('microservices');
        if (expText.includes('distributed')) projectTechSet.add('distributed systems');
        if (expText.includes('pipeline') || expText.includes('etl')) projectTechSet.add('data pipelines');
      });
    }
  }

  // 3. Classify Skills
  const matchedSkills = [];
  const claimedUnverifiedSkills = [];
  const missingSkills = [];

  const allJdSkillsArr = Array.from(jdSkillSet);
  const allStudentSkillsArr = Array.from(studentSkillSet);

  allJdSkillsArr.forEach(jdSkill => {
    if (allStudentSkillsArr.some(s => s.toLowerCase() === jdSkill.toLowerCase() || s.toLowerCase().includes(jdSkill.toLowerCase()))) {
      matchedSkills.push(jdSkill);
    } else {
      missingSkills.push(jdSkill);
    }
  });

  allStudentSkillsArr.forEach(studentSkill => {
    if (!allJdSkillsArr.some(j => j.toLowerCase() === studentSkill.toLowerCase() || j.toLowerCase().includes(studentSkill.toLowerCase()))) {
      claimedUnverifiedSkills.push(studentSkill);
    }
  });

  // Default fallback project technologies if candidate has fewer extracted
  const defaultTechs = ['microservices', 'caching', 'rag', 'system architecture', 'postgresql'];
  let projectTechList = Array.from(projectTechSet);

  // If candidate project tech list is sparse, fill from student skills or defaults
  if (projectTechList.length < 2) {
    studentSkillSet.forEach(s => projectTechList.push(s));
  }
  if (projectTechList.length < 2) {
    projectTechList = defaultTechs;
  }

  // Deduplicate and capitalize primary topics
  const coreTopics = Array.from(new Set(projectTechList)).slice(0, 3);

  return {
    matchedSkills: matchedSkills.slice(0, 10),
    claimedUnverifiedSkills: claimedUnverifiedSkills.slice(0, 10),
    missingSkills: missingSkills.slice(0, 10),
    projectTechStack: projectTechList.slice(0, 8),
    coreTopics
  };
}

module.exports = {
  extractSkillGapAndTopics
};
