/**
 * Curated Question Bank for Role-Specific Aptitude Round (Module 13.5)
 * Total: 15 questions = 2 DSA_CODE + 3 SQL + 2 Core CS + 8 Project Ladder
 *
 * DSA questions require actual code in Java or Python (language auto-detected from resume).
 * Each DSA question has 2 visible sample test cases + 5 hidden test cases.
 * SQL questions are drawn from a rotating pool of 8 for variety.
 * Core CS theory: exactly 2 from shuffled bank.
 */

// ─── DSA CODE QUESTION BANK ──────────────────────────────────────────────────
// Simple beginner-friendly problems. Language is injected at selection time.
// All test cases: { input: string, expectedOutput: string }

const DSA_CODE_QUESTION_BANK = [
  {
    id: 'dsa-code-1',
    category: 'DSA_CODE',
    topic: 'arrays',
    tags: ['arrays', 'algorithms', 'basic', 'data structures'],
    title: 'Find Maximum Element',
    statement: 'Given a list of integers, write a function that returns the maximum element.',
    constraints: '• 1 ≤ array length ≤ 1000\n• −10,000 ≤ each element ≤ 10,000',
    sampleTestCases: [
      { input: '3 1 4 1 5 9 2 6', expectedOutput: '9', description: 'Basic positive numbers' },
      { input: '-5 -1 -3 -2', expectedOutput: '-1', description: 'All negative numbers' },
    ],
    hiddenTestCases: [
      { input: '0', expectedOutput: '0' },
      { input: '1000 999 998', expectedOutput: '1000' },
      { input: '-100 0 100', expectedOutput: '100' },
      { input: '7', expectedOutput: '7' },
      { input: '3 3 3 3', expectedOutput: '3' },
    ],
    starterCodePython: `# Read space-separated integers from stdin
nums = list(map(int, input().split()))
# Write your solution below
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                           .mapToInt(Integer::parseInt).toArray();
        // Write your solution below
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
  {
    id: 'dsa-code-2',
    category: 'DSA_CODE',
    topic: 'strings',
    tags: ['strings', 'algorithms', 'basic', 'palindrome'],
    title: 'Check Palindrome',
    statement: 'Given a string, write a function to check whether the string is a palindrome (reads the same forwards and backwards). Print "YES" if it is, "NO" otherwise. Ignore case.',
    constraints: '• 1 ≤ string length ≤ 500\n• String contains only alphanumeric characters',
    sampleTestCases: [
      { input: 'racecar', expectedOutput: 'YES', description: 'Classic palindrome' },
      { input: 'hello', expectedOutput: 'NO', description: 'Not a palindrome' },
    ],
    hiddenTestCases: [
      { input: 'Madam', expectedOutput: 'YES' },
      { input: 'abcba', expectedOutput: 'YES' },
      { input: 'python', expectedOutput: 'NO' },
      { input: 'a', expectedOutput: 'YES' },
      { input: 'AaBbAa', expectedOutput: 'NO' },
    ],
    starterCodePython: `s = input().strip()
# Write your solution below (print YES or NO)
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        // Write your solution below (print YES or NO)
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
  {
    id: 'dsa-code-3',
    category: 'DSA_CODE',
    topic: 'two pointers',
    tags: ['arrays', 'algorithms', 'two pointers', 'sum'],
    title: 'Two Sum (Sorted Array)',
    statement: 'Given a sorted array of integers and a target value, find if any two elements sum to the target. Print "YES" if found, "NO" otherwise. Input: first line is the target, second line is space-separated sorted integers.',
    constraints: '• 2 ≤ array length ≤ 500\n• All integers in range −10,000 to 10,000',
    sampleTestCases: [
      { input: '9\n2 4 6 7', expectedOutput: 'YES', description: '2+7 = 9' },
      { input: '10\n1 2 3 4', expectedOutput: 'NO', description: 'No pair sums to 10' },
    ],
    hiddenTestCases: [
      { input: '6\n1 2 3 4 5', expectedOutput: 'YES' },
      { input: '100\n1 50 60', expectedOutput: 'NO' },
      { input: '0\n-5 -3 3 5', expectedOutput: 'YES' },
      { input: '4\n1 2 4', expectedOutput: 'YES' },
      { input: '-4\n-7 -4 -2 0', expectedOutput: 'YES' },
    ],
    starterCodePython: `target = int(input())
nums = list(map(int, input().split()))
# Write your solution below (print YES or NO)
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int target = Integer.parseInt(sc.nextLine().trim());
        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                           .mapToInt(Integer::parseInt).toArray();
        // Write your solution below (print YES or NO)
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
  {
    id: 'dsa-code-4',
    category: 'DSA_CODE',
    topic: 'hashing',
    tags: ['hashing', 'data structures', 'frequency', 'arrays'],
    title: 'Count Duplicates',
    statement: 'Given a list of space-separated integers, print the count of elements that appear more than once.',
    constraints: '• 1 ≤ array length ≤ 1000',
    sampleTestCases: [
      { input: '1 2 3 2 1 4', expectedOutput: '2', description: '1 and 2 appear more than once' },
      { input: '5 6 7 8', expectedOutput: '0', description: 'All unique' },
    ],
    hiddenTestCases: [
      { input: '1 1 1 1', expectedOutput: '1' },
      { input: '1 2 3', expectedOutput: '0' },
      { input: '1 2 1 3 2 4 3', expectedOutput: '3' },
      { input: '10', expectedOutput: '0' },
      { input: '5 5 6 6 7 7', expectedOutput: '3' },
    ],
    starterCodePython: `nums = list(map(int, input().split()))
# Write your solution below (print the count)
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                           .mapToInt(Integer::parseInt).toArray();
        // Write your solution below (print the count)
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
  {
    id: 'dsa-code-5',
    category: 'DSA_CODE',
    topic: 'sorting',
    tags: ['sorting', 'algorithms', 'basic'],
    title: 'Reverse Sort',
    statement: 'Given a list of space-separated integers, print them sorted in descending order (space-separated on one line).',
    constraints: '• 1 ≤ array length ≤ 500',
    sampleTestCases: [
      { input: '3 1 4 1 5 9 2 6', expectedOutput: '9 6 5 4 3 2 1 1', description: 'Sort descending' },
      { input: '5 3 1', expectedOutput: '5 3 1', description: 'Already sorted' },
    ],
    hiddenTestCases: [
      { input: '1', expectedOutput: '1' },
      { input: '-5 -1 -3', expectedOutput: '-1 -3 -5' },
      { input: '10 10 10', expectedOutput: '10 10 10' },
      { input: '0 0 1', expectedOutput: '1 0 0' },
      { input: '100 1 50 25', expectedOutput: '100 50 25 1' },
    ],
    starterCodePython: `nums = list(map(int, input().split()))
# Write your solution below (print sorted descending)
`,
    starterCodeJava: `import java.util.*;
import java.util.stream.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                           .mapToInt(Integer::parseInt).toArray();
        // Write your solution below (print sorted descending)
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
  {
    id: 'dsa-code-6',
    category: 'DSA_CODE',
    topic: 'stack',
    tags: ['stack', 'data structures', 'brackets', 'matching'],
    title: 'Valid Parentheses',
    statement: 'Given a string containing only "(", ")", "{", "}", "[", "]", determine if the brackets are balanced. Print "YES" if valid, "NO" otherwise.',
    constraints: '• 1 ≤ string length ≤ 1000\n• Only bracket characters',
    sampleTestCases: [
      { input: '()[]{}', expectedOutput: 'YES', description: 'All matched' },
      { input: '([)]', expectedOutput: 'NO', description: 'Wrong order' },
    ],
    hiddenTestCases: [
      { input: '((()))', expectedOutput: 'YES' },
      { input: '{[]}', expectedOutput: 'YES' },
      { input: '(()', expectedOutput: 'NO' },
      { input: '', expectedOutput: 'YES' },
      { input: '))', expectedOutput: 'NO' },
    ],
    starterCodePython: `s = input().strip()
# Write your solution below (print YES or NO)
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
        // Write your solution below (print YES or NO)
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
];

// ─── SQL QUESTION BANK (Pool of 8 → 3 selected per candidate) ──────────────
const SQL_QUESTION_BANK = [
  {
    id: 'sql-bank-1',
    category: 'SQL',
    topic: 'aggregation',
    tags: ['reporting', 'analytics', 'aggregation', 'sql', 'databases', 'dbms'],
    statement: 'Write a SQL query to select department and average salary (as avg_sal) from employees table grouped by department, ordered by avg_sal descending.',
    canonicalAnswer: 'SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department ORDER BY avg_sal DESC',
    acceptedSynonyms: [
      'SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department',
      'SELECT department, avg(salary) as avg_sal FROM employees GROUP BY department ORDER BY avg_sal desc',
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, department TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Engineering', 90000);
      INSERT INTO employees VALUES (2, 'Engineering', 110000);
      INSERT INTO employees VALUES (3, 'Sales', 70000);
      INSERT INTO employees VALUES (4, 'Sales', 80000);
    `,
    referenceQuery: `SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department ORDER BY avg_sal DESC`,
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-2',
    category: 'SQL',
    topic: 'self join',
    tags: ['joins', 'relational db', 'sql', 'databases'],
    statement: 'Write a SQL query to list each employee\'s name alongside their manager\'s name using a self-join on the employees table (match manager_id to id).',
    canonicalAnswer: 'SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id',
    acceptedSynonyms: [
      'SELECT e.name, m.name FROM employees e INNER JOIN employees m ON e.manager_id = m.id',
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
  },
  {
    id: 'sql-bank-3',
    category: 'SQL',
    topic: 'filtering & ordering',
    tags: ['filtering', 'sql', 'databases', 'basic'],
    statement: 'Write a SQL query to find all products with price greater than 50, ordered by price ascending.',
    canonicalAnswer: 'SELECT * FROM products WHERE price > 50 ORDER BY price ASC',
    acceptedSynonyms: [
      'SELECT * FROM products WHERE price > 50 ORDER BY price',
      'SELECT id, name, price FROM products WHERE price > 50 ORDER BY price',
    ],
    referenceSchemaSql: `
      CREATE TABLE products (id INT PRIMARY KEY, name TEXT, price REAL);
      INSERT INTO products VALUES (1, 'Apple', 20);
      INSERT INTO products VALUES (2, 'Laptop', 800);
      INSERT INTO products VALUES (3, 'Book', 60);
      INSERT INTO products VALUES (4, 'Phone', 300);
    `,
    referenceQuery: `SELECT * FROM products WHERE price > 50 ORDER BY price ASC`,
    difficulty: 'EASY',
    marks: 1.5,
  },
  {
    id: 'sql-bank-4',
    category: 'SQL',
    topic: 'count and group by',
    tags: ['aggregation', 'sql', 'databases', 'count', 'reporting'],
    statement: 'Write a SQL query to count how many orders each customer has placed. Return customer_id and order_count, ordered by order_count descending.',
    canonicalAnswer: 'SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id ORDER BY order_count DESC',
    acceptedSynonyms: [
      'SELECT customer_id, count(*) as order_count FROM orders GROUP BY customer_id ORDER BY order_count desc',
    ],
    referenceSchemaSql: `
      CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount REAL);
      INSERT INTO orders VALUES (1, 1, 100);
      INSERT INTO orders VALUES (2, 2, 200);
      INSERT INTO orders VALUES (3, 1, 150);
      INSERT INTO orders VALUES (4, 3, 80);
      INSERT INTO orders VALUES (5, 2, 120);
    `,
    referenceQuery: `SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id ORDER BY order_count DESC`,
    difficulty: 'EASY',
    marks: 1.5,
  },
  {
    id: 'sql-bank-5',
    category: 'SQL',
    topic: 'inner join',
    tags: ['joins', 'sql', 'databases', 'relational db', 'transactional systems'],
    statement: 'Write a SQL query to fetch the order_id, customer name, and amount by joining orders and customers tables on customer_id.',
    canonicalAnswer: 'SELECT o.id AS order_id, c.name, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id',
    acceptedSynonyms: [
      'SELECT o.id, c.name, o.amount FROM orders o INNER JOIN customers c ON o.customer_id = c.id',
    ],
    referenceSchemaSql: `
      CREATE TABLE customers (id INT PRIMARY KEY, name TEXT);
      CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount REAL);
      INSERT INTO customers VALUES (1, 'Alice');
      INSERT INTO customers VALUES (2, 'Bob');
      INSERT INTO orders VALUES (1, 1, 250);
      INSERT INTO orders VALUES (2, 2, 400);
      INSERT INTO orders VALUES (3, 1, 150);
    `,
    referenceQuery: `SELECT o.id AS order_id, c.name, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.id`,
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-6',
    category: 'SQL',
    topic: 'having clause',
    tags: ['aggregation', 'having', 'sql', 'databases', 'analytics'],
    statement: 'Write a SQL query to find departments that have more than 2 employees. Return department and employee_count.',
    canonicalAnswer: 'SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY department HAVING COUNT(*) > 2',
    acceptedSynonyms: [
      'SELECT department, count(*) AS employee_count FROM employees GROUP BY department HAVING count(*) > 2',
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, department TEXT);
      INSERT INTO employees VALUES (1, 'Alice', 'Engineering');
      INSERT INTO employees VALUES (2, 'Bob', 'Engineering');
      INSERT INTO employees VALUES (3, 'Charlie', 'Engineering');
      INSERT INTO employees VALUES (4, 'Dave', 'Sales');
      INSERT INTO employees VALUES (5, 'Eve', 'HR');
    `,
    referenceQuery: `SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY department HAVING COUNT(*) > 2`,
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-7',
    category: 'SQL',
    topic: 'subquery',
    tags: ['subquery', 'sql', 'databases', 'analytics', 'reporting'],
    statement: 'Write a SQL query to find the name of the employee(s) with the highest salary.',
    canonicalAnswer: 'SELECT name FROM employees WHERE salary = (SELECT MAX(salary) FROM employees)',
    acceptedSynonyms: [
      'SELECT name FROM employees WHERE salary = (SELECT max(salary) FROM employees)',
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Alice', 90000);
      INSERT INTO employees VALUES (2, 'Bob', 110000);
      INSERT INTO employees VALUES (3, 'Charlie', 95000);
    `,
    referenceQuery: `SELECT name FROM employees WHERE salary = (SELECT MAX(salary) FROM employees)`,
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-8',
    category: 'SQL',
    topic: 'distinct & count',
    tags: ['distinct', 'sql', 'databases', 'basic', 'filtering'],
    statement: 'Write a SQL query to count the number of distinct cities in a users table.',
    canonicalAnswer: 'SELECT COUNT(DISTINCT city) AS city_count FROM users',
    acceptedSynonyms: [
      'SELECT count(distinct city) FROM users',
      'SELECT COUNT(DISTINCT city) FROM users',
    ],
    referenceSchemaSql: `
      CREATE TABLE users (id INT PRIMARY KEY, name TEXT, city TEXT);
      INSERT INTO users VALUES (1, 'Alice', 'Mumbai');
      INSERT INTO users VALUES (2, 'Bob', 'Delhi');
      INSERT INTO users VALUES (3, 'Charlie', 'Mumbai');
      INSERT INTO users VALUES (4, 'Dave', 'Pune');
    `,
    referenceQuery: `SELECT COUNT(DISTINCT city) AS city_count FROM users`,
    difficulty: 'EASY',
    marks: 1.5,
  },
];

// ─── CORE CS THEORY BANK ─────────────────────────────────────────────────────
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
    statement: 'Which OOP principle allows a derived class to provide a specific implementation of a method already defined in its base class?',
    canonicalAnswer: 'Method Overriding',
    acceptedSynonyms: ['Overriding', 'Method overriding', 'Runtime Polymorphism', 'override'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-5',
    category: 'CORE_CS',
    topic: 'OS',
    tags: ['operating systems', 'processes', 'scheduling'],
    statement: 'Which CPU scheduling algorithm always runs the shortest remaining job first and is optimal for minimizing average waiting time?',
    canonicalAnswer: 'Shortest Job First',
    acceptedSynonyms: ['SJF', 'SRTF', 'Shortest Remaining Time', 'sjf'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-6',
    category: 'CORE_CS',
    topic: 'Networking',
    tags: ['networking', 'http', 'web', 'rest api'],
    statement: 'Which HTTP method is used to partially update an existing resource on the server without sending the full representation?',
    canonicalAnswer: 'PATCH',
    acceptedSynonyms: ['patch', 'HTTP PATCH'],
    difficulty: 'EASY',
    marks: 1.0,
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Simple pseudo-random shuffle based on seed
 */
function shuffleWithSeed(array, seed = Date.now()) {
  const arr = [...array];
  let m = arr.length, t, i;
  let s = typeof seed === 'number' ? seed : String(seed).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    i = Math.floor((s / 233280) * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

/**
 * Detect preferred coding language from student resume/skills/projects.
 * Returns 'python' or 'java' (defaults to 'python').
 */
function detectPreferredLanguage(studentProfile) {
  const allText = [
    ...(studentProfile?.skills || []).map(s => (typeof s === 'string' ? s : s.name) || ''),
    ...(studentProfile?.projects || []).flatMap(p => [
      p.title || '',
      p.description || '',
      ...(p.techStack || [])
    ]),
    ...(studentProfile?.experiences || []).map(e => `${e.role || ''} ${e.description || ''}`),
    studentProfile?.summary || '',
  ].join(' ').toLowerCase();

  const javaScore = (allText.match(/\bjava\b/g) || []).length * 2 +
                    (allText.match(/\bspring\b/g) || []).length +
                    (allText.match(/\bhibernate\b/g) || []).length +
                    (allText.match(/\bmaven\b/g) || []).length;

  const pythonScore = (allText.match(/\bpython\b/g) || []).length * 2 +
                      (allText.match(/\bdjango\b/g) || []).length +
                      (allText.match(/\bflask\b/g) || []).length +
                      (allText.match(/\bfastapi\b/g) || []).length +
                      (allText.match(/\bpandas\b/g) || []).length +
                      (allText.match(/\bnumpy\b/g) || []).length;

  return javaScore > pythonScore ? 'java' : 'python';
}

/**
 * Select exactly:
 *   2 DSA_CODE questions (language-tagged from pool, shuffled per candidate)
 *   3 SQL questions (from rotating pool of 8, shuffled per candidate)
 *   2 Core CS theory questions (shuffled, JD-matched first)
 *
 * Total from bank: 7 questions. Remaining 8 from Project Ladder = 15 total.
 */
function selectJdFilteredQuestions(jobDetails, coreTopics = [], seed = Date.now(), studentProfile = null) {
  const jdText = `${jobDetails?.title || ''} ${jobDetails?.description || ''} ${jobDetails?.requirements || ''}`.toLowerCase();
  const language = detectPreferredLanguage(studentProfile);

  // ── 2 DSA CODE QUESTIONS ──
  const shuffledDsaBank = shuffleWithSeed(DSA_CODE_QUESTION_BANK, seed);
  // Prefer questions whose tags match JD/resume topics
  const dsaMatched = shuffledDsaBank.filter(q =>
    q.tags.some(tag => jdText.includes(tag)) || coreTopics.some(t => q.tags.includes((t || '').toLowerCase()))
  );
  const dsaPool = dsaMatched.length >= 2 ? dsaMatched : shuffledDsaBank;
  const selectedDsa = dsaPool.slice(0, 2).map(q => ({
    ...q,
    language, // inject preferred language
    starterCode: language === 'java' ? q.starterCodeJava : q.starterCodePython,
    // Don't expose hidden test cases to candidate
    hiddenTestCases: undefined,
    _hiddenTestCases: q.hiddenTestCases, // stored separately for grading
  }));

  // ── 3 SQL QUESTIONS ──
  const shuffledSqlBank = shuffleWithSeed(SQL_QUESTION_BANK, seed + 7);
  const sqlMatched = shuffledSqlBank.filter(q =>
    q.tags.some(tag => jdText.includes(tag)) || coreTopics.some(t => q.tags.includes((t || '').toLowerCase()))
  );
  const sqlPool = sqlMatched.length >= 3 ? sqlMatched : shuffledSqlBank;
  const selectedSql = sqlPool.slice(0, 3);

  // ── 2 CORE CS QUESTIONS ──
  const shuffledCoreCsBank = shuffleWithSeed(CORE_CS_QUESTION_BANK, seed + 13);
  const csMatched = shuffledCoreCsBank.filter(q =>
    q.tags.some(tag => jdText.includes(tag)) || coreTopics.some(t => q.tags.includes((t || '').toLowerCase()))
  );
  const csPool = csMatched.length >= 2 ? csMatched : shuffledCoreCsBank;
  const selectedCoreCs = csPool.slice(0, 2);

  return {
    dsaQuestions: selectedDsa,   // 2
    sqlQuestions: selectedSql,   // 3
    coreCsQuestions: selectedCoreCs, // 2
    language,
  };
}

module.exports = {
  DSA_CODE_QUESTION_BANK,
  SQL_QUESTION_BANK,
  CORE_CS_QUESTION_BANK,
  selectJdFilteredQuestions,
  shuffleWithSeed,
  detectPreferredLanguage,
};
