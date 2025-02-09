from pydantic import BaseModel
from typing import List

# Models for /process_findings endpoint
class Finding(BaseModel):
    """Individual finding data within a batch."""
    finding_id: str
    description: str
    severity: str
    recommendation: str
    code_reference: str

class FindingsInput(BaseModel):
    """Request model for POST /process_findings."""
    project_id: str
    reported_by_agent: str = "api_user"
    findings: List[Finding]

class ProcessingResult(BaseModel):
    """Response model for POST /process_findings."""
    unique: int
    duplicated: int
    disputed: int

# Models for /statistics endpoint
class AgentStats(BaseModel):
    """Response model for GET /statistics."""
    project_id: str
    agent_id: str
    unique_count: int
    duplicated_count: int
    disputed_count: int 