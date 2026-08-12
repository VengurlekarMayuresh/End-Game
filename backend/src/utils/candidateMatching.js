const { normalizeSkill } = require('./skillNormalization');
const { computeTFIDFSimilarity, extractTerms } = require('./jobAnalysis');

/**
 * Compute the total years of experience from student's experience entries
 */
function calculateTotalExperienceYears(experiences) {
  if (!experiences || !Array.isArray(experiences) || experiences.length === 0) return 0;

  let totalYears = 0;
  const today = new Date();

  for (const exp of experiences) {
    if (exp.startDate) {
      const start = new Date(exp.startDate);
      const end = exp.isCurrent || !exp.endDate ? today : new Date(exp.endDate);
      const diffMs = Math.abs(end - start);
      const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      totalYears += diffYears;
    }
  }

  return parseFloat(totalYears.toFixed(2));
}

/**
 * Match skills between job requirements and candidate profile
 */
function matchSkills(jobSkills, studentSkills, jobTechFromDescription) {
  const allJobSkills = new Set();
  const allStudentSkills = new Set();

  // Add skills from job's skills array
  if (Array.isArray(jobSkills)) {
    jobSkills.forEach(s => {
      const normalized = normalizeSkill(s);
      if (normalized) allJobSkills.add(normalized.toLowerCase());
    });
  }

  // Add skills extracted from job description
  if (jobTechFromDescription && Array.isArray(jobTechFromDescription)) {
    jobTechFromDescription.forEach(s => {
      const normalized = normalizeSkill(s);
      if (normalized) allJobSkills.add(normalized.toLowerCase());
    });
  }

  // Add student's skills
  if (Array.isArray(studentSkills)) {
    studentSkills.forEach(s => {
      const skillName = typeof s === 'string' ? s : (s.name || s.skillName || '');
      const normalized = normalizeSkill(skillName);
      if (normalized) allStudentSkills.add(normalized.toLowerCase());
    });
  }

  const matchedList = [];
  const partiallyMatched = [];
  const missingList = [];

  allJobSkills.forEach(jobSkill => {
    let matched = false;
    let partial = false;

    // Check exact match
    if (allStudentSkills.has(jobSkill)) {
      matched = true;
    } else {
      // Check partial match (substring)
      for (const studentSkill of allStudentSkills) {
        if (jobSkill.includes(studentSkill) || studentSkill.includes(jobSkill)) {
          partial = true;
          break;
        }
      }
    }

    if (matched) {
      matchedList.push(jobSkill);
    } else if (partial) {
      partiallyMatched.push(jobSkill);
    } else {
      missingList.push(jobSkill);
    }
  });

  const total = allJobSkills.size;
  const matchedCount = matchedList.length + partiallyMatched.length * 0.5;
  const matchPercentage = total > 0 ? (matchedCount / total) * 100 : 100;

  let explanation = '';
  if (matchedList.length > 0) {
    explanation += `Matched skills: ${matchedList.join(', ')}. `;
  }
  if (partiallyMatched.length > 0) {
    explanation += `Partially matched skills: ${partiallyMatched.join(', ')}. `;
  }
  if (missingList.length > 0) {
    explanation += `Missing skills: ${missingList.join(', ')}.`;
  }

  return {
    matched: matchedList,
    partiallyMatched,
    missing: missingList,
    total,
    matchPercentage,
    score: matchPercentage,
    explanation,
  };
}

/**
 * Match experience requirements
 */
function matchExperience(jobExperience, studentExperiences) {
  const minYears = jobExperience?.minYears || 0;
  const maxYears = jobExperience?.maxYears || null;
  const experienceLevel = jobExperience?.experienceLevel || null;

  if (minYears === 0 && !experienceLevel) {
    return {
      matched: true,
      matchLevel: 'fully',
      candidateYears: 0,
      explanation: 'No specific experience requirement identified.',
      score: 100,
    };
  }

  const candidateYears = calculateTotalExperienceYears(studentExperiences);

  let matchLevel = 'fully';
  let score = 100;
  let explanation = '';

  if (minYears > 0) {
    if (candidateYears >= minYears) {
      if (maxYears && candidateYears > maxYears) {
        matchLevel = 'partial';
        score = 50;
        explanation = `Candidate has ${candidateYears} years experience, exceeds maximum ${maxYears} years.`;
      } else {
        matchLevel = 'fully';
        score = 100;
        explanation = `Candidate has ${candidateYears} years experience (required: ${minYears}-${maxYears || 'any'} years).`;
      }
    } else if (candidateYears > 0) {
      matchLevel = 'partial';
      score = (candidateYears / minYears) * 70;
      explanation = `Candidate has ${candidateYears} years experience (required: ${minYears}-${maxYears || 'any'} years). Partial match.`;
    } else {
      matchLevel = 'missing';
      score = 0;
      explanation = `Candidate has no relevant experience (required: ${minYears}-${maxYears || 'any'} years).`;
    }
  }

  // Factor in experience level
  if (experienceLevel && matchLevel === 'fully') {
    // We'll keep the score as is since we've already matched on years
  }

  return {
    matched: matchLevel === 'fully' || matchLevel === 'partial',
    matchLevel,
    candidateYears,
    minYears,
    maxYears,
    experienceLevel,
    explanation,
    score,
  };
}

