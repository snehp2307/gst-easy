"""
Startup script — runs Alembic migrations then starts uvicorn.
Used in Docker/Railway/Render deployments.
"""
import subprocess
import sys
import os


def main():
    port = os.environ.get("PORT", "8000")

    # Run Alembic migrations
    print("🔄 Running database migrations...")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"⚠️ Migration warning: {result.stderr}")
    else:
        print("✅ Migrations complete")

    # Start uvicorn
    print(f"🚀 Starting server on port {port}...")
    os.execvp(
        "uvicorn",
        ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", port, "--workers", "2"],
    )


if __name__ == "__main__":
    main()
