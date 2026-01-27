# 🚀 Venture Pulse
**Portfolio Monitoring & Venture Analytics Dashboard**

Venture Pulse is a full-stack internal tool designed for venture studios to track portfolio health, monthly burn rates, and pilot customer progress. It features an AI-powered analyst to query the portfolio using natural language.

---

## 🏗️ Architecture Overview



* **Frontend**: React (Vite) + Tailwind CSS + Framer Motion + Recharts
* **Backend**: FastAPI (Python 3.11) + SQLModel (SQLAlchemy + Pydantic)
* **Database**: PostgreSQL (Relational Data)
* **Cache/Session**: Redis (Chat history & State management)
* **Orchestration**: Docker Compose

---

## 🛠️ Setup Instructions

### 1. Prerequisites
* Docker and Docker Compose installed.
* An OpenAI API Key (required for the AI Analyst).

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database
DB_USER=postgres
DB_PASS=postgres123
DB_NAME=venture_pulse
DATABASE_URL=postgresql://postgres:postgres123@db:5432/venture_pulse

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# LLM
OPENAI_API_KEY=sk-proj-...


# JSON mapping of provider to a list of allowed models
ALLOWED_MODELS_JSON='{"openai": ["gpt-4o", "gpt-5-nano", "gpt-5.2"], "anthropic": ["claude-3-5-sonnet-20240620"], "google": ["gemini-1.5-flash"]}'
```