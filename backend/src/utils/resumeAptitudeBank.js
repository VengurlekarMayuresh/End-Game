/**
 * Curated Question Bank for Role-Specific Aptitude Round (Module 13.5)
 * Total: 15 questions = 2 DSA_CODE + 3 SQL + 2 Core CS + 8 Project Ladder
 *
 * DSA questions require actual code in Java or Python (auto-detected from resume).
 * SQL questions provide full table schema definitions + sample rows so candidates can write queries accurately.
 * Dynamic randomization guarantees non-repeating questions across attempts.
 */

// ─── DSA CODE QUESTION BANK ──────────────────────────────────────────────────
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
print(max(nums))
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
    tags: ['arrays', 'algorithms', 'two pointers', 'sum', 'intermediate'],
    title: 'Two Sum in Sorted Array',
    statement: 'Given a sorted array of integers and a target value, find if any two distinct elements sum to the target. Print "YES" if found, "NO" otherwise. Input: first line is the target, second line is space-separated sorted integers.',
    constraints: '• 2 ≤ array length ≤ 10,000\n• All integers in range −10,000 to 10,000',
    sampleTestCases: [
      { input: '9\n2 4 6 7', expectedOutput: 'YES', description: '2 + 7 = 9' },
      { input: '10\n1 2 3 4', expectedOutput: 'NO', description: 'No pair sums to 10' },
    ],
    hiddenTestCases: [
      { input: '6\n1 2 3 4 5', expectedOutput: 'YES' },
      { input: '100\n1 50 60', expectedOutput: 'NO' },
      { input: '0\n-5 -3 3 5', expectedOutput: 'YES' },
      { input: '4\n1 2 4', expectedOutput: 'NO' },
      { input: '14\n2 7 11 15', expectedOutput: 'NO' },
    ],
    starterCodePython: `target = int(input().strip())
nums = list(map(int, input().split()))
# Write your two-pointer solution below
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int target = Integer.parseInt(sc.nextLine().trim());
        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                           .mapToInt(Integer::parseInt).toArray();
        // Write your solution below
    }
}`,
    difficulty: 'MEDIUM',
    marks: 2.0,
  },
  {
    id: 'dsa-code-4',
    category: 'DSA_CODE',
    topic: 'stacks',
    tags: ['stacks', 'data structures', 'parsing', 'intermediate'],
    title: 'Balanced Brackets Validation',
    statement: 'Given a string containing only brackets "()", "{}", "[]", determine if the input string is valid. Print "YES" if valid, "NO" otherwise.',
    constraints: '• 1 ≤ string length ≤ 1,000\n• String consists solely of characters ()[]{}',
    sampleTestCases: [
      { input: '()[]{}', expectedOutput: 'YES', description: 'All matched in correct order' },
      { input: '(]', expectedOutput: 'NO', description: 'Mismatched closing bracket' },
    ],
    hiddenTestCases: [
      { input: '((()))', expectedOutput: 'YES' },
      { input: '{[]}', expectedOutput: 'YES' },
      { input: '(()', expectedOutput: 'NO' },
      { input: '([)]', expectedOutput: 'NO' },
      { input: ']', expectedOutput: 'NO' },
    ],
    starterCodePython: `s = input().strip()
# Write your stack solution below (print YES or NO)
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
        // Write your solution below
    }
}`,
    difficulty: 'MEDIUM',
    marks: 2.0,
  },
  {
    id: 'dsa-code-5',
    category: 'DSA_CODE',
    topic: 'arrays',
    tags: ['arrays', 'in-place', 'two pointers', 'basic'],
    title: 'Move Zeroes to End',
    statement: 'Given an array of integers, move all 0\'s to the end while maintaining the relative order of non-zero elements. Print space-separated numbers.',
    constraints: '• 1 ≤ array length ≤ 1,000',
    sampleTestCases: [
      { input: '0 1 0 3 12', expectedOutput: '1 3 12 0 0', description: 'Zeros shifted to right' },
      { input: '0 0', expectedOutput: '0 0', description: 'Only zeros' },
    ],
    hiddenTestCases: [
      { input: '1 2 3', expectedOutput: '1 2 3' },
      { input: '0', expectedOutput: '0' },
      { input: '4 0 5 0 6', expectedOutput: '4 5 6 0 0' },
      { input: '0 0 1', expectedOutput: '1 0 0' },
      { input: '9 0', expectedOutput: '9 0' },
    ],
    starterCodePython: `nums = list(map(int, input().split()))
# Write your in-place shifting solution below
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+")).mapToInt(Integer::parseInt).toArray();
        // Write your solution below
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
  {
    id: 'dsa-code-6',
    category: 'DSA_CODE',
    topic: 'hash tables',
    tags: ['hash tables', 'counting', 'strings', 'intermediate'],
    title: 'First Unique Character',
    statement: 'Given a lowercase string, print the first non-repeating character. If no such character exists, print "-1".',
    constraints: '• 1 ≤ string length ≤ 1,000\n• All characters are lowercase English letters',
    sampleTestCases: [
      { input: 'leetcode', expectedOutput: 'l', description: 'l appears once' },
      { input: 'aabb', expectedOutput: '-1', description: 'All characters repeat' },
    ],
    hiddenTestCases: [
      { input: 'loveleetcode', expectedOutput: 'v' },
      { input: 'z', expectedOutput: 'z' },
      { input: 'abacabad', expectedOutput: 'c' },
      { input: 'aaaabbbbcccc', expectedOutput: '-1' },
      { input: 'algorithm', expectedOutput: 'a' },
    ],
    starterCodePython: `s = input().strip()
# Write your frequency map solution below
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        // Write your solution below
    }
}`,
    difficulty: 'MEDIUM',
    marks: 2.0,
  },
  {
    id: 'dsa-code-7',
    category: 'DSA_CODE',
    topic: 'arrays',
    tags: ['arrays', 'sorting', 'basic', 'general'],
    title: 'Find Second Largest Element',
    statement: 'Given an array of distinct integers, print the second largest element in the array.',
    constraints: '• 2 ≤ array length ≤ 1,000\n• −10,000 ≤ elements ≤ 10,000',
    sampleTestCases: [
      { input: '12 35 1 10 34 1', expectedOutput: '34', description: '35 is largest, 34 is second largest' },
      { input: '10 5 20', expectedOutput: '10', description: '20 is largest, 10 is second' },
    ],
    hiddenTestCases: [
      { input: '1 2', expectedOutput: '1' },
      { input: '100 200 50', expectedOutput: '100' },
      { input: '-10 -5 0', expectedOutput: '-5' },
      { input: '5 9 12 1', expectedOutput: '9' },
      { input: '70 80 90 100', expectedOutput: '90' },
    ],
    starterCodePython: `nums = list(map(int, input().split()))
