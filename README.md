# 🚀 Venture Pulse
**Portfolio Monitoring & Venture Analytics Dashboard**

Venture Pulse is a full-stack internal tool designed for venture studios to track portfolio health, monthly burn rates, and pilot customer progress. It features an AI-powered analyst to query the portfolio using natural language.

---

## 🏗️ Architecture Overview

![Venture Pulse Architecture](./venture_pulse_system_architecture.jpg)

The system is designed as a modular, containerized microservices architecture:

* **Reverse Proxy (Nginx)**: Acts as the "Gatekeeper." It handles incoming traffic from Cloudflare, intelligently routing `/api` requests to the FastAPI backend and all other traffic to the React frontend.
* **Frontend**: Built with **React (Vite)**, **Tailwind CSS**, and **Framer Motion**. It provides a high-performance dashboard with interactive data visualizations via **Recharts**.
* **Backend (FastAPI)**: The core engine. It manages business logic, database ORM via **SQLModel**, and orchestrates the AI agent's reasoning loops.
* **AI Agent (OpenAI)**: Integrated into the backend to transform natural language queries into SQL or data insights, allowing users to "talk" to their portfolio data.
* **Database (PostgreSQL)**: The reliable "Source of Truth" for all relational portfolio data, investment rounds, and KPIs.
* **Cache/Session (Redis)**: Manages real-time chat history and temporary state to ensure fast, context-aware AI interactions.
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