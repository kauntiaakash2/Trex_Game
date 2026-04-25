import sqlite3
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "leaderboard.db"

app = Flask(__name__, static_folder=".")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                score INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


@app.get("/")
def root():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/api/leaderboard")
def get_leaderboard():
    limit = request.args.get("limit", default=10, type=int)
    limit = max(1, min(limit, 50))

    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT name, score, created_at
            FROM leaderboard
            ORDER BY score DESC, created_at ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return jsonify(
        {
            "entries": [
                {"name": row["name"], "score": row["score"], "created_at": row["created_at"]}
                for row in rows
            ]
        }
    )


@app.post("/api/leaderboard")
def post_score():
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    score = payload.get("score")

    if not name:
        return jsonify({"error": "name is required"}), 400
    if len(name) > 20:
        return jsonify({"error": "name must be <= 20 chars"}), 400

    try:
        score = int(score)
    except (TypeError, ValueError):
        return jsonify({"error": "score must be a number"}), 400

    if score < 1:
        return jsonify({"error": "score must be >= 1"}), 400

    with get_conn() as conn:
        conn.execute("INSERT INTO leaderboard(name, score) VALUES (?, ?)", (name, score))
        conn.commit()

    return jsonify({"ok": True}), 201


@app.get("/<path:path>")
def static_files(path: str):
    return send_from_directory(BASE_DIR, path)


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
