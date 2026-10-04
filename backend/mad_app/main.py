import logging
from contextlib import asynccontextmanager
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mad_app.config import settings
from mad_app.routers import auth, questionnaire, chatrooms, sobriety, sos, tasks, journal, reports, ifthen
from mad_app.sockets.chat_namespace import ChatNamespace
from mad_app.services.scheduler import start_scheduler, stop_scheduler
from mad_app.db.session import engine
from mad_app.db.models import Base
from mad_app.services.network import log_startup_lan_banner, get_lan_ip_addresses

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
    logger.info("Starting up RebootMind backend application...")
    log_startup_lan_banner()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from mad_app.db.models import DailyTask
        from mad_app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            t_res = await session.execute(select(DailyTask).limit(1))
            if not t_res.scalars().first():
                logger.info("Fresh database detected. Auto-seeding initial recovery tasks and peer circles...")
                from seed import seed_data
                await seed_data()
    except Exception as e:
        logger.error(f"Auto-seed check error: {e}")
    start_scheduler(sio=sio)
    yield
    logger.info("Shutting down RebootMind backend application...")
    stop_scheduler()

# 3. Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RebootMind - Anonymous Addiction Support Application API",
    version=settings.VERSION,
    lifespan=lifespan
)
app.state.sio = sio

# CORS - Allow local web dev, mobile webviews (Capacitor/Ionic), and LAN clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "capacitor://localhost",
        "ionic://localhost",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+)(:\d+)?$",
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
app.include_router(journal.router)
app.include_router(reports.router)
app.include_router(ifthen.router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}

@app.get("/api/connect-info")
async def connect_info():
    ips = get_lan_ip_addresses()
    port = settings.BACKEND_PORT
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "primary_url": f"http://{ips[0]}:{port}" if ips else f"http://localhost:{port}",
        "lan_urls": [f"http://{ip}:{port}" for ip in ips],
    }

@app.api_route("/api/seed", methods=["GET", "POST"])
async def trigger_seed():
    try:
        from seed import seed_data
        await seed_data()
        return {"status": "ok", "message": "Database successfully populated with demo circles and tasks"}
    except Exception as e:
        logger.error(f"Manual seed error: {e}", exc_info=True)
        return {"status": "error", "detail": str(e)}

# 4. Wrap with Socket.IO ASGI App
socket_app = socketio.ASGIApp(sio, app)

