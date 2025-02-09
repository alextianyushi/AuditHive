from fastapi import APIRouter, HTTPException
from app.models import FindingsInput, ProcessingResult, AgentStats
from app.database import get_project_table, get_db_connection, DatabaseError
from app.deduplication import check_duplicates
from app.evaluation import evaluate_findings
from app.chat import ArbiterChat
from pydantic import BaseModel, Field
from sqlalchemy import select, text, func
from app.logger import setup_logging
from typing import List

# Set up logging
logger = setup_logging()

# Create router with prefix /api
router = APIRouter(
    prefix="/api",
    tags=["findings"]
)

# Add chat handler
chat_handler = ArbiterChat()

# Define chat request and response models
class ChatQuery(BaseModel):
    text: str = Field(..., min_length=1, description="The question or query text")

class ChatQueryResponse(BaseModel):
    question: str = Field(..., description="The original question")
    response: str = Field(..., description="The AI generated response")

@router.post("/chat", response_model=ChatQueryResponse)
async def chat(request: ChatQuery) -> ChatQueryResponse:
    """
    Chat endpoint that handles queries about Arbiter and AuditHive.
    
    Args:
        request: ChatQuery containing the text string
        
    Returns:
        ChatQueryResponse: Contains the question and response
    """
    try:
        # Log the entire request for debugging
        logger.info(f"Received chat request: {request.dict()}")
        
        # Simple validation
        if not request.text:
            logger.error("Empty text received")
            raise HTTPException(status_code=400, detail="Text cannot be empty")
            
        # Process the chat request
        logger.info(f"Processing chat request with text: {request.text}")
        response = await chat_handler.chat(request.text)
        
        if not response:
            logger.error("Empty response received from chat handler")
            raise HTTPException(status_code=500, detail="Failed to generate response")
            
        logger.info(f"Generated response: {response}")
        return ChatQueryResponse(question=request.text, response=response)
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/statistics", response_model=List[AgentStats])
async def get_statistics() -> List[AgentStats]:
    """
    Get global statistics for all projects and agents.
    Returns a list of statistics for each project-agent combination:
    - Total unique findings
    - Total duplicated findings
    - Total disputed findings
    
    Returns:
        List[AgentStats]: List of statistics for each project-agent combination
    """
    try:
        with get_db_connection() as connection:
            try:
                # Get all project tables
                tables = connection.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'findings_%'")
                ).fetchall()
                
                logger.info(f"Found tables: {tables}")
                
                stats = []
                for (table_name,) in tables:
                    project_id = table_name.replace('findings_', '')
                    project_table = get_project_table(project_id)
                    
                    # Get statistics for each agent
                    agent_results = connection.execute(
                        select(
                            project_table.c.reported_by_agent,
                            func.count(project_table.c.id).filter(project_table.c.status == 'unique').label('unique_count'),
                            func.count(project_table.c.id).filter(project_table.c.status == 'duplicated').label('duplicated_count'),
                            func.count(project_table.c.id).filter(project_table.c.status == 'disputed').label('disputed_count')
                        ).group_by(project_table.c.reported_by_agent)
                    ).fetchall()
                    
                    logger.info(f"Stats for {project_id}: {agent_results}")
                    
                    for result in agent_results:
                        stats.append(AgentStats(
                            project_id=project_id,
                            agent_id=result.reported_by_agent,
                            unique_count=result.unique_count,
                            duplicated_count=result.duplicated_count,
                            disputed_count=result.disputed_count
                        ))
                
                return stats
                
            except Exception as e:
                logger.error(f"Error getting statistics: {str(e)}")
                raise DatabaseError(f"Operation failed: {str(e)}")
                
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process_findings", response_model=ProcessingResult)
async def process_findings(input_data: FindingsInput) -> ProcessingResult:
    """
    Process security findings:
    1. Store findings in database
    2. Perform deduplication
    3. Evaluate finding quality
    
    Args:
        input_data: Contains project_id, reported_by_agent and list of findings
        
    Returns:
        ProcessingResult: Contains counts of unique, duplicated and disputed findings
    """
    try:
        project_id = input_data.project_id
        logger.info(f"Processing new findings batch with project_id: {project_id}")
        
        project_table = get_project_table(project_id)
        current_batch_ids = []
        
        with get_db_connection() as connection:
            try:
                # Store findings
                for finding in input_data.findings:
                    insert_stmt = project_table.insert().values(
                        reported_by_agent=input_data.reported_by_agent,
                        finding_id=finding.finding_id,
                        description=finding.description,
                        severity=finding.severity,
                        recommendation=finding.recommendation,
                        code_reference=finding.code_reference,
                        status='pending'
                    )
                    result = connection.execute(insert_stmt)
                    current_batch_ids.append(result.inserted_primary_key[0])
                
                connection.commit()
                
                # Deduplication and evaluation
                check_duplicates(project_id, current_batch_ids)
                evaluate_findings(project_id, current_batch_ids)
                
                # Get results
                result = connection.execute(
                    select(project_table).where(
                        project_table.c.id.in_(current_batch_ids),
                        project_table.c.status == 'unique'
                    )
                )
                unique_count = len(result.fetchall())
                
                result = connection.execute(
                    select(project_table).where(
                        project_table.c.id.in_(current_batch_ids),
                        project_table.c.status == 'duplicated'
                    )
                )
                duplicated_count = len(result.fetchall())
                
                result = connection.execute(
                    select(project_table).where(
                        project_table.c.id.in_(current_batch_ids),
                        project_table.c.status == 'disputed'
                    )
                )
                disputed_count = len(result.fetchall())
                
                return ProcessingResult(
                    unique=unique_count,
                    duplicated=duplicated_count,
                    disputed=disputed_count
                )
                
            except Exception as e:
                logger.error(f"Error during processing: {str(e)}")
                raise DatabaseError(f"Operation failed: {str(e)}")
                
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 