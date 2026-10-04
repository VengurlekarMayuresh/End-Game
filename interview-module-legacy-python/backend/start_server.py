import subprocess
import sys

proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd=r"M:\Neha\Desktop\End Game\interview-module\backend",
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
)

print(f"Server PID: {proc.pid}")
print("Backend starting... Check backend.log for output")