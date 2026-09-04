const { spawn } = require('child_process');

/**
 * Execute student SQL query against a hidden SQLite in-memory database initialized with referenceSchemaSql.
 * Compares candidate query output rows with reference query output rows.
 * @param {string} studentQuery - The SQL query submitted by the candidate
 * @param {string} referenceSchemaSql - DDL / DML to setup hidden reference tables and sample data
 * @param {string} referenceQuery - Ground truth SQL query to compare against
 * @returns {Promise<Object>} { success, isCorrect, actualOutput, expectedOutput, error }
 */
function executeSqlInSandbox(studentQuery, referenceSchemaSql, referenceQuery) {
  return new Promise((resolve) => {
    if (!studentQuery || typeof studentQuery !== 'string' || !studentQuery.trim()) {
      return resolve({
        success: false,
        isCorrect: false,
        error: 'Empty SQL query submitted.',
        actualOutput: [],
        expectedOutput: []
      });
    }

    // Escape quotes and backslashes for python script string injection safely
    const cleanSchema = (referenceSchemaSql || '').replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
    const cleanStudent = studentQuery.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
    const cleanRef = (referenceQuery || '').replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');

    const pyScript = `
import sqlite3, json, sys

schema = """${cleanSchema}"""
student_q = """${cleanStudent}"""
ref_q = """${cleanRef}"""

try:
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    if schema.strip():
        cursor.executescript(schema)
    
    # Run candidate query
    cursor.execute(student_q)
    student_rows = [list(r) for r in cursor.fetchall()]
    
    ref_rows = []
    if ref_q.strip():
        cursor.execute(ref_q)
        ref_rows = [list(r) for r in cursor.fetchall()]
        
    # Compare result sets (checking exact rows or sorted rows)
    is_correct = False
    if ref_q.strip():
        # Normalizing string representations of floats/ints/strings
        def norm_val(v):
            if isinstance(v, float):
                return round(v, 2)
            return v
        
        norm_student = [[norm_val(x) for x in row] for row in student_rows]
        norm_ref = [[norm_val(x) for x in row] for row in ref_rows]
        
        is_correct = (norm_student == norm_ref)
        if not is_correct:
            try:
                is_correct = (sorted(norm_student) == sorted(norm_ref))
            except Exception:
                pass
    else:
        is_correct = len(student_rows) > 0
        
    print(json.dumps({
        "success": True,
        "isCorrect": is_correct,
        "actualOutput": student_rows,
        "expectedOutput": ref_rows,
        "rowCount": len(student_rows)
    }))
except Exception as e:
    print(json.dumps({
        "success": False,
        "isCorrect": False,
        "error": str(e),
        "actualOutput": [],
        "expectedOutput": []
    }))
`;

    const py = spawn('python', ['-c', pyScript]);
    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (d) => { stdout += d.toString(); });
    py.stderr.on('data', (d) => { stderr += d.toString(); });

    py.on('close', () => {
      try {
        const res = JSON.parse(stdout);
        resolve(res);
      } catch (err) {
        resolve({
          success: false,
          isCorrect: false,
          error: stderr || err.message || 'Failed to execute SQL in sandbox',
          actualOutput: [],
          expectedOutput: []
        });
      }
    });

    py.on('error', (err) => {
      resolve({
        success: false,
        isCorrect: false,
        error: `Sandbox execution error: ${err.message}`,
        actualOutput: [],
        expectedOutput: []
      });
    });
  });
}

module.exports = {
  executeSqlInSandbox
};
