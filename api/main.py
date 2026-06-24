import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
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
