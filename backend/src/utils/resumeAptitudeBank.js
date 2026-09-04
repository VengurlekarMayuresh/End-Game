/**
 * Curated Question Bank for DSA, SQL, and Core CS (Short-Answer & Sandbox execution)
 */

const DSA_QUESTION_BANK = [
  {
    id: 'dsa-bank-1',
    category: 'DSA',
    topic: 'complexity trade-offs',
    tags: ['scalable systems', 'algorithms', 'trees', 'performance'],
    statement: 'What is the worst-case time complexity of lookup in a balanced Binary Search Tree?',
    canonicalAnswer: 'O(log n)',
    acceptedSynonyms: ['O(log N)', 'logarithmic', 'O(logn)', 'O(log(n))', 'log n'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'dsa-bank-2',
    category: 'DSA',
    topic: 'hashing',
    tags: ['scalable systems', 'data structures', 'hashing', 'lookup'],
    statement: 'Which data structure provides average O(1) time complexity for key lookup and insertion?',
    canonicalAnswer: 'Hash Map',
    acceptedSynonyms: ['HashTable', 'Hash table', 'HashMap', 'Hash Map', 'Dictionary', 'Hash Index'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'dsa-bank-3',
    category: 'DSA',
    topic: 'graph algorithms',
    tags: ['graphs', 'algorithms', 'routing', 'optimization'],
    statement: 'Which algorithm finds the single-source shortest path in a weighted graph with non-negative edge weights?',
    canonicalAnswer: 'Dijkstra',
    acceptedSynonyms: ["Dijkstra's algorithm", 'Dijkstra algorithm', 'Dijkstras', 'Dijkstra Shortest Path'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'dsa-bank-4',
    category: 'DSA',
    topic: 'sorting',
    tags: ['sorting', 'performance', 'algorithms'],
    statement: 'What is the average-case time complexity of Quick Sort?',
    canonicalAnswer: 'O(n log n)',
    acceptedSynonyms: ['O(N log N)', 'O(nlogn)', 'O(NLOGN)', 'n log n'],
    difficulty: 'EASY',
    marks: 1.0,
  }
];

const SQL_QUESTION_BANK = [
  {
    id: 'sql-bank-1',
    category: 'SQL',
    topic: 'aggregation and window functions',
    tags: ['reporting', 'analytics', 'aggregation', 'sql'],
    statement: 'Write a SQL query to select department and average salary (as avg_sal) from employees table grouped by department.',
    canonicalAnswer: 'SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department',
    acceptedSynonyms: [
      'SELECT department, AVG(salary) FROM employees GROUP BY department',
      'SELECT department, AVG(salary) as avg_sal FROM employees GROUP BY department ORDER BY department'
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, department TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Engineering', 90000);
      INSERT INTO employees VALUES (2, 'Engineering', 110000);
      INSERT INTO employees VALUES (3, 'Sales', 70000);
      INSERT INTO employees VALUES (4, 'Sales', 80000);
    `,
    referenceQuery: `SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department ORDER BY department`,
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-2',
    category: 'SQL',
    topic: 'indexing and joins',
    tags: ['transactional systems', 'joins', 'relational db', 'sql'],
    statement: 'Write a SQL query to select employee name and manager name by performing a self JOIN on employees table (where manager_id matches id).',
    canonicalAnswer: 'SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id',
    acceptedSynonyms: [
      'SELECT e.name, m.name FROM employees e INNER JOIN employees m ON e.manager_id = m.id',
      'SELECT e.name AS employee, m.name AS manager FROM employees e, employees m WHERE e.manager_id = m.id'
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, manager_id INT);
      INSERT INTO employees VALUES (1, 'Alice', NULL);
      INSERT INTO employees VALUES (2, 'Bob', 1);
      INSERT INTO employees VALUES (3, 'Charlie', 1);
    `,
    referenceQuery: `SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id ORDER BY e.name`,
    difficulty: 'MEDIUM',
    marks: 1.5,
  }
];

const CORE_CS_QUESTION_BANK = [
  {
    id: 'core-cs-1',
    category: 'CORE_CS',
    topic: 'OS',
    tags: ['operating systems', 'concurrency', 'ipc', 'memory'],
    statement: 'Which IPC mechanism provides the fastest inter-process data sharing by mapping a single physical RAM segment into multiple process address spaces?',
    canonicalAnswer: 'Shared Memory',
    acceptedSynonyms: ['Shared memory', 'shm', 'Shared Memory Segment', 'shared_memory'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-2',
    category: 'CORE_CS',
    topic: 'Networking',
    tags: ['networking', 'protocols', 'tcp/ip'],
    statement: 'Which Transport Layer protocol guarantees reliable, connection-oriented, ordered byte-stream data transfer?',
    canonicalAnswer: 'TCP',
    acceptedSynonyms: ['Transmission Control Protocol', 'tcp', 'TCP/IP Protocol'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-3',
    category: 'CORE_CS',
    topic: 'DBMS',
    tags: ['dbms', 'acid', 'databases', 'transactions'],
    statement: 'Which ACID property ensures that once a database transaction commits, its effects survive system crashes and power failures?',
    canonicalAnswer: 'Durability',
    acceptedSynonyms: ['durability', 'Durable', 'DURABILITY'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-4',
    category: 'CORE_CS',
    topic: 'OOP',
    tags: ['oop', 'design', 'polymorphism', 'java', 'cpp'],
    statement: 'Which OOP principle allows a derived class to provide a specific implementation of a method that is already defined in its base class?',
    canonicalAnswer: 'Method Overriding',
    acceptedSynonyms: ['Overriding', 'Method overriding', 'Runtime Polymorphism', 'override'],
    difficulty: 'EASY',
    marks: 1.0,
  }
];

/**
 * Filter questions based on JD keyword mapping
 */
function selectJdFilteredQuestions(jobDetails, coreTopics = []) {
  const jdText = `${jobDetails?.title || ''} ${jobDetails?.description || ''} ${jobDetails?.requirements || ''}`.toLowerCase();

  // 1. Select 2 DSA Questions
  let selectedDsa = [];
  if (jdText.includes('scale') || jdText.includes('distributed') || jdText.includes('performance')) {
    selectedDsa = DSA_QUESTION_BANK.filter(q => q.topic === 'complexity trade-offs' || q.topic === 'hashing');
  }
  if (selectedDsa.length < 2) {
    selectedDsa = DSA_QUESTION_BANK.slice(0, 2);
  }

  // 2. Select 2 SQL Questions
  let selectedSql = [];
  if (jdText.includes('analytic') || jdText.includes('report') || jdText.includes('data')) {
    selectedSql = SQL_QUESTION_BANK.filter(q => q.topic === 'aggregation and window functions');
  }
  if (selectedSql.length < 2) {
    selectedSql = SQL_QUESTION_BANK.slice(0, 2);
  }

  // 3. Select 3-4 Core CS Questions
  const selectedCoreCs = CORE_CS_QUESTION_BANK.slice(0, 4);

  return {
    dsaQuestions: selectedDsa.slice(0, 2),
    sqlQuestions: selectedSql.slice(0, 2),
    coreCsQuestions: selectedCoreCs
  };
}

module.exports = {
  DSA_QUESTION_BANK,
  SQL_QUESTION_BANK,
  CORE_CS_QUESTION_BANK,
  selectJdFilteredQuestions
};
