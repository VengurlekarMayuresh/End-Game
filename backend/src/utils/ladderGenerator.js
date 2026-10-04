/**
 * Project/JD Theoretical Ladder Generator & Escalation Engine
 * Escalates from Level 1 (Basic/General) -> Level 2 (Applied Scenario) -> Level 3 (Difficult Internals/Trade-offs).
 * Tailored dynamically to candidate resume tech stack & matched JD skills.
 */

const PREDEFINED_LADDERS = {
  react: [
    {
      level: 1,
      statement: 'In React, what in-memory representation of the real DOM is used to compute efficient UI updates before batching changes to the browser?',
      canonicalAnswer: 'Virtual DOM',
      acceptedSynonyms: ['VDOM', 'Virtual Dom', 'vdom', 'Virtual Document Object Model'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which built-in React hook is used to persist mutable values across re-renders without triggering a component re-render when mutated?',
      canonicalAnswer: 'useRef',
      acceptedSynonyms: ['useRef hook', 'ref', 'use-ref'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which internal React 18 reconciliation architecture enables interruptible rendering and concurrent scheduling using fiber nodes?',
      canonicalAnswer: 'React Fiber',
      acceptedSynonyms: ['Fiber', 'Fiber Architecture', 'React Fiber reconciler', 'Concurrent Mode'],
      marks: 2.0
    }
  ],
  'node.js': [
    {
      level: 1,
      statement: 'What single-threaded core loop in Node.js orchestrates asynchronous non-blocking I/O callbacks across phases like timers and poll?',
      canonicalAnswer: 'Event Loop',
      acceptedSynonyms: ['event loop', 'Event-Loop', 'libuv event loop'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which Node.js mechanism or module allows streaming large gigabyte files chunk-by-chunk without overwhelming memory allocation?',
      canonicalAnswer: 'Streams',
      acceptedSynonyms: ['Stream', 'Node Streams', 'Readable Stream', 'fs.createReadStream', 'Piping'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which native C library provides Node.js with its multi-threaded asynchronous thread pool and platform abstraction layer for I/O operations?',
      canonicalAnswer: 'libuv',
      acceptedSynonyms: ['libuv library', 'Libuv'],
      marks: 2.0
    }
  ],
  python: [
    {
      level: 1,
      statement: 'What mechanism in CPython restricts thread execution such that only one native thread executes Python bytecode at a time?',
      canonicalAnswer: 'GIL',
      acceptedSynonyms: ['Global Interpreter Lock', 'gil', 'Global interpreter lock'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which Python keyword is used inside a function to produce an iterator that yields values one at a time on demand rather than storing them in memory?',
      canonicalAnswer: 'yield',
      acceptedSynonyms: ['yield keyword', 'Generator', 'yield statement'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'In Python\'s memory manager, which built-in module detects and collects reference cycles that cannot be freed by pure reference counting?',
      canonicalAnswer: 'gc',
      acceptedSynonyms: ['gc module', 'Garbage Collector', 'Cycle Detector', 'gc.collect'],
      marks: 2.0
    }
  ],
  java: [
    {
      level: 1,
      statement: 'What is the primary JVM component responsible for automatically reclaiming dynamically allocated heap memory that is no longer referenced?',
      canonicalAnswer: 'Garbage Collector',
      acceptedSynonyms: ['GC', 'Garbage Collection', 'garbage collector'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which Java interface in java.util.concurrent represents an asynchronous computation result that supports non-blocking functional composition?',
      canonicalAnswer: 'CompletableFuture',
      acceptedSynonyms: ['Future', 'Completable Future', 'Future interface'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which Java keyword guarantees that reads and writes of a variable happen directly in main memory, preventing thread-caching inconsistencies?',
      canonicalAnswer: 'volatile',
      acceptedSynonyms: ['volatile keyword', 'Volatile'],
      marks: 2.0
    }
  ],
  docker: [
    {
      level: 1,
      statement: 'What is the lightweight, standalone, executable software package containing all code, runtime, and system libraries needed to run an application?',
      canonicalAnswer: 'Container Image',
      acceptedSynonyms: ['Docker Image', 'Image', 'Docker image'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which Dockerfile optimization pattern compiles binaries in an initial build container and copies only artifacts into a minimal runtime image?',
      canonicalAnswer: 'Multi-stage Build',
      acceptedSynonyms: ['Multi stage build', 'Multistage build', 'Multi-stage'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which Linux kernel feature does Docker utilize to isolate process trees, network interfaces, and mount points between containers?',
      canonicalAnswer: 'Namespaces',
      acceptedSynonyms: ['Linux Namespaces', 'namespace', 'cgroups and namespaces'],
      marks: 2.0
    }
  ],
  mongodb: [
    {
      level: 1,
      statement: 'What binary-encoded JSON-like format does MongoDB use internally to store documents and represent data types?',
      canonicalAnswer: 'BSON',
      acceptedSynonyms: ['Binary JSON', 'bson'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which multi-stage data processing framework in MongoDB transforms documents through stages like $match, $group, and $project?',
      canonicalAnswer: 'Aggregation Pipeline',
      acceptedSynonyms: ['Aggregation', 'Pipeline', 'Aggregate', 'Aggregation pipeline'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which special capped collection in MongoDB replica sets records all write operations to support data replication across secondary members?',
      canonicalAnswer: 'oplog',
      acceptedSynonyms: ['Oplog', 'Operations Log', 'oplog.rs', 'Operation log'],
      marks: 2.0
    }
  ],
  sql: [
    {
      level: 1,
      statement: 'What relational constraint ensures each row in a database table has a non-null, uniquely identifiable column value?',
      canonicalAnswer: 'Primary Key',
      acceptedSynonyms: ['PK', 'primary key', 'Primary key constraint'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which SQL operator or clause combines the result sets of two SELECT queries, automatically removing duplicate rows?',
      canonicalAnswer: 'UNION',
      acceptedSynonyms: ['union', 'UNION operator'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'What relational database logging mechanism writes transaction changes sequentially to persistent storage before committing them to data files?',
      canonicalAnswer: 'WAL',
      acceptedSynonyms: ['Write-Ahead Logging', 'Write Ahead Log', 'Write Ahead Logging', 'wal'],
      marks: 2.0
    }
  ],
  aws: [
    {
      level: 1,
      statement: 'Which core AWS service provides highly scalable object storage with 99.999999999% (11 9s) durability for storing images, documents, and backups?',
      canonicalAnswer: 'S3',
      acceptedSynonyms: ['Amazon S3', 'Simple Storage Service', 's3'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which AWS security mechanism grants temporary, fine-grained access credentials to applications and EC2 instances without embedding long-term API keys?',
      canonicalAnswer: 'IAM Role',
      acceptedSynonyms: ['IAM Roles', 'IAM', 'Instance Profile', 'Role'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'In distributed cloud networks, which technique connects two Virtual Private Clouds (VPCs) directly using private IP addresses as if they were in the same network?',
      canonicalAnswer: 'VPC Peering',
      acceptedSynonyms: ['Vpc peering', 'VPC Peering Connection', 'Transit Gateway'],
      marks: 2.0
    }
  ],
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
  'system design': [
    {
      level: 1,
      statement: 'What hardware/software device sits between clients and servers to distribute incoming network traffic across a healthy server pool?',
      canonicalAnswer: 'Load Balancer',
      acceptedSynonyms: ['load balancer', 'LB', 'Reverse Proxy', 'Application Load Balancer'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which hashing algorithm assigns both cache nodes and data keys to a circular ring to minimize key remapping when nodes are added or removed?',
      canonicalAnswer: 'Consistent Hashing',
      acceptedSynonyms: ['consistent hashing', 'Hash Ring', 'Consistent hash ring'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which distributed consensus algorithm is designed to be easier to understand than Paxos and is used by etcd and Consul for leader election and log replication?',
      canonicalAnswer: 'Raft',
      acceptedSynonyms: ['Raft Consensus', 'raft', 'Raft Algorithm'],
      marks: 2.0
    }
  ]
};

/**
 * Generate up to 3 topic ladders producing exactly 8 questions total.
 * Distribution: 3 questions from topic 1, 3 from topic 2, 2 from topic 3.
 * Total: 2 DSA_CODE + 3 SQL + 2 Core CS + 8 Ladder = 15 total questions.
 */
function generateProjectLadder(coreTopics = []) {
  // Normalize and map core topics from resume
  const mappedTopics = coreTopics.map(t => {
    const k = (t || '').toLowerCase().trim();
    if (k.includes('react') || k.includes('frontend')) return 'react';
    if (k.includes('node') || k.includes('express')) return 'node.js';
    if (k.includes('python') || k.includes('django') || k.includes('fastapi')) return 'python';
    if (k.includes('java') || k.includes('spring')) return 'java';
    if (k.includes('docker') || k.includes('kubernetes') || k.includes('container')) return 'docker';
    if (k.includes('mongo') || k.includes('nosql')) return 'mongodb';
    if (k.includes('sql') || k.includes('postgres') || k.includes('mysql')) return 'sql';
    if (k.includes('aws') || k.includes('cloud')) return 'aws';
    if (k.includes('rag') || k.includes('llm') || k.includes('retrieval')) return 'rag';
    if (k.includes('microservice')) return 'microservices';
    if (k.includes('cache') || k.includes('redis')) return 'caching';
    if (k.includes('system') || k.includes('design') || k.includes('architecture')) return 'system design';
    return k;
  });

  const uniqueTopics = [...new Set(mappedTopics)].filter(Boolean);
  const defaults = ['react', 'node.js', 'sql', 'system design'];
  defaults.forEach(d => {
    if (!uniqueTopics.includes(d)) uniqueTopics.push(d);
  });

  const topicsToUse = uniqueTopics.slice(0, 3);
  const allQuestions = [];

  topicsToUse.forEach((topicKey) => {
    const ladder = PREDEFINED_LADDERS[topicKey] || generateGenericLadder(topicKey);

    ladder.forEach(item => {
      allQuestions.push({
        id: `ladder-${topicKey}-${item.level}`,
        category: 'PROJECT_LADDER',
        topic: topicKey.toUpperCase(),
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

function generateGenericLadder(topicName) {
  const name = (topicName || 'System Architecture').toUpperCase();
  return [
    {
      level: 1,
      statement: `What primary architectural goal or core benefit does ${name} provide in modern software engineering?`,
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
      statement: `What critical trade-off or bottleneck must be managed when scaling ${name} under heavy production traffic?`,
      canonicalAnswer: 'Latency',
      acceptedSynonyms: ['Throughput', 'Network Latency', 'Memory Consumption', 'Data Consistency', 'Lock Contention'],
      marks: 2.0
    }
  ];
}

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
    topicState.stopped = true;
  }

  state[topic] = topicState;
  return state;
}

module.exports = {
  generateProjectLadder,
  updateLadderState
};
