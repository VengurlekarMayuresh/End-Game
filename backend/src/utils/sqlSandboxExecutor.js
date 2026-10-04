let DatabaseSync;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  DatabaseSync = null;
}
const { spawn } = require('child_process');

/**
 * Execute student SQL query against a hidden SQLite in-memory database initialized with referenceSchemaSql.
 * Uses Node's built-in SQLite engine (node:sqlite) for instant in-process execution with python fallback.
 * @param {string} studentQuery - The SQL query submitted by the candidate
 * @param {string} referenceSchemaSql - DDL / DML to setup hidden reference tables and sample data
 * @param {string} referenceQuery - Ground truth SQL query to compare against
 * @returns {Promise<Object>} { success, isCorrect, actualOutput, expectedOutput, error, rowCount }
 */
function executeSqlInSandbox(studentQuery, referenceSchemaSql, referenceQuery) {
  if (!studentQuery || typeof studentQuery !== 'string' || !studentQuery.trim()) {
    return Promise.resolve({
      success: false,
      isCorrect: false,
      error: 'Empty SQL query submitted.',
      actualOutput: [],
      expectedOutput: [],
      rowCount: 0
    });
  }

  // Primary execution: Node.js built-in SQLite (instant, zero process overhead)
  if (DatabaseSync) {
    try {
      const db = new DatabaseSync(':memory:');
      if (referenceSchemaSql && referenceSchemaSql.trim()) {
        db.exec(referenceSchemaSql);
      }
      
      const cleanStudentQ = studentQuery.trim().replace(/;+$/, '');
      const studentRows = db.prepare(cleanStudentQ).all();

      let refRows = [];
      if (referenceQuery && referenceQuery.trim()) {
        const cleanRefQ = referenceQuery.trim().replace(/;+$/, '');
        refRows = db.prepare(cleanRefQ).all();
      }

      const normRow = (r) => {
        const obj = {};
        for (const k of Object.keys(r)) {
          const v = r[k];
          obj[k.toLowerCase()] = typeof v === 'number' ? Math.round(v * 100) / 100 : v;
        }
        return obj;
      };

      const normStudent = studentRows.map(normRow);
      const normRef = refRows.map(normRow);

      let isCorrect = JSON.stringify(normStudent) === JSON.stringify(normRef);
      if (!isCorrect && normStudent.length === normRef.length && normRef.length > 0) {
        const s1 = [...normStudent].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        const s2 = [...normRef].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        isCorrect = JSON.stringify(s1) === JSON.stringify(s2);
      } else if (!referenceQuery || !referenceQuery.trim()) {
        isCorrect = studentRows.length > 0;
      }

      return Promise.resolve({
        success: true,
        isCorrect,
        actualOutput: studentRows,
        expectedOutput: refRows,
        rowCount: studentRows.length
      });
    } catch (err) {
      return Promise.resolve({
        success: false,
        isCorrect: false,
        error: err.message,
        actualOutput: [],
        expectedOutput: [],
        rowCount: 0
      });
    }
  }

  // Fallback: Python sqlite3
  return new Promise((resolve) => {
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
    cursor.execute(student_q)
    student_rows = [list(r) for r in cursor.fetchall()]
    ref_rows = []
    if ref_q.strip():
        cursor.execute(ref_q)
        ref_rows = [list(r) for r in cursor.fetchall()]
    is_correct = False
    if ref_q.strip():
        def norm_val(v): return round(v, 2) if isinstance(v, float) else v
        norm_student = [[norm_val(x) for x in row] for row in student_rows]
        norm_ref = [[norm_val(x) for x in row] for row in ref_rows]
        is_correct = (norm_student == norm_ref)
        if not is_correct and len(norm_student) == len(norm_ref):
            try: is_correct = (sorted(norm_student) == sorted(norm_ref))
            except Exception: pass
    else: is_correct = len(student_rows) > 0
    print(json.dumps({"success": True, "isCorrect": is_correct, "actualOutput": student_rows, "expectedOutput": ref_rows, "rowCount": len(student_rows)}))
except Exception as e:
    print(json.dumps({"success": False, "isCorrect": False, "error": str(e), "actualOutput": [], "expectedOutput": [], "rowCount": 0}))
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
          error: stderr || err.message || 'Failed to execute SQL',
          actualOutput: [],
          expectedOutput: [],
          rowCount: 0
        });
      }
    });

    py.on('error', (err) => {
      resolve({
        success: false,
        isCorrect: false,
        error: `Sandbox error: ${err.message}`,
        actualOutput: [],
        expectedOutput: [],
        rowCount: 0
      });
    });
  });
}

module.exports = {
  executeSqlInSandbox
};