# Write your solution below
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+")).mapToInt(Integer::parseInt).toArray();
        // Write your solution below
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
  {
    id: 'dsa-code-8',
    category: 'DSA_CODE',
    topic: 'strings',
    tags: ['strings', 'anagram', 'hash tables', 'general'],
    title: 'Valid Anagram Check',
    statement: 'Given two lowercase strings separated by space, determine if the second string is an anagram of the first (contains exact same characters with the same frequencies). Print "YES" or "NO".',
    constraints: '• 1 ≤ string length ≤ 1,000\n• All characters lowercase a-z',
    sampleTestCases: [
      { input: 'anagram nagaram', expectedOutput: 'YES', description: 'Valid anagram' },
      { input: 'rat car', expectedOutput: 'NO', description: 'Different characters' },
    ],
    hiddenTestCases: [
      { input: 'listen silent', expectedOutput: 'YES' },
      { input: 'hello world', expectedOutput: 'NO' },
      { input: 'a a', expectedOutput: 'YES' },
      { input: 'ab ba', expectedOutput: 'YES' },
      { input: 'abc def', expectedOutput: 'NO' },
    ],
    starterCodePython: `s1, s2 = input().split()
# Write your anagram verification below (print YES or NO)
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        String s1 = parts[0], s2 = parts[1];
        // Write your solution below
    }
}`,
    difficulty: 'EASY',
    marks: 2.0,
  },
  {
    id: 'dsa-code-9',
    category: 'DSA_CODE',
    topic: 'hash tables',
    tags: ['prefix sum', 'hash set', 'subarrays', 'intermediate', 'difficult'],
    title: 'Subarray with 0 Sum',
    statement: 'Given an array of integers, determine whether there exists a non-empty contiguous subarray whose elements sum to 0. Print "YES" if such subarray exists, "NO" otherwise.',
    constraints: '• 1 ≤ array length ≤ 5,000\n• −10,000 ≤ elements ≤ 10,000',
    sampleTestCases: [
      { input: '4 2 -3 1 6', expectedOutput: 'YES', description: 'Subarray [2, -3, 1] sums to 0' },
      { input: '4 2 0 1 6', expectedOutput: 'YES', description: 'Subarray [0] sums to 0' },
    ],
    hiddenTestCases: [
      { input: '1 2 3', expectedOutput: 'NO' },
      { input: '-3 2 1', expectedOutput: 'YES' },
      { input: '5 -5', expectedOutput: 'YES' },
      { input: '10 20 30', expectedOutput: 'NO' },
      { input: '-1 1', expectedOutput: 'YES' },
    ],
    starterCodePython: `nums = list(map(int, input().split()))
# Write your prefix sum & set solution below (print YES or NO)
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+")).mapToInt(Integer::parseInt).toArray();
        // Write your solution below
    }
}`,
    difficulty: 'MEDIUM',
    marks: 2.0,
  },
  {
    id: 'dsa-code-10',
    category: 'DSA_CODE',
    topic: 'two pointers',
    tags: ['two pointers', 'merging', 'arrays', 'intermediate'],
    title: 'Merge Two Sorted Sequences',
    statement: 'Given two sorted lists of integers (first line is list A, second line is list B), merge them into a single sorted list printed on a single line separated by spaces.',
    constraints: '• 1 ≤ lengths of A, B ≤ 5,000\n• Inputs are already in ascending order',
    sampleTestCases: [
      { input: '1 3 5\n2 4 6', expectedOutput: '1 2 3 4 5 6', description: 'Standard interleaved merge' },
      { input: '10 20\n5 15 25', expectedOutput: '5 10 15 20 25', description: 'Merged output' },
    ],
    hiddenTestCases: [
      { input: '1\n2', expectedOutput: '1 2' },
      { input: '2 4 6\n1 3', expectedOutput: '1 2 3 4 6' },
      { input: '5\n1 2 3', expectedOutput: '1 2 3 5' },
      { input: '1 1\n1 1', expectedOutput: '1 1 1 1' },
      { input: '-5 0\n-3 2', expectedOutput: '-5 -3 0 2' },
    ],
    starterCodePython: `a = list(map(int, input().split()))
b = list(map(int, input().split()))
# Write two-pointer merge below and print space-separated result
`,
    starterCodeJava: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] a = Arrays.stream(sc.nextLine().trim().split("\\\\s+")).mapToInt(Integer::parseInt).toArray();
        int[] b = Arrays.stream(sc.nextLine().trim().split("\\\\s+")).mapToInt(Integer::parseInt).toArray();
        // Write your two-pointer merge solution below
    }
}`,
    difficulty: 'MEDIUM',
    marks: 2.0,
  }
];

// ─── SQL QUESTION BANK WITH DETAILED TABLE SCHEMAS ────────────────────────────
const SQL_QUESTION_BANK = [
  {
    id: 'sql-bank-1',
    category: 'SQL',
    topic: 'aggregation & group by',
    tags: ['aggregation', 'sql', 'databases', 'analytics'],
    title: 'Average Department Salary Analysis',
    statement: 'Write a SQL query to calculate the average salary for each department from the `employees` table. Output `department` and `avg_sal` (rounded or aliased as avg_sal), ordered by `avg_sal` in descending order.',
    tableSchema: [
      {
        tableName: 'employees',
        description: 'Records staff information, assigned division, and compensation',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(50)' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' }
        ],
        sampleData: [
          { id: 1, name: 'Alice Smith', department: 'Engineering', salary: 95000 },
          { id: 2, name: 'Bob Johnson', department: 'Engineering', salary: 110000 },
          { id: 3, name: 'Charlie Ray', department: 'Sales', salary: 70000 },
          { id: 4, name: 'Diana Prince', department: 'Sales', salary: 85000 },
          { id: 5, name: 'Ethan Hunt', department: 'Product', salary: 105000 }
        ]
      }
    ],
    canonicalAnswer: 'SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department ORDER BY avg_sal DESC',
    acceptedSynonyms: [
      'SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department',
      'SELECT department, avg(salary) as avg_sal FROM employees GROUP BY department ORDER BY avg_sal desc',
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, department TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Alice Smith', 'Engineering', 95000);
      INSERT INTO employees VALUES (2, 'Bob Johnson', 'Engineering', 110000);
      INSERT INTO employees VALUES (3, 'Charlie Ray', 'Sales', 70000);
      INSERT INTO employees VALUES (4, 'Diana Prince', 'Sales', 85000);
      INSERT INTO employees VALUES (5, 'Ethan Hunt', 'Product', 105000);
    `,
    referenceQuery: 'SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department ORDER BY avg_sal DESC',
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-2',
    category: 'SQL',
    topic: 'self join & hierarchical data',
    tags: ['joins', 'self-join', 'sql', 'databases'],
    title: 'Employee-Manager Hierarchy',
    statement: 'Write a SQL query to list each employee\'s name alongside their direct manager\'s name using a self-join on the `employees` table (matching `manager_id` to `id`). Alias columns as `employee` and `manager`.',
    tableSchema: [
      {
        tableName: 'employees',
        description: 'Hierarchical employee data where manager_id references id',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(50)' },
          { name: 'manager_id', type: 'INT', isForeign: true }
        ],
        sampleData: [
          { id: 1, name: 'Alice (CTO)', manager_id: null },
          { id: 2, name: 'Bob (Lead)', manager_id: 1 },
          { id: 3, name: 'Charlie (Dev)', manager_id: 2 },
          { id: 4, name: 'David (Dev)', manager_id: 2 }
        ]
      }
    ],
    canonicalAnswer: 'SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id',
    acceptedSynonyms: [
      'SELECT e.name AS employee, m.name AS manager FROM employees e INNER JOIN employees m ON e.manager_id = m.id',
      'SELECT e.name, m.name FROM employees e JOIN employees m ON e.manager_id = m.id'
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, manager_id INT);
      INSERT INTO employees VALUES (1, 'Alice', NULL);
      INSERT INTO employees VALUES (2, 'Bob', 1);
      INSERT INTO employees VALUES (3, 'Charlie', 2);
      INSERT INTO employees VALUES (4, 'David', 2);
    `,
    referenceQuery: 'SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id ORDER BY e.name',
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-3',
    category: 'SQL',
    topic: 'filtering & ordering',
    tags: ['filtering', 'sql', 'databases', 'basic'],
    title: 'High-Value Product Catalog',
    statement: 'Write a SQL query to select all products from the `products` table where `price` is strictly greater than 50, sorted by `price` in ascending order.',
    tableSchema: [
      {
        tableName: 'products',
        description: 'E-commerce inventory and unit price records',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(60)' },
          { name: 'category', type: 'VARCHAR(40)' },
          { name: 'price', type: 'DECIMAL(8,2)' }
        ],
        sampleData: [
          { id: 1, name: 'Mechanical Keyboard', category: 'Electronics', price: 95.00 },
          { id: 2, name: 'Mouse Pad', category: 'Accessories', price: 18.50 },
          { id: 3, name: '4K Monitor', category: 'Electronics', price: 320.00 },
          { id: 4, name: 'USB-C Cable', category: 'Accessories', price: 12.00 },
          { id: 5, name: 'Desk Lamp', category: 'Furniture', price: 65.00 }
        ]
      }
    ],
    canonicalAnswer: 'SELECT * FROM products WHERE price > 50 ORDER BY price ASC',
    acceptedSynonyms: [
      'SELECT * FROM products WHERE price > 50 ORDER BY price',
      'SELECT id, name, category, price FROM products WHERE price > 50 ORDER BY price ASC'
    ],
    referenceSchemaSql: `
      CREATE TABLE products (id INT PRIMARY KEY, name TEXT, category TEXT, price REAL);
      INSERT INTO products VALUES (1, 'Mechanical Keyboard', 'Electronics', 95.00);
      INSERT INTO products VALUES (2, 'Mouse Pad', 'Accessories', 18.50);
      INSERT INTO products VALUES (3, '4K Monitor', 'Electronics', 320.00);
      INSERT INTO products VALUES (4, 'USB-C Cable', 'Accessories', 12.00);
      INSERT INTO products VALUES (5, 'Desk Lamp', 'Furniture', 65.00);
    `,
    referenceQuery: 'SELECT * FROM products WHERE price > 50 ORDER BY price ASC',
    difficulty: 'EASY',
    marks: 1.5,
  },
  {
    id: 'sql-bank-4',
    category: 'SQL',
    topic: 'multi-table relational join',
    tags: ['joins', 'relational', 'foreign key', 'orders'],
    title: 'Customer Order History Join',
    statement: 'Write a SQL query to join `customers` and `orders` on `customer_id`. Return `orders.id AS order_id`, `customers.name AS customer_name`, and `orders.amount`. Order by `order_id` ascending.',
    tableSchema: [
      {
        tableName: 'customers',
        description: 'Registered users and clients',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(50)' },
          { name: 'email', type: 'VARCHAR(80)' }
        ],
        sampleData: [
          { id: 101, name: 'Sarah Connor', email: 'sarah@sky.net' },
          { id: 102, name: 'John Doe', email: 'john@gmail.com' },
          { id: 103, name: 'Bruce Wayne', email: 'bruce@wayne.com' }
        ]
      },
      {
        tableName: 'orders',
        description: 'Purchases placed by customers',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'customer_id', type: 'INT', isForeign: true },
          { name: 'amount', type: 'DECIMAL(10,2)' },
          { name: 'order_date', type: 'DATE' }
        ],
        sampleData: [
          { id: 1, customer_id: 101, amount: 250.00, order_date: '2026-01-15' },
          { id: 2, customer_id: 103, amount: 1400.00, order_date: '2026-01-16' },
          { id: 3, customer_id: 101, amount: 90.00, order_date: '2026-01-20' },
          { id: 4, customer_id: 102, amount: 320.00, order_date: '2026-01-22' }
        ]
      }
    ],
    canonicalAnswer: 'SELECT o.id AS order_id, c.name AS customer_name, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY order_id ASC',
    acceptedSynonyms: [
      'SELECT o.id AS order_id, c.name AS customer_name, o.amount FROM orders o INNER JOIN customers c ON o.customer_id = c.id ORDER BY o.id',
      'SELECT o.id AS order_id, c.name, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.id'
    ],
    referenceSchemaSql: `
      CREATE TABLE customers (id INT PRIMARY KEY, name TEXT, email TEXT);
      CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount REAL, order_date TEXT);
      INSERT INTO customers VALUES (101, 'Sarah Connor', 'sarah@sky.net');
      INSERT INTO customers VALUES (102, 'John Doe', 'john@gmail.com');
      INSERT INTO customers VALUES (103, 'Bruce Wayne', 'bruce@wayne.com');
      INSERT INTO orders VALUES (1, 101, 250.00, '2026-01-15');
      INSERT INTO orders VALUES (2, 103, 1400.00, '2026-01-16');
      INSERT INTO orders VALUES (3, 101, 90.00, '2026-01-20');
      INSERT INTO orders VALUES (4, 102, 320.00, '2026-01-22');
    `,
    referenceQuery: 'SELECT o.id AS order_id, c.name AS customer_name, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.id ASC',
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-5',
    category: 'SQL',
    topic: 'having & filtered aggregates',
    tags: ['having', 'aggregation', 'sql', 'reporting'],
    title: 'High-Volume Order Customers',
    statement: 'Write a SQL query on the `orders` table to find all `customer_id` values that have placed more than 2 orders. Return `customer_id` and `total_orders`.',
    tableSchema: [
      {
        tableName: 'orders',
        description: 'Customer transactions log',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'customer_id', type: 'INT' },
          { name: 'amount', type: 'DECIMAL(10,2)' }
        ],
        sampleData: [
          { id: 1, customer_id: 10, amount: 50.00 },
          { id: 2, customer_id: 20, amount: 80.00 },
          { id: 3, customer_id: 10, amount: 120.00 },
          { id: 4, customer_id: 10, amount: 45.00 },
          { id: 5, customer_id: 30, amount: 200.00 },
          { id: 6, customer_id: 20, amount: 95.00 }
        ]
      }
    ],
    canonicalAnswer: 'SELECT customer_id, COUNT(*) AS total_orders FROM orders GROUP BY customer_id HAVING COUNT(*) > 2',
    acceptedSynonyms: [
      'SELECT customer_id, count(*) as total_orders FROM orders GROUP BY customer_id HAVING count(*) > 2',
      'SELECT customer_id, count(id) as total_orders FROM orders GROUP BY customer_id HAVING count(id) > 2'
    ],
    referenceSchemaSql: `
      CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount REAL);
      INSERT INTO orders VALUES (1, 10, 50.00);
      INSERT INTO orders VALUES (2, 20, 80.00);
      INSERT INTO orders VALUES (3, 10, 120.00);
      INSERT INTO orders VALUES (4, 10, 45.00);
      INSERT INTO orders VALUES (5, 30, 200.00);
      INSERT INTO orders VALUES (6, 20, 95.00);
    `,
    referenceQuery: 'SELECT customer_id, COUNT(*) AS total_orders FROM orders GROUP BY customer_id HAVING COUNT(*) > 2',
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-6',
    category: 'SQL',
    topic: 'subqueries & extreme values',
    tags: ['subquery', 'nested queries', 'analytics', 'difficult'],
    title: 'Top Earner Identification',
    statement: 'Write a SQL query to retrieve the `name` and `salary` of the employee(s) who earn the highest salary in the company using a subquery.',
    tableSchema: [
      {
        tableName: 'employees',
        description: 'Full employee roster with salary bands',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(50)' },
          { name: 'department', type: 'VARCHAR(40)' },
          { name: 'salary', type: 'DECIMAL(10,2)' }
        ],
        sampleData: [
          { id: 1, name: 'Elena Rostova', department: 'Engineering', salary: 145000 },
          { id: 2, name: 'Marcus Vance', department: 'Leadership', salary: 180000 },
          { id: 3, name: 'Priya Patel', department: 'Data', salary: 140000 },
          { id: 4, name: 'Devon Lee', department: 'Security', salary: 180000 }
        ]
      }
    ],
    canonicalAnswer: 'SELECT name, salary FROM employees WHERE salary = (SELECT MAX(salary) FROM employees)',
    acceptedSynonyms: [
      'SELECT name, salary FROM employees WHERE salary = (SELECT max(salary) FROM employees)',
      'SELECT name FROM employees WHERE salary = (SELECT MAX(salary) FROM employees)'
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, department TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Elena Rostova', 'Engineering', 145000);
      INSERT INTO employees VALUES (2, 'Marcus Vance', 'Leadership', 180000);
      INSERT INTO employees VALUES (3, 'Priya Patel', 'Data', 140000);
      INSERT INTO employees VALUES (4, 'Devon Lee', 'Security', 180000);
    `,
    referenceQuery: 'SELECT name, salary FROM employees WHERE salary = (SELECT MAX(salary) FROM employees) ORDER BY name',
    difficulty: 'HARD',
    marks: 1.5,
  },
  {
    id: 'sql-bank-7',
    category: 'SQL',
    topic: 'subqueries & offsets',
    tags: ['subqueries', 'sql', 'ranking', 'intermediate', 'difficult'],
    title: 'Second Highest Compensation',
    statement: 'Write a SQL query to find the second highest salary from the `employees` table. Alias the column as `second_highest_salary`.',
    tableSchema: [
      {
        tableName: 'employees',
        description: 'Employee payroll records with salary details',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(60)' },
          { name: 'department', type: 'VARCHAR(40)' },
          { name: 'salary', type: 'DECIMAL(10,2)' }
        ],
        sampleData: [
          { id: 1, name: 'Alice', department: 'Eng', salary: 120000 },
          { id: 2, name: 'Bob', department: 'Eng', salary: 95000 },
          { id: 3, name: 'Charlie', department: 'Product', salary: 140000 },
          { id: 4, name: 'Diana', department: 'Sales', salary: 110000 }
        ]
      }
    ],
    canonicalAnswer: 'SELECT MAX(salary) AS second_highest_salary FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)',
    acceptedSynonyms: [
      'SELECT DISTINCT salary AS second_highest_salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1',
      'SELECT max(salary) as second_highest_salary FROM employees WHERE salary < (SELECT max(salary) FROM employees)'
    ],
    referenceSchemaSql: `
      CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, department TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Alice', 'Eng', 120000);
      INSERT INTO employees VALUES (2, 'Bob', 'Eng', 95000);
      INSERT INTO employees VALUES (3, 'Charlie', 'Product', 140000);
      INSERT INTO employees VALUES (4, 'Diana', 'Sales', 110000);
    `,
    referenceQuery: 'SELECT MAX(salary) AS second_highest_salary FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)',
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-8',
    category: 'SQL',
    topic: 'joins & subqueries',
    tags: ['joins', 'null handling', 'subquery', 'difficult'],
    title: 'Customers with Zero Orders',
    statement: 'Write a SQL query to find the names of all customers who have never placed an order. Output `customer` (aliased as customer).',
    tableSchema: [
      {
        tableName: 'customers',
        description: 'Client register with unique ID and name',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(50)' },
          { name: 'email', type: 'VARCHAR(80)' }
        ],
        sampleData: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          { id: 3, name: 'Alex Wong', email: 'alex@example.com' },
          { id: 4, name: 'Maria Garcia', email: 'maria@example.com' }
        ]
      },
      {
        tableName: 'orders',
        description: 'Purchases linked to customer via customer_id',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'customer_id', type: 'INT', isForeign: true },
          { name: 'amount', type: 'DECIMAL(10,2)' }
        ],
        sampleData: [
          { id: 101, customer_id: 1, amount: 250.00 },
          { id: 102, customer_id: 3, amount: 80.50 },
          { id: 103, customer_id: 1, amount: 120.00 }
        ]
      }
    ],
    canonicalAnswer: 'SELECT c.name AS customer FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.id IS NULL',
    acceptedSynonyms: [
      'SELECT name AS customer FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)',
      'SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)'
    ],
    referenceSchemaSql: `
      CREATE TABLE customers (id INT PRIMARY KEY, name TEXT, email TEXT);
      CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount REAL);
      INSERT INTO customers VALUES (1, 'John Doe', 'john@example.com');
      INSERT INTO customers VALUES (2, 'Jane Smith', 'jane@example.com');
      INSERT INTO customers VALUES (3, 'Alex Wong', 'alex@example.com');
      INSERT INTO customers VALUES (4, 'Maria Garcia', 'maria@example.com');
      INSERT INTO orders VALUES (101, 1, 250.00);
      INSERT INTO orders VALUES (102, 3, 80.50);
      INSERT INTO orders VALUES (103, 1, 120.00);
    `,
    referenceQuery: 'SELECT c.name AS customer FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.id IS NULL ORDER BY customer',
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-9',
    category: 'SQL',
    topic: 'group by & having',
    tags: ['group by', 'having', 'aggregation', 'difficult'],
    title: 'High-Value Spending Accounts',
    statement: 'Write a SQL query to identify all `user_id`s whose total completed spending exceeds 500 across `SUCCESS` transactions. Output `user_id` and `total_spent`, ordered by `total_spent` in descending order.',
    tableSchema: [
      {
        tableName: 'transactions',
        description: 'Payment transaction ledger with statuses',
        columns: [
          { name: 'txn_id', type: 'INT', isPrimary: true },
          { name: 'user_id', type: 'INT' },
          { name: 'amount', type: 'DECIMAL(10,2)' },
          { name: 'status', type: 'VARCHAR(20)' }
        ],
        sampleData: [
          { txn_id: 1, user_id: 10, amount: 350.00, status: 'SUCCESS' },
          { txn_id: 2, user_id: 10, amount: 200.00, status: 'SUCCESS' },
          { txn_id: 3, user_id: 20, amount: 400.00, status: 'SUCCESS' },
          { txn_id: 4, user_id: 20, amount: 300.00, status: 'FAILED' },
          { txn_id: 5, user_id: 30, amount: 650.00, status: 'SUCCESS' }
        ]
      }
    ],
    canonicalAnswer: "SELECT user_id, SUM(amount) AS total_spent FROM transactions WHERE status = 'SUCCESS' GROUP BY user_id HAVING SUM(amount) > 500 ORDER BY total_spent DESC",
    acceptedSynonyms: [
      "SELECT user_id, sum(amount) as total_spent FROM transactions WHERE status = 'SUCCESS' GROUP BY user_id HAVING sum(amount) > 500",
      "SELECT user_id, SUM(amount) AS total_spent FROM transactions WHERE status = 'SUCCESS' GROUP BY user_id HAVING total_spent > 500"
    ],
    referenceSchemaSql: `
      CREATE TABLE transactions (txn_id INT PRIMARY KEY, user_id INT, amount REAL, status TEXT);
      INSERT INTO transactions VALUES (1, 10, 350.00, 'SUCCESS');
      INSERT INTO transactions VALUES (2, 10, 200.00, 'SUCCESS');
      INSERT INTO transactions VALUES (3, 20, 400.00, 'SUCCESS');
      INSERT INTO transactions VALUES (4, 20, 300.00, 'FAILED');
      INSERT INTO transactions VALUES (5, 30, 650.00, 'SUCCESS');
    `,
    referenceQuery: "SELECT user_id, SUM(amount) AS total_spent FROM transactions WHERE status = 'SUCCESS' GROUP BY user_id HAVING SUM(amount) > 500 ORDER BY total_spent DESC",
    difficulty: 'MEDIUM',
    marks: 1.5,
  },
  {
    id: 'sql-bank-10',
    category: 'SQL',
    topic: 'filtering & arithmetic',
    tags: ['filtering', 'comparison', 'basic', 'general'],
    title: 'Low Stock Inventory Alert',
    statement: 'Write a SQL query to select the `name` and `stock_quantity` of all items from `products` where `stock_quantity` is less than or equal to `reorder_threshold`, ordered by `stock_quantity` ascending.',
    tableSchema: [
      {
        tableName: 'products',
        description: 'Warehouse inventory tracking levels',
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(60)' },
          { name: 'stock_quantity', type: 'INT' },
          { name: 'reorder_threshold', type: 'INT' }
        ],
        sampleData: [
          { id: 1, name: 'Mechanical Keyboard', stock_quantity: 4, reorder_threshold: 10 },
          { id: 2, name: 'Wireless Mouse', stock_quantity: 25, reorder_threshold: 15 },
          { id: 3, name: 'USB-C Cable', stock_quantity: 8, reorder_threshold: 8 },
          { id: 4, name: 'Monitor Stand', stock_quantity: 18, reorder_threshold: 5 }
        ]
      }
    ],
    canonicalAnswer: 'SELECT name, stock_quantity FROM products WHERE stock_quantity <= reorder_threshold ORDER BY stock_quantity ASC',
    acceptedSynonyms: [
      'SELECT name, stock_quantity FROM products WHERE stock_quantity <= reorder_threshold ORDER BY stock_quantity',
      'SELECT name, stock_quantity FROM products WHERE stock_quantity <= reorder_threshold'
    ],
    referenceSchemaSql: `
      CREATE TABLE products (id INT PRIMARY KEY, name TEXT, stock_quantity INT, reorder_threshold INT);
      INSERT INTO products VALUES (1, 'Mechanical Keyboard', 4, 10);
      INSERT INTO products VALUES (2, 'Wireless Mouse', 25, 15);
      INSERT INTO products VALUES (3, 'USB-C Cable', 8, 8);
      INSERT INTO products VALUES (4, 'Monitor Stand', 18, 5);
    `,
    referenceQuery: 'SELECT name, stock_quantity FROM products WHERE stock_quantity <= reorder_threshold ORDER BY stock_quantity ASC',
    difficulty: 'EASY',
    marks: 1.5,
  }
];

