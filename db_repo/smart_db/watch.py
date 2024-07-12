import sys
import time
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler
import subprocess

class MyHandler(PatternMatchingEventHandler):
    def __init__(self, script):
        super().__init__(patterns=["*.py"])
        self.script = script
        self.process = self.start_process()
    
    def start_process(self):
        return subprocess.Popen(
            [sys.executable, self.script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=1,
            universal_newlines=True
        )

    def on_modified(self, event):
        self.process.terminate()
        self.process.wait()  # Wait for the process to terminate
        self.process = self.start_process()

    def print_output(self):
        for line in self.process.stdout:
            print(line, end='')
        for line in self.process.stderr:
            print(line, end='')

if __name__ == "__main__":
    script = "main.py"  # Replace with your main script file
    event_handler = MyHandler(script)
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=False)
    observer.start()
    try:
        while True:
            event_handler.print_output()
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