/**
 * Match education requirements
 */
function matchEducation(jobEducation, studentEducation) {
  if (!jobEducation || (!jobEducation.degrees?.length && !jobEducation.requiredFields?.length)) {
    return {
      matched: true,
      matchLevel: 'fully',
      explanation: 'No specific education requirement identified.',
      score: 100,
    };
  }

  const requiredDegrees = jobEducation.degrees || [];
  const requiredFields = jobEducation.requiredFields || [];

  const studentDegrees = Array.isArray(studentEducation)
    ? studentEducation.map(e => (e.degree || '').toLowerCase())
    : [];

  const studentBranches = Array.isArray(studentEducation)
    ? studentEducation.map(e => (e.branch || '').toLowerCase())
    : [];

  // Check degree match
  let degreeMatch = requiredDegrees.length === 0 ? true : false;
  if (!degreeMatch && studentDegrees.length > 0) {
    degreeMatch = requiredDegrees.some(reqDegree =>
      studentDegrees.some(deg => {
        if (deg === reqDegree) return true;
        // Substring containment only when both terms are reasonably specific
        if (deg.length >= 5 && reqDegree.length >= 5) {
          return deg.includes(reqDegree) || reqDegree.includes(deg);
        }
        return false;
      })
    );
  }

  // Check field match
  let fieldMatch = requiredFields.length === 0 ? true : false;
  if (!fieldMatch && (studentBranches.length > 0 || studentDegrees.length > 0)) {
    fieldMatch = requiredFields.some(reqField =>
      studentBranches.some(branch => branch.includes(reqField)) ||
      studentDegrees.some(deg => deg.includes(reqField))
    );
  }

  let matchLevel = 'fully';
  let score = 100;
  let explanation = '';

  if (requiredDegrees.length > 0 || requiredFields.length > 0) {
    if (degreeMatch && fieldMatch) {
      explanation = 'Education requirements satisfied.';
      matchLevel = 'fully';
      score = 100;
    } else if (degreeMatch || fieldMatch) {
      explanation = 'Education partially matched. ';
      if (!degreeMatch) explanation += `Missing degree: ${requiredDegrees.join(', ')}.`;
      if (!fieldMatch) explanation += `Missing field: ${requiredFields.join(', ')}.`;
      matchLevel = 'partial';
      score = 50;
    } else {
      explanation = 'Education requirements not met.';
      if (requiredDegrees.length > 0) explanation += ` Need: ${requiredDegrees.join(', ')}.`;
      if (requiredFields.length > 0) explanation += ` Need field: ${requiredFields.join(', ')}.`;
      matchLevel = 'missing';
      score = 0;
    }
  }

  return {
    matched: matchLevel === 'fully' || matchLevel === 'partial',
    matchLevel,
    explanation,
    score,
    degreeMatch,
    fieldMatch,
  };
}

/**
 * Match certifications
 */
function matchCertifications(jobCertifications, studentCertifications) {
  if (!jobCertifications || jobCertifications.length === 0) {
    return {
      matched: [],
      missing: [],
      total: 0,
      matchPercentage: 100,
      explanation: 'No certifications required.',
      score: 100,
    };
  }

  const studentCertNames = Array.isArray(studentCertifications)
    ? studentCertifications.map(c => ((c.title || '') + ' ' + (c.organization || '')).toLowerCase())
    : [];

  const matched = [];
  const missing = [];

  jobCertifications.forEach(jobCert => {
    const jobCertLower = jobCert.toLowerCase();
    const found = studentCertNames.some(cert =>
      cert.includes(jobCertLower) || jobCertLower.includes(cert)
    );
    if (found) {
      matched.push(jobCert);
    } else {
      missing.push(jobCert);
    }
  });

  const total = jobCertifications.length;
  const matchPercentage = (matched.length / total) * 100;
  const score = matchPercentage;

  let explanation = '';
  if (matched.length > 0) {
    explanation += `Matched certification(s): ${matched.join(', ')}. `;
  }
  if (missing.length > 0) {
    explanation += `Missing certification(s): ${missing.join(', ')}.`;
  }
  if (matched.length === 0 && missing.length === 0) {
    explanation = 'All certifications matched.';
  }

  return {
    matched,
    missing,
    total,
    matchPercentage,
    explanation,
    score,
  };
}

