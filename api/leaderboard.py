import json
import os
import time
import uuid
from urllib import error, parse, request
from http.server import BaseHTTPRequestHandler

KV_URL = os.getenv("KV_REST_API_URL")
KV_TOKEN = os.getenv("KV_REST_API_TOKEN")
LEADERBOARD_KEY = os.getenv("LEADERBOARD_KEY", "trex:leaderboard")


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)


def _kv_call(command: list[str]):
    if not KV_URL or not KV_TOKEN:
        raise RuntimeError("KV_REST_API_URL / KV_REST_API_TOKEN not configured")

    encoded = "/".join(parse.quote(str(part), safe="") for part in command)
    url = f"{KV_URL}/{encoded}"
    req = request.Request(url, headers={"Authorization": f"Bearer {KV_TOKEN}"})

    try:
        with request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("error"):
                raise RuntimeError(data["error"])
            return data.get("result")
    except error.HTTPError as exc:
        raise RuntimeError(f"KV request failed ({exc.code})") from exc


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        _json_response(self, 200, {"ok": True})

    def do_GET(self):
        if not self.path.startswith("/api/leaderboard"):
            _json_response(self, 404, {"error": "not found"})
            return

        query = parse.urlparse(self.path).query
        params = parse.parse_qs(query)
        try:
            limit = int(params.get("limit", [10])[0])
        except ValueError:
            limit = 10
        limit = max(1, min(limit, 50))

        try:
            raw_entries = _kv_call(["ZREVRANGE", LEADERBOARD_KEY, 0, limit - 1])
        except RuntimeError as exc:
            _json_response(self, 500, {"error": str(exc)})
            return

        entries = []
        for item in raw_entries or []:
            try:
                entries.append(json.loads(item))
            except json.JSONDecodeError:
                continue

        _json_response(self, 200, {"entries": entries})

    def do_POST(self):
        if not self.path.startswith("/api/leaderboard"):
            _json_response(self, 404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"

        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            _json_response(self, 400, {"error": "invalid json"})
            return

        name = str(payload.get("name", "")).strip()
        score = payload.get("score")

        if not name:
            _json_response(self, 400, {"error": "name is required"})
            return
        if len(name) > 20:
            _json_response(self, 400, {"error": "name must be <= 20 chars"})
            return

        try:
            score = int(score)
        except (TypeError, ValueError):
            _json_response(self, 400, {"error": "score must be a number"})
            return
        if score < 1:
            _json_response(self, 400, {"error": "score must be >= 1"})
            return

        entry = {
            "id": uuid.uuid4().hex,
            "name": name,
            "score": score,
            "created_at": int(time.time() * 1000),
        }

        try:
            _kv_call(["ZADD", LEADERBOARD_KEY, score, json.dumps(entry, separators=(",", ":"))])
        except RuntimeError as exc:
            _json_response(self, 500, {"error": str(exc)})
            return

        _json_response(self, 201, {"ok": True, "entry": entry})
