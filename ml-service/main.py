from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import difficulty, feedback, gaps, adaptive, insights

app = FastAPI(
    title="SmartAssign ML Service",
    description="ML microservice for question difficulty classification, gap detection, and adaptive feedback",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(difficulty.router)
app.include_router(feedback.router)
app.include_router(gaps.router)
app.include_router(adaptive.router)
app.include_router(insights.router)

@app.get("/")
def root():
    return {"service": "SmartAssign ML", "status": "running", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
