from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from models.severity_scorer import scorer
from optimization.resource_allocator import allocator

app = FastAPI(title="Relief|OS Python Engine")

class ZoneData(BaseModel):
    id: str
    magnitude: float = 5.0
    population_density: float = 500.0
    infrastructure_vulnerability: float = 0.5
    type: str = "other"

class ResourceData(BaseModel):
    id: str
    quantity: int
    type: str
    location: str

class OptimizationRequest(BaseModel):
    resources: List[ResourceData]
    zones: List[Dict[str, Any]] # Expects dicts with 'id', 'demand', 'severity_score', 'type'

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Relief|OS Python Engine"}

@app.post("/api/ml/severity")
def calculate_severity(zones: List[ZoneData]):
    try:
        zone_dicts = [z.model_dump() for z in zones]
        results = scorer.process_batch(zone_dicts)
        return {"data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/allocate")
def allocate_resources(request: OptimizationRequest):
    try:
        res_dicts = [r.model_dump() for r in request.resources]
        allocation_results = allocator.optimize_allocation(res_dicts, request.zones)
        return {"data": allocation_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
