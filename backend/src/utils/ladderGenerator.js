/**
 * Project/JD Practical Ladder Generator & Escalation Engine
 * Escalates from Level 1 (Foundational / Everyday Concept)
 *               -> Level 2 (Practical Application)
 *               -> Level 3 (Real-World Best Practice).
 * Tailored dynamically to candidate resume tech stack & matched JD skills.
 * Made accessible and practical rather than overly theoretical.
 */

const PREDEFINED_LADDERS = {
  react: [
    {
      level: 1,
      statement: 'In React, which built-in hook is used to declare and update state variables inside functional components?',
      canonicalAnswer: 'useState',
      acceptedSynonyms: ['use-state', 'useState hook', 'state hook', 'useState()'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which React hook is used to handle side effects such as data fetching, timers, and DOM subscriptions?',
      canonicalAnswer: 'useEffect',
      acceptedSynonyms: ['use-effect', 'useEffect hook', 'effect hook', 'useEffect()'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which hook in React is used to cache and memoize the result of an expensive calculation between renders?',
      canonicalAnswer: 'useMemo',
      acceptedSynonyms: ['use-memo', 'useMemo hook', 'memo hook', 'useMemo()', 'useCallback'],
      marks: 2.0
    }
  ],
  'node.js': [
    {
      level: 1,
      statement: 'Which default package manager and CLI tool is bundled with Node.js to install and manage third-party libraries?',
      canonicalAnswer: 'npm',
      acceptedSynonyms: ['Node Package Manager', 'yarn', 'pnpm', 'NPM'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'In Express or Node.js web servers, what type of function executes between receiving a client request and sending the final response?',
      canonicalAnswer: 'Middleware',
      acceptedSynonyms: ['middleware', 'middleware function', 'middlewares'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which core built-in Node.js module provides methods to read, write, and manage files on the server file system?',
      canonicalAnswer: 'fs',
      acceptedSynonyms: ['file system', 'FileSystem', 'fs module', 'fs/promises'],
      marks: 2.0
    }
  ],
  python: [
    {
      level: 1,
      statement: 'Which built-in Python data structure is an ordered, mutable sequence defined using square brackets `[]`?',
      canonicalAnswer: 'List',
      acceptedSynonyms: ['list', 'lists', 'Python list'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which Python block or statement is used to catch and handle exceptions to prevent a program from crashing?',
      canonicalAnswer: 'try except',
      acceptedSynonyms: ['try-except', 'try catch', 'except', 'try', 'exception handling'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'In Python, which built-in function returns both the index and the item while looping through an iterable?',
      canonicalAnswer: 'enumerate',
      acceptedSynonyms: ['enumerate()', 'enumerate function'],
      marks: 2.0
    }
  ],
  java: [
    {
      level: 1,
      statement: 'In Java, which keyword is used by a subclass to inherit methods and attributes from a superclass?',
      canonicalAnswer: 'extends',
      acceptedSynonyms: ['extends keyword', 'inheritance'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which Java access modifier makes a variable or method accessible only within its own class?',
      canonicalAnswer: 'private',
      acceptedSynonyms: ['private modifier', 'private keyword'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'In Java, which common collection interface from java.util represents an ordered sequence of elements that allows duplicates?',
      canonicalAnswer: 'List',
      acceptedSynonyms: ['ArrayList', 'java.util.List', 'list'],
      marks: 2.0
    }
  ],
  docker: [
    {
      level: 1,
      statement: 'What text file contains the sequential instructions and commands used to build a container image?',
      canonicalAnswer: 'Dockerfile',
      acceptedSynonyms: ['dockerfile', 'Docker file'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which flag is passed to the `docker run` command (e.g. `-d`) to run a container in the background detached from the terminal?',
      canonicalAnswer: 'detach',
      acceptedSynonyms: ['-d', '--detach', 'detached', 'detached mode'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which tool uses a YAML configuration file to define, configure, and launch multi-container Docker applications simultaneously?',
      canonicalAnswer: 'Docker Compose',
      acceptedSynonyms: ['docker-compose', 'docker compose', 'compose'],
      marks: 2.0
    }
  ],
  mongodb: [
    {
      level: 1,
      statement: 'In what lightweight, binary JSON-like format does MongoDB store document data records?',
      canonicalAnswer: 'BSON',
      acceptedSynonyms: ['bson', 'Binary JSON'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which unique identifier field is automatically generated as the primary key for every document in a MongoDB collection?',
      canonicalAnswer: '_id',
      acceptedSynonyms: ['id', 'ObjectId', '_id field'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which MongoDB pipeline framework processes data through ordered stages like `$match` and `$group` to compute results?',
      canonicalAnswer: 'Aggregation',
      acceptedSynonyms: ['aggregation pipeline', 'aggregate', 'Aggregation Pipeline'],
      marks: 2.0
    }
  ],
  sql: [
    {
      level: 1,
      statement: 'Which SQL clause is used to filter records based on a specified condition in a SELECT query?',
      canonicalAnswer: 'WHERE',
      acceptedSynonyms: ['where', 'WHERE clause', 'where condition'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which SQL clause is used to group rows with identical values in summary queries alongside functions like COUNT or SUM?',
      canonicalAnswer: 'GROUP BY',
      acceptedSynonyms: ['group by', 'GROUP BY clause'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which type of SQL JOIN returns all rows from the first table and matched rows from the second table, inserting NULLs when there is no match?',
      canonicalAnswer: 'LEFT JOIN',
      acceptedSynonyms: ['left join', 'LEFT OUTER JOIN', 'left outer join'],
      marks: 2.0
    }
  ],
  aws: [
    {
      level: 1,
      statement: 'Which core AWS service provides on-demand, scalable virtual server compute capacity in the cloud?',
      canonicalAnswer: 'EC2',
      acceptedSynonyms: ['Amazon EC2', 'Elastic Compute Cloud', 'ec2'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which AWS service provides object storage with high durability for storing images, documents, and backups?',
      canonicalAnswer: 'S3',
      acceptedSynonyms: ['Amazon S3', 'Simple Storage Service', 's3'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which AWS serverless compute service lets you execute code functions in response to triggers without provisioning servers?',
      canonicalAnswer: 'Lambda',
      acceptedSynonyms: ['AWS Lambda', 'lambda', 'Amazon Lambda'],
      marks: 2.0
    }
  ],
  rag: [
    {
      level: 1,
      statement: 'In RAG (Retrieval-Augmented Generation), what model or process converts text chunks into numerical vectors?',
      canonicalAnswer: 'Embedding',
      acceptedSynonyms: ['Embeddings', 'Embedding Model', 'Vector Embedding', 'Encoder'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which specialized database is engineered to store and perform fast nearest-neighbor similarity searches on high-dimensional vectors?',
      canonicalAnswer: 'Vector Database',
      acceptedSynonyms: ['Vector DB', 'Vector search', 'Vector Store', 'Pinecone', 'Chroma', 'Milvus', 'Qdrant'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'What metric or similarity function (measuring the angle between vectors) is most commonly used to rank relevant document chunks in vector search?',
      canonicalAnswer: 'Cosine Similarity',
      acceptedSynonyms: ['Cosine', 'Dot Product', 'cosine similarity', 'Euclidean Distance'],
      marks: 2.0
    }
  ],
  microservices: [
    {
      level: 1,
      statement: 'What component acts as a reverse proxy entry point to route client requests to underlying microservices?',
      canonicalAnswer: 'API Gateway',
      acceptedSynonyms: ['Gateway', 'Reverse Proxy', 'Router', 'Proxy'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which lightweight data interchange format based on key-value pairs is most widely used for REST API payloads between services?',
      canonicalAnswer: 'JSON',
      acceptedSynonyms: ['json', 'JavaScript Object Notation'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'Which design pattern prevents repeated failing calls to a degraded microservice by failing fast until the service recovers?',
      canonicalAnswer: 'Circuit Breaker',
      acceptedSynonyms: ['circuit breaker', 'Circuit breaker pattern', 'CircuitBreaker'],
      marks: 2.0
    }
  ],
  caching: [
    {
      level: 1,
      statement: 'What popular open-source in-memory data store is widely used as an ultra-fast cache and message broker?',
      canonicalAnswer: 'Redis',
      acceptedSynonyms: ['redis', 'Memcached'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'Which cache eviction policy discards the items that haven\'t been accessed for the longest time when cache memory is full?',
      canonicalAnswer: 'LRU',
      acceptedSynonyms: ['Least Recently Used', 'lru', 'LRU cache'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'What property or acronym specifies how long a cached value remains valid before it expires and must be refreshed?',
      canonicalAnswer: 'TTL',
      acceptedSynonyms: ['Time to Live', 'Time To Live', 'ttl', 'Expiration Time'],
      marks: 2.0
    }
  ],
  'system design': [
    {
      level: 1,
      statement: 'What hardware or software component distributes incoming web traffic across multiple server instances to prevent overload?',
      canonicalAnswer: 'Load Balancer',
      acceptedSynonyms: ['load balancer', 'LB', 'Reverse Proxy', 'Application Load Balancer'],
      marks: 1.0
    },
    {
      level: 2,
      statement: 'What type of scaling involves adding more servers to your system pool rather than upgrading CPU/RAM on a single server?',
      canonicalAnswer: 'Horizontal Scaling',
      acceptedSynonyms: ['Horizontal', 'Scaling out', 'Scale out', 'Horizontal scale'],
      marks: 1.5
    },
    {
      level: 3,
      statement: 'What database mechanism creates an index on columns to speed up search and query lookups at the cost of slightly slower writes?',
      canonicalAnswer: 'Indexing',
      acceptedSynonyms: ['Index', 'Database Index', 'B-Tree Index', 'index'],
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

  const topicsToUse = uniqueTopics.slice(0, 4);
  const l1Questions = [];
  const l2Questions = [];
  const l3Questions = [];

  topicsToUse.forEach((topicKey) => {
    const ladder = PREDEFINED_LADDERS[topicKey] || generateGenericLadder(topicKey);

    ladder.forEach(item => {
      const q = {
        id: `ladder-${topicKey}-${item.level}`,
        category: 'PROJECT_LADDER',
        topic: topicKey.toUpperCase(),
        level: item.level,
        difficulty: item.level === 1 ? 'EASY' : item.level === 2 ? 'MEDIUM' : 'HARD',
        statement: item.statement,
        canonicalAnswer: item.canonicalAnswer,
        acceptedSynonyms: item.acceptedSynonyms,
        marks: item.marks,
        status: item.level === 1 ? 'UNLOCKED' : 'LOCKED'
      };
      if (item.level === 1) l1Questions.push(q);
      else if (item.level === 2) l2Questions.push(q);
      else if (item.level === 3) l3Questions.push(q);
    });
  });

  // Exactly 4 Simple (Level 1), 2 Medium (Level 2), 2 Hard (Level 3) = 8 questions
  const selectedLadder = [
    ...l1Questions.slice(0, 4),
    ...l2Questions.slice(0, 2),
    ...l3Questions.slice(0, 2)
  ];

  return selectedLadder.slice(0, 8);
}

function generateGenericLadder(topicName) {
  const name = (topicName || 'Software Architecture').toUpperCase();
  return [
    {
      level: 1,
      statement: `In software engineering, what primary benefit does modular component design in ${name} provide for maintenance?`,
      canonicalAnswer: 'Maintainability',
      acceptedSynonyms: ['Reusability', 'Readability', 'Modularity', 'Clean Code'],
      marks: 1.0
    },
    {
      level: 2,
      statement: `Which standard format or protocol is most commonly used for sending data payloads between services in ${name}?`,
      canonicalAnswer: 'JSON',
      acceptedSynonyms: ['REST', 'HTTP', 'JSON format', 'REST API'],
      marks: 1.5
    },
    {
      level: 3,
      statement: `What common technique is used in ${name} to store frequently accessed data in fast memory to speed up response times?`,
      canonicalAnswer: 'Caching',
      acceptedSynonyms: ['Cache', 'In-memory Cache', 'Redis Caching'],
      marks: 2.0
    }
  ];
}

function updateLadderState(currentLadderState, topic, level, isCorrect) {
  const state = { ...currentLadderState };
  if (!state[topic]) {
    state[topic] = { currentLevel: 1, maxReached: 1, stopped: false };
  }

  const topicState = { ...state[topic] };

  if (isCorrect) {
    if (level >= topicState.currentLevel && level < 3) {
      topicState.currentLevel = level + 1;
      topicState.maxReached = Math.max(topicState.maxReached, level + 1);
      topicState.stopped = false;
    }
  }

  state[topic] = topicState;
  return state;
}

module.exports = {
  generateProjectLadder,
  updateLadderState
};
