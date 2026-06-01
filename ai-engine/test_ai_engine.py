import urllib.request
import sys


def check(url: str = "http://127.0.0.1:8000/health") -> int:
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            body = r.read().decode("utf-8")
            print("OK:", body)
            return 0
    except Exception as e:
        print("ERROR:", e)
        return 1


if __name__ == "__main__":
    sys.exit(check())
