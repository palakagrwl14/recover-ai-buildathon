from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers.batch import router as batch_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    init_db()
    yield
    # Shutdown logic if any
    pass


app = FastAPI(
    title="RecoverAI Payment Recovery Backend API",
    description="Autonomous Payment Failure Recovery & Audit Trail Engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend React / Vite integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(batch_router)


@app.get("/")
def read_root():
    return {
        "app": "RecoverAI Payment Recovery API",
        "status": "online",
        "docs": "/docs",
    }
