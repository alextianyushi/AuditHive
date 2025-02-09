from anthropic import Anthropic
import os
from app.logger import setup_logging

logger = setup_logging()

class ArbiterChat:
    def __init__(self):
        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.system_prompt = self._get_system_prompt()

    def _get_system_prompt(self) -> str:
        """Generate the system prompt for Claude."""
        return """You are a technical assistant for AuditHive, a decentralized smart contract auditing platform.
        
        Core Rules:
        - Keep responses under 30 words
        - Use simple, direct language
        - Focus on one key point per response
        
        About AuditHive:
        - A decentralized smart contract auditing platform
        - Utilizes TEE-based intelligent arbiter for fair evaluations
        - Employs parallel analysis from multiple AI agents
        - Ensures efficient and comprehensive security assessments
        
        Key Features:
        1. Decentralized Ecosystem:
        - On-chain task submission
        - Open participation for AI agent developers
        - Community-driven innovation
        
        2. TEE-Based Arbiter:
        - Operates in Trusted Execution Environment
        - Ensures verifiable and fair evaluations
        - Handles deduplication and quality assessment
        
        3. Speed & Scalability:
        - Parallel analysis by multiple agents
        - Rapid results delivery (hours vs weeks)
        - Comprehensive security coverage
        
        Technical Implementation:
        - Deployed on Arbitrum for transparency
        - Uses TEE for secure execution
        - Smart deduplication across submissions
        - Quality evaluation with scoring
        
        Audit Report Format:
        {
            "project_id": "unique_project_id",
            "reported_by_agent": "agent_name",
            "findings": [
                {
                    "finding_id": "unique_id",
                    "description": "security issue description",
                    "severity": "HIGH/MEDIUM/LOW",
                    "recommendation": "fix recommendation",
                    "code_reference": "file:line_number"
                }
            ]
        }
        
        Security & Transparency:
        - All activities executed on-chain through Arbitrum
        - TEE ensures code integrity and verifiable execution
        - Agent integrity verified through secure enclaves
        - Transparent evaluation and scoring process"""

    def _get_context(self, query: str) -> str:
        """Get relevant context based on query."""
        if "report format" in query.lower() or "audit format" in query.lower():
            return """
            Arbiter uses a standardized JSON format for security findings:
            - Project and agent identification
            - Finding details (ID, description, severity)
            - Recommendations and code references
            - All fields are required for proper processing
            """
        elif "transparent" in query.lower() or "decentralized" in query.lower():
            return """
            AuditHive ensures transparency through:
            - On-chain execution via Arbitrum
            - Verifiable evaluation process
            - Public audit records
            - Decentralized agent participation
            """
        elif "integrity" in query.lower() or "verify" in query.lower():
            return """
            Arbiter agent integrity is ensured through:
            - Trusted Execution Environment (TEE) in Autonome
            - Secure enclaves for code execution
            - Verifiable computation
            - Immutable judgement logs
            """
        elif "deploy" in query.lower() or "platform" in query.lower():
            return """
            Arbiter is deployed on Autonome, a specialized platform for autonomous AI agents.
            It provides secure deployment through TEE and supports production-ready frameworks.
            """
        elif "process" in query.lower() or "evaluate" in query.lower():
            return """
            Arbiter processes security findings by:
            - Detecting duplicates across submissions
            - Evaluating finding quality
            - Tracking project statistics
            """
        else:
            return """
            Arbiter is an automated quality control service for security findings,
            deployed on Autonome with TEE-based security and verifiable execution.
            """

    async def chat(self, query: str) -> str:
        """Handle chat queries about Arbiter and AuditHive."""
        try:
            if not self.anthropic:
                logger.error("Anthropic client not initialized")
                raise Exception("Chat service not properly initialized")

            if not query or not isinstance(query, str):
                logger.error(f"Invalid query type or empty query: {type(query)}")
                raise ValueError("Query must be a non-empty string")

            context = self._get_context(query)
            logger.info(f"Generated context for query: {query}")
            
            message = self.anthropic.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1024,
                temperature=0.7,
                system=self.system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": f"""Based on this context:
                        
                        {context}
                        
                        Please answer this question:
                        {query}
                        """
                    }
                ]
            )
            
            if not message or not message.content:
                logger.error("Empty response from Anthropic API")
                raise Exception("Failed to generate response")

            response = message.content[0].text if hasattr(message.content[0], 'text') else str(message.content[0])
            logger.info(f"Generated response: {response}")
            return response

        except Exception as e:
            logger.error(f"Error in chat method: {str(e)}", exc_info=True)
            raise

    async def explain_evaluation(self, finding_status: str) -> str:
        """Get a detailed explanation of a finding status."""
        info = self._get_arbiter_info()
        
        message = self.anthropic.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=512,
            temperature=0.7,
            system=self.system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"""Based on Arbiter's evaluation criteria:
                    {info['evaluation_explained']}
                    
                    Please explain what it means for a finding to be marked as '{finding_status}' 
                    and what actions might be needed.
                    """
                }
            ]
        )
        
        return message.content

    async def format_finding_example(self, severity: str = "HIGH") -> str:
        """Generate an example finding with the specified severity."""
        message = self.anthropic.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=512,
            temperature=0.7,
            system=self.system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"""Please provide a well-formatted example of a {severity} severity security finding 
                    that would meet Arbiter's quality criteria. Format it as a JSON object matching the input format.
                    Make it realistic but easy to understand.
                    """
                }
            ]
        )
        
        return message.content 