// ─── CORE CS THEORY QUESTION BANK ─────────────────────────────────────────────
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
    tags: ['operating systems', 'processes', 'scheduling', 'algorithms'],
    statement: 'Which preemptive CPU scheduling algorithm allocates fixed time slices (quanta) cyclically to each ready process?',
    canonicalAnswer: 'Round Robin',
    acceptedSynonyms: ['Round robin', 'RR', 'Round-Robin Scheduling'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-6',
    category: 'CORE_CS',
    topic: 'Networking',
    tags: ['networking', 'http', 'web', 'rest api'],
    statement: 'Which HTTP method is specifically intended to apply partial modifications to a resource rather than replacing it entirely?',
    canonicalAnswer: 'PATCH',
    acceptedSynonyms: ['patch', 'HTTP PATCH'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-7',
    category: 'CORE_CS',
    topic: 'OS',
    tags: ['operating systems', 'memory', 'virtual memory', 'difficult'],
    statement: 'What condition occurs when a system spends more time executing page swapping between RAM and disk than actual CPU execution?',
    canonicalAnswer: 'Thrashing',
    acceptedSynonyms: ['Page Thrashing', 'thrashing'],
    difficulty: 'HARD',
    marks: 1.0,
  },
  {
    id: 'core-cs-8',
    category: 'CORE_CS',
    topic: 'System Design',
    tags: ['system design', 'distributed systems', 'consistency', 'difficult'],
    statement: 'According to the CAP theorem, in the presence of a network partition (P), a distributed system must trade off between Availability (A) and which other property?',
    canonicalAnswer: 'Consistency',
    acceptedSynonyms: ['consistency', 'Data Consistency', 'Linearizability'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-9',
    category: 'CORE_CS',
    topic: 'DBMS',
    tags: ['dbms', 'indexing', 'b-tree', 'difficult'],
    statement: 'Which tree data structure with high branching factor is most commonly used in database engines (e.g. Postgres, MySQL) for primary and secondary indexing?',
    canonicalAnswer: 'B+ Tree',
    acceptedSynonyms: ['B-Tree', 'B Tree', 'B+ tree', 'BPlusTree', 'B+tree'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-10',
    category: 'CORE_CS',
    topic: 'Networking',
    tags: ['networking', 'dns', 'protocols'],
    statement: 'Which network protocol translates human-readable domain names (like hiresense.ai) into machine-routable IP addresses?',
    canonicalAnswer: 'DNS',
    acceptedSynonyms: ['Domain Name System', 'Domain Name Server', 'dns'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-11',
    category: 'CORE_CS',
    topic: 'React',
    tags: ['react', 'frontend', 'virtual-dom', 'intermediate', 'difficult'],
    statement: 'What is the algorithmic process by which React compares two Virtual DOM trees and calculates the minimal set of real DOM operations?',
    canonicalAnswer: 'Reconciliation',
    acceptedSynonyms: ['reconciliation', 'Virtual DOM Diffing', 'Diffing Algorithm', 'diffing'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-12',
    category: 'CORE_CS',
    topic: 'Node.js',
    tags: ['node.js', 'backend', 'async', 'event-loop', 'difficult'],
    statement: 'Which multi-platform C library provides the underlying event loop, asynchronous I/O, and worker thread pool for Node.js?',
    canonicalAnswer: 'libuv',
    acceptedSynonyms: ['Libuv', 'LIBUV', 'libuv library'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-13',
    category: 'CORE_CS',
    topic: 'Docker',
    tags: ['docker', 'devops', 'containers', 'linux', 'difficult'],
    statement: 'Which Linux kernel isolation feature does Docker rely on to give each container its own independent view of PID, network, and mount points?',
    canonicalAnswer: 'Namespaces',
    acceptedSynonyms: ['Linux Namespaces', 'namespaces', 'Linux namespaces'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-14',
    category: 'CORE_CS',
    topic: 'Python',
    tags: ['python', 'concurrency', 'gil', 'multithreading', 'difficult'],
    statement: 'What mechanism in CPython prevents multiple native threads from executing Python bytecodes concurrently on multi-core processors?',
    canonicalAnswer: 'GIL',
    acceptedSynonyms: ['Global Interpreter Lock', 'gil', 'Global interpreter lock'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-15',
    category: 'CORE_CS',
    topic: 'DBMS',
    tags: ['dbms', 'normalization', 'databases', 'difficult'],
    statement: 'Which relational database normal form specifically eliminates transitive functional dependencies of non-prime attributes on candidate keys?',
    canonicalAnswer: 'Third Normal Form',
    acceptedSynonyms: ['3NF', 'Third normal form', 'Third Normal Form (3NF)', '3nf'],
    difficulty: 'HARD',
    marks: 1.0,
  },
  {
    id: 'core-cs-16',
    category: 'CORE_CS',
    topic: 'Web',
    tags: ['http', 'web', 'rest api', 'protocols', 'basic', 'general'],
    statement: 'Which 3-digit HTTP status code indicates that a client must authenticate itself before accessing the requested resource?',
    canonicalAnswer: '401',
    acceptedSynonyms: ['401 Unauthorized', 'HTTP 401', '401 UNAUTHORIZED'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-17',
    category: 'CORE_CS',
    topic: 'Security',
    tags: ['security', 'web', 'vulnerabilities', 'basic', 'general'],
    statement: 'Which security vulnerability allows an attacker to inject malicious client-side scripts into web pages viewed by other users?',
    canonicalAnswer: 'XSS',
    acceptedSynonyms: ['Cross-Site Scripting', 'Cross Site Scripting', 'xss', 'Cross-site scripting'],
    difficulty: 'EASY',
    marks: 1.0,
  },
  {
    id: 'core-cs-18',
    category: 'CORE_CS',
    topic: 'System Design',
    tags: ['caching', 'system design', 'redis', 'patterns', 'intermediate'],
    statement: 'What standard caching pattern checks the cache first, loads from the database on a miss, and writes the missed entry back to cache before returning?',
    canonicalAnswer: 'Cache-Aside',
    acceptedSynonyms: ['Cache aside', 'Lazy Loading', 'Cache-aside pattern', 'cache-aside', 'lazy loading'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-19',
    category: 'CORE_CS',
    topic: 'JavaScript',
    tags: ['javascript', 'event-loop', 'async', 'promises', 'difficult'],
    statement: 'In the browser and Node.js event loop, do microtask queues (Promise callbacks) execute before or after macrotasks (such as setTimeout)?',
    canonicalAnswer: 'Before',
    acceptedSynonyms: ['before', 'BEFORE', 'Microtasks execute first', 'Prior'],
    difficulty: 'MEDIUM',
    marks: 1.0,
  },
  {
    id: 'core-cs-20',
    category: 'CORE_CS',
    topic: 'API Design',
    tags: ['rest', 'api', 'http', 'basic', 'general'],
    statement: 'What property describes an HTTP method (like GET or PUT) where making multiple identical requests has the exact same side-effects as making a single request?',
    canonicalAnswer: 'Idempotence',
    acceptedSynonyms: ['Idempotency', 'idempotent', 'Idempotent', 'idempotency'],
    difficulty: 'EASY',
    marks: 1.0,
  }
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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
                    (allText.match(/\bhibernate\b/g) || []).length;

  const pythonScore = (allText.match(/\bpython\b/g) || []).length * 2 +
                      (allText.match(/\bdjango\b/g) || []).length +
                      (allText.match(/\bfastapi\b/g) || []).length +
                      (allText.match(/\bpandas\b/g) || []).length;

  return javaScore > pythonScore ? 'java' : 'python';
}

/**
 * Intelligently select questions based on candidate resume skills,
 * balancing General (EASY) questions and Bit Difficult (MEDIUM/HARD) questions.
 */
function selectJdFilteredQuestions(jobDetails, coreTopics = [], seed = Date.now(), studentProfile = null) {
  const language = detectPreferredLanguage(studentProfile);

  // Collect candidate skill tags for targeted question matching
  const resumeKeywords = new Set(coreTopics.map(t => t.toLowerCase()));
  if (studentProfile?.skills) {
    studentProfile.skills.forEach(s => {
      const name = (typeof s === 'string' ? s : s.name || '').toLowerCase();
      if (name) resumeKeywords.add(name);
    });
  }

  // ── 1. DSA CODE QUESTIONS: 1 General (EASY) + 1 Bit Difficult (MEDIUM/HARD) ──
  const easyDsa = shuffleWithSeed(DSA_CODE_QUESTION_BANK.filter(q => q.difficulty === 'EASY'), seed);
  const medHardDsa = shuffleWithSeed(DSA_CODE_QUESTION_BANK.filter(q => q.difficulty !== 'EASY'), seed + 7);

  const pickedDsa = [
    easyDsa[0] || DSA_CODE_QUESTION_BANK[0],
    medHardDsa[0] || DSA_CODE_QUESTION_BANK[1]
  ].map(q => ({
    ...q,
    language,
    starterCode: language === 'java' ? q.starterCodeJava : q.starterCodePython,
    hiddenTestCases: undefined,
    _hiddenTestCases: q.hiddenTestCases,
  }));

  // ── 2. SQL QUESTIONS: 1 General (EASY) + 1 Medium + 1 Bit Difficult (Subquery/Join) ──
  const easySql = shuffleWithSeed(SQL_QUESTION_BANK.filter(q => q.difficulty === 'EASY'), seed + 13);
  const medSql = shuffleWithSeed(SQL_QUESTION_BANK.filter(q => q.difficulty === 'MEDIUM'), seed + 19);
  const hardSql = shuffleWithSeed(SQL_QUESTION_BANK.filter(q => q.difficulty === 'HARD'), seed + 23);

  const pickedSql = [
    easySql[0] || SQL_QUESTION_BANK[2],
    medSql[0] || SQL_QUESTION_BANK[0],
    (hardSql[0] || medSql[1] || SQL_QUESTION_BANK[1])
  ];

  // ── 3. CORE CS / ROLE-SPECIFIC QUESTIONS: 1 Foundational (EASY) + 1 Bit Difficult (MEDIUM/HARD) ──
  // Match candidate resume skills first
  const resumeMatchedCs = CORE_CS_QUESTION_BANK.filter(q => {
    const qTopic = (q.topic || '').toLowerCase();
    const qTags = (q.tags || []).map(t => t.toLowerCase());
    for (const kw of resumeKeywords) {
      if (qTopic.includes(kw) || qTags.some(t => t.includes(kw) || kw.includes(t))) return true;
    }
    return false;
  });

  const csEasyPool = shuffleWithSeed(
    (resumeMatchedCs.some(q => q.difficulty === 'EASY') ? resumeMatchedCs : CORE_CS_QUESTION_BANK)
      .filter(q => q.difficulty === 'EASY'),
    seed + 31
  );

  const csHardPool = shuffleWithSeed(
    (resumeMatchedCs.some(q => q.difficulty !== 'EASY') ? resumeMatchedCs : CORE_CS_QUESTION_BANK)
      .filter(q => q.difficulty !== 'EASY'),
    seed + 37
  );

  const pickedCoreCs = [
    csEasyPool[0] || CORE_CS_QUESTION_BANK[1],
    csHardPool[0] || CORE_CS_QUESTION_BANK[6]
  ];

  return {
    dsaQuestions: pickedDsa,
    sqlQuestions: pickedSql,
    coreCsQuestions: pickedCoreCs,
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
