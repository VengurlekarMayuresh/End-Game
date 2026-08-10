const { runCode } = require('./codeExecutor');

async function runTests() {
  console.log('--- Testing Python Python Success ---');
  const pythonSuccess = await runCode('PYTHON', 'print("Hello World")\nx = int(input())\nprint("Input was:", x)', '42');
  console.log(pythonSuccess);

  console.log('\n--- Testing Python Division by Zero (Runtime Error) ---');
  const pythonDivZero = await runCode('PYTHON', 'x = 1 / 0');
  console.log(pythonDivZero);

  console.log('\n--- Testing Python Infinite Loop (Timeout) ---');
  const pythonTimeout = await runCode('PYTHON', 'import time\nwhile True:\n    time.sleep(0.1)', '', 2000);
  console.log(pythonTimeout);

  console.log('\n--- Testing Java Success ---');
  const javaCode = `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java");
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            System.out.println("Value: " + sc.nextInt());
        }
    }
}
`;
  const javaSuccess = await runCode('JAVA', javaCode, '100');
  console.log(javaSuccess);

  console.log('\n--- Testing Java Compilation Error ---');
  const javaCompError = await runCode('JAVA', 'public class Main { syntax error }');
  console.log(javaCompError);

  console.log('\n--- Testing Java Runtime Error ---');
  const javaRunError = `
public class Main {
    public static void main(String[] args) {
        int x = 10 / 0;
    }
}
`;
  const javaRuntime = await runCode('JAVA', javaRunError);
  console.log(javaRuntime);
}

runTests();
