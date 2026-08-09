import logging
from contextlib import asynccontextmanager
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mad_app.config import settings
from mad_app.routers import auth, questionnaire, chatrooms, sobriety, sos, tasks
from mad_app.sockets.chat_namespace import ChatNamespace
from mad_app.services.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# 1. Create Socket.IO Server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False
)

# Register Chat Namespace
chat_ns = ChatNamespace("/")
sio.register_namespace(chat_ns)

# 2. FastAPI Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up MAD backend application...")
    start_scheduler(sio=sio)
    yield
    logger.info("Shutting down MAD backend application...")
    stop_scheduler()

# 3. Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MAD — Anonymous Addiction Support Application API",
    version="1.0.0",
    lifespan=lifespan
)
app.state.sio = sio

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(questionnaire.router)
app.include_router(chatrooms.router)
app.include_router(sobriety.router)
app.include_router(sos.router)
app.include_router(tasks.router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

# 4. Wrap with Socket.IO ASGI App
socket_app = socketio.ASGIApp(sio, app)
