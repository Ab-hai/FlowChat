import json
import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from groq import AsyncGroq
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="FlowChat API", version="0.1.0")

frontend_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_URL", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "flowchat-api", "version": app.version}


GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = (
    "You are FlowChat, a warm and encouraging English conversation partner for "
    "people practicing spoken English. Keep the conversation flowing naturally: "
    "react to what the user says and ask one friendly follow-up question. Use "
    "everyday, natural English and keep your replies short (2-4 sentences). Do "
    "not correct the user's grammar or spelling during the chat; the goal is to "
    "help them speak freely and build confidence."
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@app.post("/chat")
async def chat(req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    client = AsyncGroq(api_key=api_key)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + [
        m.model_dump() for m in req.messages
    ]

    async def token_stream():
        stream = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            stream=True,
            temperature=0.8,
        )
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    return StreamingResponse(token_stream(), media_type="text/plain; charset=utf-8")


class Phrasing(BaseModel):
    original: str
    suggestion: str


class Debrief(BaseModel):
    clarity_score: int = 0
    summary: str = ""
    overused_words: list[str] = []
    better_phrasings: list[Phrasing] = []
    focus_area: str = ""


DEBRIEF_PROMPT = (
    "You are a supportive English-speaking coach reviewing a practice "
    "conversation. Analyze ONLY the user's messages; ignore the assistant's. "
    "Reply with a JSON object using exactly these keys: "
    '"clarity_score" (integer 0-100 for how clear and natural the user sounded), '
    '"summary" (1-2 encouraging sentences), '
    '"overused_words" (array of up to 5 genuine filler or crutch words the user '
    'leaned on, like "um", "like", "basically", "actually", "you know"; never '
    'include normal words such as pronouns, articles, prepositions, or common '
    'verbs like "is", "have", or "go"; empty array if there are none), '
    '"better_phrasings" (array of up to 4 objects with "original" and "suggestion"), '
    'and "focus_area" (one specific, actionable thing to practice next). '
    "Be concrete and kind. Output only the JSON object."
)


@app.post("/debrief")
async def debrief(req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    client = AsyncGroq(api_key=api_key)
    transcript = "\n".join(f"{m.role}: {m.content}" for m in req.messages)

    completion = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": DEBRIEF_PROMPT},
            {"role": "user", "content": f"Conversation:\n\n{transcript}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    try:
        return Debrief(**json.loads(completion.choices[0].message.content))
    except Exception:
        raise HTTPException(status_code=502, detail="Could not parse feedback")


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    client = AsyncGroq(api_key=api_key)
    data = await audio.read()

    result = await client.audio.transcriptions.create(
        model="whisper-large-v3-turbo",
        file=(audio.filename or "audio.webm", data),
    )
    return {"text": result.text}
