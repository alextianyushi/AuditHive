from sqlalchemy import select, update
from typing import Dict, List
import os
from app.database import get_project_table, get_db_connection, DatabaseError
from anthropic import Anthropic
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

def get_similarity_score(finding1, finding2) -> float:
    """Compare two findings and return similarity score (0-100)"""
    if finding1.description == finding2.description and finding1.code_reference == finding2.code_reference:
        return 100
    
    try:
        load_dotenv(override=True)
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            return 0
        
        client = Anthropic(api_key=api_key)
        prompt = f"""Compare these two security findings and rate their similarity from 0-100 based ONLY on their description and code location:
        
        Finding 1:
        Description: {finding1.description}
        Code Location: {finding1.code_reference}
        
        Finding 2:
        Description: {finding2.description}
        Code Location: {finding2.code_reference}
        
        Reply only with a number 0-100."""
        
        try:
            response = client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=10,
                temperature=0,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return float(response.content[0].text.strip()) if response.content else 0
                
        except Exception as e:
            if "insufficient_quota" in str(e) or "429" in str(e):
                # Fallback to text similarity
                desc1, desc2 = finding1.description.lower(), finding2.description.lower()
                code1, code2 = finding1.code_reference.lower(), finding2.code_reference.lower()
                
                if desc1 == desc2 and code1 == code2:
                    return 100
                
                # Calculate description similarity
                if desc1 in desc2 or desc2 in desc1:
                    desc_score = 80
                else:
                    words1, words2 = set(desc1.split()), set(desc2.split())
                    common_words = words1.intersection(words2)
                    desc_score = (2 * len(common_words)) / (len(words1) + len(words2)) * 100 if common_words else 0
                
                # Return weighted average (70% description, 30% code location)
                return (0.7 * desc_score) + (0.3 * (100 if code1 == code2 else 0))
            
            return 0
            
    except Exception:
        return 0

def check_duplicates(project_id: str, current_batch_ids: List[int] = None) -> tuple[int, int]:
    """Process findings and mark duplicates"""
    project_table = get_project_table(project_id)
    total_processed = duplicate_count = 0
    
    try:
        with get_db_connection() as connection:
            # Get findings to process
            pending_findings = connection.execute(
                select(project_table).where(
                    project_table.c.id.in_(current_batch_ids) if current_batch_ids else True,
                    project_table.c.status == 'pending'
                )
            ).fetchall()
            
            if not pending_findings:
                return 0, 0
            
            # Get existing findings for comparison
            existing_findings = connection.execute(
                select(project_table).where(
                    project_table.c.status != 'pending',
                    project_table.c.id.notin_(current_batch_ids or [])
                )
            ).fetchall()
            
            # Process each finding
            for i, finding in enumerate(pending_findings):
                is_duplicate = False
                
                # Compare with existing findings
                for existing in existing_findings:
                    if get_similarity_score(finding, existing) >= 70:
                        connection.execute(
                            update(project_table)
                            .where(project_table.c.id == finding.id)
                            .values(status='duplicated', details=f"Duplicate of {existing.finding_id}")
                        )
                        duplicate_count += 1
                        is_duplicate = True
                        break
                
                # If not duplicate with existing findings, compare with previous findings in current batch
                if not is_duplicate:
                    for prev_finding in pending_findings[:i]:
                        if get_similarity_score(finding, prev_finding) >= 70:
                            connection.execute(
                                update(project_table)
                                .where(project_table.c.id == finding.id)
                                .values(status='duplicated', details=f"Duplicate of {prev_finding.finding_id}")
                            )
                            duplicate_count += 1
                            is_duplicate = True
                            break
                
                # Mark as unique if not duplicate
                if not is_duplicate:
                    connection.execute(
                        update(project_table)
                        .where(project_table.c.id == finding.id)
                        .values(status='unique')
                    )
                
                total_processed += 1
                
            connection.commit()
            return total_processed, duplicate_count
            
    except Exception as e:
        logger.error(f"Error in duplicate check: {str(e)}")
        raise