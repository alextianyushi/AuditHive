from sqlalchemy import create_engine, Table, Column, Integer, String, JSON, MetaData, inspect, select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import QueuePool
from typing import List, Dict
from contextlib import contextmanager
import os
from app.logger import setup_logging

# Set up logging
logger = setup_logging()

# Ensure data directory exists
data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
os.makedirs(data_dir, exist_ok=True)

# Define the database URL using SQLite
DATABASE_URL = f"sqlite:///{os.path.join(data_dir, 'findings.db')}"

# Create the database engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    echo=False,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800  # Recycle connections older than 30 minutes
)

# Initialize MetaData for dynamic table creation
metadata = MetaData()

class DatabaseError(Exception):
    """Base exception for database operations"""
    pass

@contextmanager
def get_db_connection():
    """
    Context manager for database connections.
    Ensures proper handling of connections and transactions.
    """
    connection = engine.connect()
    try:
        yield connection
        connection.commit()
    except Exception as e:
        connection.rollback()
        logger.error(f"Database operation failed: {str(e)}")
        raise DatabaseError(f"Database operation failed: {str(e)}")
    finally:
        connection.close()

def get_project_table(project_id: str):
    """
    Dynamically create or retrieve a table for a given project.
    
    :param project_id: The identifier of the project (used to form the table name)
    :return: SQLAlchemy Table object for the project
    :raises DatabaseError: If there's an error creating or retrieving the table
    """
    try:
        table_name = f"findings_{project_id}"
        inspector = inspect(engine)
        
        # Check if the table already exists in the database
        if not inspector.has_table(table_name):
            # Define the table structure
            project_table = Table(
                table_name, metadata,
                Column('id', Integer, primary_key=True, autoincrement=True),
                Column('reported_by_agent', String, nullable=False),
                Column('finding_id', String, nullable=False),
                Column('description', String, nullable=False),
                Column('severity', String, nullable=False),
                Column('recommendation', String, nullable=False),
                Column('code_reference', String, nullable=False),
                Column('status', String, nullable=False, default='pending'),
                Column('details', String, nullable=True)
            )
            # Create the table in the database
            metadata.create_all(engine, tables=[project_table])
            logger.info(f"Created new table: {table_name}")
        else:
            # If table exists, reflect its structure from the database
            project_table = Table(table_name, metadata, autoload_with=engine)
            logger.debug(f"Using existing table: {table_name}")
        
        return project_table
    except Exception as e:
        logger.error(f"Error creating/retrieving project table: {str(e)}")
        raise DatabaseError(f"Error creating/retrieving project table: {str(e)}")

def insert_findings(project_id: str, agent_id: str, findings: List[Dict]):
    """
    Insert findings into the project table.
    
    :param project_id: The identifier of the project
    :param agent_id: The identifier of the agent reporting the findings
    :param findings: List of finding dictionaries containing finding details
    :raises DatabaseError: If there's any error during database operations
    """
    if not project_id or not agent_id:
        raise DatabaseError("Project ID and Agent ID cannot be empty")
        
    required_fields = ['finding_id', 'description', 'severity', 'recommendation', 'code_reference']
    project_table = get_project_table(project_id)
    
    with get_db_connection() as connection:
        try:
            # Insert all findings in a single transaction
            for finding in findings:
                # Validate required fields
                missing_fields = [field for field in required_fields if field not in finding or not finding[field]]
                if missing_fields:
                    raise DatabaseError(f"Missing required fields: {', '.join(missing_fields)}")
                
                insert_stmt = project_table.insert().values(
                    reported_by_agent=agent_id,
                    finding_id=finding["finding_id"],
                    description=finding["description"],
                    severity=finding["severity"],
                    recommendation=finding["recommendation"],
                    code_reference=finding["code_reference"]
                )
                connection.execute(insert_stmt)
                logger.info(f"Inserted finding: {finding['finding_id']}")
                
            connection.commit()
            logger.info(f"Successfully inserted {len(findings)} findings")
            
        except Exception as e:
            logger.error(f"Error inserting findings: {str(e)}")
            raise DatabaseError(f"Error inserting findings: {str(e)}")