/**
 * Compute TF-IDF similarity between job requirements and candidate profile text
 */
function computeTextSimilarity(jobRequirements, studentProfile) {
  const jobTextParts = [];
  const studentTextParts = [];

  // Job text
  jobTextParts.push(jobRequirements?.rawDescription || '');
  if (jobRequirements?.keywords?.length) jobTextParts.push(...jobRequirements.keywords);
  if (jobRequirements?.responsibilities?.length) jobTextParts.push(...jobRequirements.responsibilities);

  // Student text
  if (studentProfile.skills) {
    studentProfile.skills.forEach(s => {
      studentTextParts.push(typeof s === 'string' ? s : s.name || '');
    });
  }
  if (studentProfile.experiences) {
    studentProfile.experiences.forEach(exp => {
      studentTextParts.push(exp.role || '');
      studentTextParts.push(exp.company || '');
      studentTextParts.push(exp.description || '');
    });
  }
  if (studentProfile.projects) {
    studentProfile.projects.forEach(proj => {
      studentTextParts.push(proj.title || '');
      studentTextParts.push(proj.description || '');
      if (proj.techStack) studentTextParts.push(...proj.techStack);
    });
  }
  if (studentProfile.certifications) {
    studentProfile.certifications.forEach(cert => {
      studentTextParts.push(cert.title || '');
    });
  }
  if (studentProfile.education) {
    studentProfile.education.forEach(edu => {
      studentTextParts.push(edu.degree || '');
      studentTextParts.push(edu.branch || '');
    });
  }

  const jobText = jobTextParts.filter(Boolean).join(' ');
  const studentText = studentTextParts.filter(Boolean).join(' ');

  if (!jobText || !studentText) return { similarity: 0, score: 0 };

  const similarity = computeTFIDFSimilarity(jobText, studentText);
  const score = similarity * 100;

  return {
    similarity: parseFloat(similarity.toFixed(4)),
    score: parseFloat(score.toFixed(1)),
  };
}

/**
 * Main function to calculate match score between job requirements and candidate profile
 */
