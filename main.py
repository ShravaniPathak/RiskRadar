# import logging
# from app.workflows.analysis_workflow import start_analysis

# logging.basicConfig(level=logging.WARNING)

# result = start_analysis(
#     "AAPL"
# )
# print(result)

# from app.utils.fetch import fetch_filing
# from app.utils.preprocessing import prepare_chunks_with_metadata
# 
# filing1 = fetch_filing("AAPL", 2024)
# filing2 = fetch_filing("AAPL", 2025)
# result = prepare_chunks_with_metadata([filing1.value, filing2.value])
# print(result)








# import logging
# from app.workflows.disappearing_risks import dr_analysis
# 
# logging.basicConfig(level=logging.WARNING)
# 
# result = dr_analysis("AAPL", 2025)
# # print(result)
# # print(result)









from pydantic import BaseModel

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.workflows.disappearing_risks import dr_analysis
from app.workflows.emerging_analysis import er_analysis
from app.workflows.missing_with_drop_vs_others import missing_with_drop_vs_others_anlaysis
from app.workflows.emerging_vs_others_growth import emerging_vs_others_growth_analysis

app = FastAPI(title="SEC Analysis API")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    ticker: str
    year: int

@app.post("/analyze")
async def trigger_analysis(request: AnalysisRequest):
    try:
        result = dr_analysis(request.ticker, request.year)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalysisRequestEmerging(BaseModel):
    ticker: str
    year1: int
    year2: int

@app.post("/analyze/emerging")
async def trigger_analysis_emerging(request: AnalysisRequestEmerging):
    try:
        result = er_analysis(request.ticker, request.year1, request.year2)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/missing_with_drop_vs_others")
async def trigger_analysis_missing_with_drop_vs_others(request: AnalysisRequest):
    try:
        result = missing_with_drop_vs_others_anlaysis(request.ticker, request.year)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/emerging_vs_others_growth")
async def trigger_analysis_emerging_vs_others_growth_anaysis(request: AnalysisRequest):
    try:
        result = emerging_vs_others_growth_analysis(request.ticker, request.year)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "online"}
