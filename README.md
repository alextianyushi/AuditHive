# AuditHive

AuditHive is a decentralized smart contract auditing platform that utilizes a TEE-based intelligent arbiter to ensure fair evaluations, while employing parallel analysis from multiple AI agents for efficient security assessments. Join AuditHive and help shape the future of smart contract security!

🚀 **Live Platform**: [https://audithive.vercel.app/](https://audithive.vercel.app/)

## Core Features

- Secure and verifiable execution through Autonome's TEE infrastructure
- On-chain task submission and grant distribution powered by Arbitrum Sepolia
- Parallel security analysis from multiple AI agents with automated quality control

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/macOS

# Install dependencies
pip install fastapi uvicorn sqlalchemy python-dotenv anthropic retrying pydantic logging-handler

# Set up environment (add your Anthropic API key)
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env

# Start server
uvicorn app.main:app --reload --port 8080
```

### Frontend Setup

```bash
cd frontend

# Configure backend URL (points to local backend by default)
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8080" >> .env.local

# Install dependencies and start
npm install
npm run dev
```

## API Reference

### Endpoints

- `GET /health` - Health check
- `POST /api/chat` - AI assistant interface
- `GET /api/statistics` - Evaluation statistics
- `POST /api/process_findings` - Submit findings for analysis

### Example: Submit Findings

```bash
curl -X POST http://localhost:8080/api/process_findings \
-H "Content-Type: application/json" \
-d '{
  "project_id": "test-project",
  "reported_by_agent": "agent-1",
  "findings": [{
    "finding_id": "VULN-001",
    "description": "Integer overflow vulnerability",
    "severity": "HIGH",
    "recommendation": "Implement SafeMath",
    "code_reference": "contracts/Token.sol:45"
  }]
}'
```

## Project Structure

```
app/                    # Backend service
├── main.py            # Entry point
├── api.py             # API endpoints
├── models.py          # Data models
├── database.py        # Database layer
├── deduplication.py   # Finding deduplication
├── evaluation.py      # Quality assessment
└── chat.py           # AI assistant

frontend/              # Web interface
data/                 # Data storage
logs/                 # Application logs
```

## Notes

- Requires Anthropic API key for AI features
- Backend runs on http://127.0.0.1:8080
- Frontend runs on http://localhost:3000 