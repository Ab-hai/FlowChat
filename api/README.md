# FlowChat — API (FastAPI)

Stateless AI service for FlowChat: chat completions, session debriefs, transcription, and pronunciation scoring. See the [root README](../../README.md) for the full project overview.

## Run locally

```bash
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # fill in GROQ_API_KEY and GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

Health check: <http://localhost:8000/health> → `{"status":"ok",...}`

## Endpoints

| Method | Route | Model | Description |
|--------|-------|-------|-------------|
| `GET`  | `/health` | — | Liveness check |
| `POST` | `/chat` | Groq `llama-3.3-70b-versatile` | Stream a chat reply from message history |
| `POST` | `/debrief` | Groq `llama-3.3-70b-versatile` | Structured session feedback (JSON) |
| `POST` | `/transcribe` | Groq `whisper-large-v3-turbo` | Speech-to-text |
| `POST` | `/pronounce` | Google `gemini-2.0-flash` | Accuracy / fluency / prosody scoring |

## Environment

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Chat responses + Whisper transcription |
| `GEMINI_API_KEY` | Voice pronunciation feedback |
| `FRONTEND_URL` | Comma-separated allowed CORS origins |

Everything lives in a single [`main.py`](main.py).
