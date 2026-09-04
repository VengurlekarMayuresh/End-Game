/**
 * Project/JD Theoretical Ladder Generator & Escalation Engine
 * Generates ~7 questions across 2-3 topics escalating from Level 1 (Basic) to Level 3 (Advanced)
 * Pre-validates canonical answers and synonyms for instant deterministic matching.
 */

const PREDEFINED_LADDERS = {
  rag: [
    {
      level: 1,
      statement: 'In RAG (Retrieval-Augmented Generation), what component converts text chunks into vector representations?',
      canonicalAnswer: 'Embedding Model',
      acceptedSynonyms: ['Embeddings', 'Embedding', 'Encoder', 'Vector Embedding', 'Text Embeddings'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which technique retrieves the top-K relevant chunks before passing them as context to the LLM?',
      canonicalAnswer: 'Vector Search',
      acceptedSynonyms: ['Semantic Search', 'Similarity Search', 'Vector Retrieval', 'KNN Search', 'Cosine Similarity'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which post-retrieval step re-orders retrieved chunks using a cross-encoder to improve context precision?',
      canonicalAnswer: 'Reranking',
      acceptedSynonyms: ['Re-ranking', 'Cross-Encoder Reranking', 'Reranker', 'Rerank'],
      marks: 2.0
    }
  ],
  microservices: [
    {
      level: 1,
      statement: 'Which API gateway pattern acts as a single entry point to route requests to backend microservices?',
      canonicalAnswer: 'API Gateway',
      acceptedSynonyms: ['Gateway', 'Reverse Proxy', 'API Proxy', 'Router'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which design pattern prevents a cascading service failure by failing fast when a downstream service is unresponsive?',
      canonicalAnswer: 'Circuit Breaker',
      acceptedSynonyms: ['Circuit breaker pattern', 'CircuitBreaker', 'Fault tolerance'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which distributed data pattern maintains eventual consistency across services using a sequence of local transactions?',
      canonicalAnswer: 'Saga Pattern',
      acceptedSynonyms: ['Saga', 'Sagas', 'Saga Pattern', 'Choreography Saga', 'Orchestration Saga'],
      marks: 2.0
    }
  ],
  'vector database': [
    {
      level: 1,
      statement: 'Which distance metric measures the angle between two vector embeddings regardless of magnitude?',
      canonicalAnswer: 'Cosine Similarity',
      acceptedSynonyms: ['Cosine', 'Cosine distance', 'Cosine angle'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which indexing algorithm organizes high-dimensional vectors into a hierarchical graph for fast approximate nearest neighbor search?',
      canonicalAnswer: 'HNSW',
      acceptedSynonyms: ['Hierarchical Navigable Small World', 'HNSW Graph', 'HNSW Index'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which vector compression method reduces memory footprint by dividing vectors into sub-vectors and quantizing centroid codes?',
      canonicalAnswer: 'Product Quantization',
      acceptedSynonyms: ['PQ', 'Quantization', 'Scalar Quantization'],
      marks: 2.0
    }
  ],
  caching: [
    {
      level: 1,
      statement: 'Which eviction policy removes the least recently accessed item first when cache capacity is full?',
      canonicalAnswer: 'LRU',
      acceptedSynonyms: ['Least Recently Used', 'LRU Eviction', 'lru'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which caching strategy writes data simultaneously to both the cache and underlying database store?',
      canonicalAnswer: 'Write-Through',
      acceptedSynonyms: ['Write through', 'Write-Through Caching', 'Synchronous Write'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'What phenomenon occurs when multiple concurrent requests miss the cache simultaneously and overwhelm the database?',
      canonicalAnswer: 'Cache Stampede',
      acceptedSynonyms: ['Thundering Herd', 'Cache Avalanche', 'Dog piling', 'Stampede'],
      marks: 2.0
    }
  ],
  postgresql: [
    {
      level: 1,
      statement: 'Which default transaction isolation level in PostgreSQL prevents dirty reads?',
      canonicalAnswer: 'Read Committed',
      acceptedSynonyms: ['Read committed', 'READ_COMMITTED', 'Read Committed Isolation'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which concurrency control mechanism allows PostgreSQL readers to not block writers and writers to not block readers?',
      canonicalAnswer: 'MVCC',
      acceptedSynonyms: ['Multi-Version Concurrency Control', 'Multiversion Concurrency Control', 'mvcc'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which PostgreSQL index type is specifically designed for indexing JSONB keys and array containment operators?',
      canonicalAnswer: 'GIN Index',
      acceptedSynonyms: ['GIN', 'Generalized Inverted Index', 'GIN Indexing'],
      marks: 2.0
    }
  ]
};

/**
 * Generate up to 3 topic ladders producing exactly 8 questions total.
 * Distribution: 3 questions from topic 1, 3 from topic 2, 2 from topic 3 (or adjusted).
 * This ensures: 2 DSA_CODE + 3 SQL + 2 Core CS + 8 Ladder = 15 total questions.
 */
function generateProjectLadder(coreTopics = []) {
  const topicsToUse = coreTopics.length > 0 ? coreTopics.slice(0, 3) : ['rag', 'microservices', 'caching'];
  const allQuestions = [];

  topicsToUse.forEach((topicKey) => {
    const key = (topicKey || '').toLowerCase();
    const ladder = PREDEFINED_LADDERS[key] || generateGenericLadder(topicKey);

    ladder.forEach(item => {
      allQuestions.push({
        id: `ladder-${key}-${item.level}`,
        category: 'PROJECT_LADDER',
        topic: topicKey,
        level: item.level, // 1 (Basic), 2 (Intermediate), 3 (Advanced)
        statement: item.statement,
        canonicalAnswer: item.canonicalAnswer,
        acceptedSynonyms: item.acceptedSynonyms,
        marks: item.marks,
        status: item.level === 1 ? 'UNLOCKED' : 'LOCKED'
      });
    });
  });

  return allQuestions.slice(0, 8); // Exactly 8 ladder questions
}

/**
 * Dynamic fallback generator for any technology keyword
 */
function generateGenericLadder(topicName) {
  const name = (topicName || 'System Architecture').toUpperCase();
  return [
    {
      level: 1,
      statement: `What primary architectural goal or core benefit does ${name} provide in software engineering?`,
      canonicalAnswer: 'Scalability',
      acceptedSynonyms: ['Modularity', 'Performance', 'Maintainability', 'High Availability', 'Fault Tolerance'],
      marks: 1.0
    },
    {
      level: 2,
      statement: `What common design pattern or mechanism is used to decouple components in ${name}?`,
      canonicalAnswer: 'Dependency Injection',
      acceptedSynonyms: ['Event-Driven Architecture', 'Message Queue', 'Abstraction', 'Interface', 'Adapter Pattern'],
      marks: 1.5
    },
    {
      level: 3,
      statement: `What critical trade-off or bottleneck must be managed when scaling ${name} under heavy load?`,
      canonicalAnswer: 'Latency',
      acceptedSynonyms: ['Throughput', 'Network Latency', 'Memory Consumption', 'Data Consistency', 'Lock Contention'],
      marks: 2.0
    }
  ];
}

/**
 * Ladder Escalation Engine:
 * Updates ladder state based on candidate's answer correctness.
 * - Correct answer on Level 1 -> unlocks Level 2 for that topic.
 * - Correct answer on Level 2 -> unlocks Level 3 for that topic.
 * - Incorrect answer -> stops topic ladder progression with no penalty.
 */
function updateLadderState(currentLadderState, topic, level, isCorrect) {
  const state = { ...currentLadderState };
  if (!state[topic]) {
    state[topic] = { currentLevel: 1, maxReached: 1, stopped: false };
  }

  const topicState = state[topic];

  if (isCorrect) {
    if (level === topicState.currentLevel) {
      if (level < 3) {
        topicState.currentLevel = level + 1;
        topicState.maxReached = level + 1;
      }
    }
  } else {
    // Incorrect answer -> stop that topic ladder with no penalty
    topicState.stopped = true;
  }

  state[topic] = topicState;
  return state;
}

module.exports = {
  generateProjectLadder,
  updateLadderState
};
