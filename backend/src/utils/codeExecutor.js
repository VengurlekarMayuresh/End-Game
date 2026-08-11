const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const killProcess = (child) => {
  try {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${child.pid} /f /t`, () => {});
    } else {
      child.kill('SIGKILL');
    }
  } catch (err) {
    console.error('Failed to kill process:', err);
  }
};

const executePython = (code, input, timeoutMs = 5000) => {
  return new Promise((resolve) => {
    const runId = crypto.randomUUID();
    const runDir = path.join(TEMP_DIR, `run_${runId}`);
    fs.mkdirSync(runDir, { recursive: true });
    
    const filePath = path.join(runDir, 'solution.py');
    fs.writeFileSync(filePath, code);

    const startTime = process.hrtime();
    const child = spawn('python', [filePath], { cwd: runDir });
    
    let stdout = '';
    let stderr = '';
    let isTimeout = false;

    const timer = setTimeout(() => {
      isTimeout = true;
      killProcess(child);
    }, timeoutMs);

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const endTime = process.hrtime(startTime);
      const executionTime = endTime[0] + endTime[1] / 1e9; // in seconds

      // Clean up files
      try {
        fs.rmSync(runDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Failed to delete temp dir:', err);
      }

      if (isTimeout) {
        return resolve({
          success: false,
          status: 'TIME_LIMIT_EXCEEDED',
          error: `Time Limit Exceeded (Timeout of ${timeoutMs / 1000}s)`,
          executionTime,
        });
      }

      if (code !== 0) {
        return resolve({
          success: false,
          status: 'RUNTIME_ERROR',
          error: stderr || `Runtime error: process exited with code ${code}`,
          executionTime,
        });
      }

      resolve({
        success: true,
        status: 'SUCCESS',
        output: stdout,
        executionTime,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      try {
        fs.rmSync(runDir, { recursive: true, force: true });
      } catch (e) {}

      resolve({
        success: false,
        status: 'COMPILATION_FAILED', // if python is not installed, or command fails
        error: `Failed to spawn Python process: ${err.message}`,
        executionTime: 0,
      });
    });
  });
};

const executeJava = (code, input, timeoutMs = 10000) => {
  return new Promise((resolve) => {
    const runId = crypto.randomUUID();
    const runDir = path.join(TEMP_DIR, `run_${runId}`);
    fs.mkdirSync(runDir, { recursive: true });

    // Write Main.java
    const filePath = path.join(runDir, 'Main.java');
    fs.writeFileSync(filePath, code);

    // Compilation step
    const javac = spawn('javac', ['Main.java'], { cwd: runDir });
    let compileStderr = '';

    javac.stderr.on('data', (data) => {
      compileStderr += data.toString();
    });

    javac.on('close', (compileCode) => {
      if (compileCode !== 0) {
        // Compile failed
        try {
          fs.rmSync(runDir, { recursive: true, force: true });
        } catch (e) {}
        
        return resolve({
          success: false,
          status: 'COMPILATION_FAILED',
          error: compileStderr || 'Compilation failed',
          executionTime: 0,
        });
      }

      // Execution step
      const startTime = process.hrtime();
      const child = spawn('java', ['Main'], { cwd: runDir });
      
      let stdout = '';
      let stderr = '';
      let isTimeout = false;

      const timer = setTimeout(() => {
        isTimeout = true;
        killProcess(child);
      }, timeoutMs);

      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      } else {
        child.stdin.end();
      }

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const endTime = process.hrtime(startTime);
        const executionTime = endTime[0] + endTime[1] / 1e9; // in seconds

        try {
          fs.rmSync(runDir, { recursive: true, force: true });
        } catch (err) {}

        if (isTimeout) {
          return resolve({
            success: false,
            status: 'TIME_LIMIT_EXCEEDED',
            error: `Time Limit Exceeded (Timeout of ${timeoutMs / 1000}s)`,
            executionTime,
          });
        }

        if (code !== 0) {
          return resolve({
            success: false,
            status: 'RUNTIME_ERROR',
            error: stderr || `Runtime error: process exited with code ${code}`,
            executionTime,
          });
        }

        resolve({
          success: true,
          status: 'SUCCESS',
          output: stdout,
          executionTime,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        try {
          fs.rmSync(runDir, { recursive: true, force: true });
        } catch (e) {}
        resolve({
          success: false,
          status: 'RUNTIME_ERROR',
          error: `Failed to execute Java program: ${err.message}`,
          executionTime: 0,
        });
      });
    });

    javac.on('error', (err) => {
      try {
        fs.rmSync(runDir, { recursive: true, force: true });
      } catch (e) {}
      resolve({
        success: false,
        status: 'COMPILATION_FAILED',
        error: `Failed to spawn javac: ${err.message}`,
        executionTime: 0,
      });
    });
  });
};

const runCode = async (language, code, input = '', timeoutMs) => {
  const normalizedLang = language.trim().toUpperCase();
  if (normalizedLang === 'PYTHON') {
    return executePython(code, input, timeoutMs || 5000);
  } else if (normalizedLang === 'JAVA') {
    return executeJava(code, input, timeoutMs || 10000);
  } else {
    return {
      success: false,
      status: 'RUNTIME_ERROR',
      error: `Unsupported language: ${language}`,
      executionTime: 0,
    };
  }
};

module.exports = {
  runCode,
};
