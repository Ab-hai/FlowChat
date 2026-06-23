# FlowChat API (FastAPI)

Real-time chat/voice + debrief service for FlowChat.

## Run locally (Windows / PowerShell)

```powershell
cd flowchat/apps/api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # then fill in the values
uvicorn main:app --reload --port 8000
```

Health check: http://localhost:8000/health → `{"status":"ok",...}`

## Structure (filled in over Days 2–4)

```
main.py            # app + CORS + /health
routers/
  chat.py          # POST /chat (SSE streaming)        — Day 2
  voice.py         # WebSocket /ws/voice               — Day 4
  sessions.py      # GET/POST /sessions                — Day 2/3
  debrief.py       # POST /debrief                      — Day 3
services/
  llm.py           # Groq client + prompt builder
  whisper.py       # OpenAI Whisper STT
  analysis.py      # debrief JSON generation
models.py          # Pydantic request/response models
```