function calculateMatchScore(jobRequirements, studentProfile) {
  if (!jobRequirements || !studentProfile) {
    return {
      score: 0,
      matchPercentage: 0,
      breakdown: {},
      explanation: 'Missing job requirements or candidate profile.',
      matched: [],
      partiallyMatched: [],
      missing: [],
    };
  }

  const explanations = [];

  // 1. Skills Matching (weight: 40)
  const skillResult = matchSkills(
    jobRequirements.skills?.hardSkills,
    studentProfile.skills,
    jobRequirements.skills?.hardSkills
  );
  const skillWeight = 40;
  const skillApplicable = (jobRequirements.skills?.hardSkills?.length || 0) > 0;
  const skillWeightedScore = (skillResult.score / 100) * skillWeight;
  if (skillResult.matched.length > 0) {
    explanations.push(`Matched skills: ${skillResult.matched.join(', ')}.`);
  }
  if (skillResult.partiallyMatched.length > 0) {
    explanations.push(`Partially matched skills: ${skillResult.partiallyMatched.join(', ')}.`);
  }
  if (skillResult.missing.length > 0) {
    explanations.push(`Missing skills: ${skillResult.missing.join(', ')}.`);
  }

  // 2. Experience Matching (weight: 25)
  const experienceResult = matchExperience(
    jobRequirements.experience,
    studentProfile.experiences
  );
  const experienceWeight = 25;
  const experienceApplicable = (jobRequirements.experience?.minYears || 0) > 0 || Boolean(jobRequirements.experience?.experienceLevel);
  const experienceWeightedScore = (experienceResult.score / 100) * experienceWeight;
  if (experienceResult.explanation) {
    explanations.push(experienceResult.explanation);
  }

  // 3. Education Matching (weight: 15)
  const educationResult = matchEducation(
    jobRequirements.education,
    studentProfile.education
  );
  const educationWeight = 15;
  const educationApplicable = (jobRequirements.education?.degrees?.length || 0) > 0 || (jobRequirements.education?.requiredFields?.length || 0) > 0;
  const educationWeightedScore = (educationResult.score / 100) * educationWeight;
  if (educationResult.explanation) {
    explanations.push(educationResult.explanation);
  }

  // 4. Certifications Matching (weight: 10)
  const certificationResult = matchCertifications(
    jobRequirements.certifications,
    studentProfile.certifications
  );
  const certificationWeight = 10;
  const certificationApplicable = certificationResult.total > 0;
  const certificationWeightedScore = (certificationResult.score / 100) * certificationWeight;
  if (certificationResult.explanation) {
    explanations.push(certificationResult.explanation);
  }

  // 5. TF-IDF Similarity Matching (weight: 10) - always applicable text signal
  const similarityResult = computeTextSimilarity(jobRequirements, studentProfile);
  const similarityWeight = 10;
  const similarityWeightedScore = (similarityResult.score / 100) * similarityWeight;
  if (similarityResult.similarity > 0) {
    explanations.push(`Text similarity: ${(similarityResult.similarity * 100).toFixed(1)}% between job requirements and profile.`);
  }

  // Compute score only over requirements that were actually detected in the job description.
  // Dimensions without an identified requirement do not inflate the score.
  const applicableWeight = skillWeight * (skillApplicable ? 1 : 0)
    + experienceWeight * (experienceApplicable ? 1 : 0)
    + educationWeight * (educationApplicable ? 1 : 0)
    + certificationWeight * (certificationApplicable ? 1 : 0)
    + similarityWeight * 1;

  const weightedScore = skillWeightedScore * (skillApplicable ? 1 : 0)
    + experienceWeightedScore * (experienceApplicable ? 1 : 0)
    + educationWeightedScore * (educationApplicable ? 1 : 0)
    + certificationWeightedScore * (certificationApplicable ? 1 : 0)
    + similarityWeightedScore * 1;

  const matchPercentage = applicableWeight > 0
    ? Math.min(100, Math.round((weightedScore / applicableWeight) * 100))
    : 0;

  if (!skillApplicable && !experienceApplicable && !educationApplicable && !certificationApplicable) {
    explanations.unshift('No structured requirements were detected in this job description; score is based on text similarity only.');
  }

  // Compile matched/partially matched/missing requirements
  const matched = [];
  const partiallyMatched = [];
  const missing = [];

  // Skills
  skillResult.matched.forEach(s => matched.push({ category: 'skills', requirement: s }));
  skillResult.partiallyMatched.forEach(s => partiallyMatched.push({ category: 'skills', requirement: s }));
  skillResult.missing.forEach(s => missing.push({ category: 'skills', requirement: s }));

  // Experience
  if (experienceResult.minYears > 0 || experienceResult.experienceLevel) {
    if (experienceResult.matchLevel === 'fully') {
      matched.push({ category: 'experience', requirement: `${experienceResult.candidateYears} years` });
    } else if (experienceResult.matchLevel === 'partial') {
      partiallyMatched.push({ category: 'experience', requirement: `${experienceResult.candidateYears} of ${experienceResult.minYears} years` });
    } else {
      missing.push({ category: 'experience', requirement: `${experienceResult.minYears} years` });
    }
  }

  // Education
  if (educationResult.matchLevel === 'fully') {
    matched.push({ category: 'education', requirement: 'Requirements met' });
  } else if (educationResult.matchLevel === 'partial') {
    partiallyMatched.push({ category: 'education', requirement: 'Partially met' });
  } else {
    missing.push({ category: 'education', requirement: 'Not met' });
  }

  // Certifications
  certificationResult.matched.forEach(c => matched.push({ category: 'certifications', requirement: c }));
  certificationResult.missing.forEach(c => missing.push({ category: 'certifications', requirement: c }));

  return {
    score: matchPercentage,
    matchPercentage,
    coverage: {
      applicableWeight,
      totalWeight: 100,
      applied: {
        skills: skillApplicable,
        experience: experienceApplicable,
        education: educationApplicable,
        certifications: certificationApplicable,
        similarity: true,
      },
    },
    breakdown: {
      skills: {
        score: parseFloat(skillWeightedScore.toFixed(1)),
        weight: skillWeight,
        detail: skillResult,
      },
      experience: {
        score: parseFloat(experienceWeightedScore.toFixed(1)),
        weight: experienceWeight,
        detail: experienceResult,
      },
      education: {
        score: parseFloat(educationWeightedScore.toFixed(1)),
        weight: educationWeight,
        detail: educationResult,
      },
      certifications: {
        score: parseFloat(certificationWeightedScore.toFixed(1)),
        weight: certificationWeight,
        detail: certificationResult,
      },
      similarity: {
        score: parseFloat(similarityWeightedScore.toFixed(1)),
        weight: similarityWeight,
        detail: similarityResult,
      },
    },
    explanation: explanations.join(' '),
    detailedExplanations: explanations,
    matched,
    partiallyMatched,
    missing,
    totalRequired: jobRequirements.skills?.hardSkills?.length || 0,
  };
}

module.exports = {
  calculateTotalExperienceYears,
  matchSkills,
  matchExperience,
  matchEducation,
  matchCertifications,
  computeTextSimilarity,
  calculateMatchScore,
};