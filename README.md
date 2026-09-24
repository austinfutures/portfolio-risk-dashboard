# Enterprise Portfolio Risk Analytics Dashboard

<img width="1407" height="986" alt="image" src="https://github.com/user-attachments/assets/a5988fe9-5252-48fe-b7a7-8389f1332c59" />


![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)

A full-stack, multi-container enterprise risk analytics application designed to calculate real-time portfolio metrics, value-at-risk (VaR), Sharpe ratios, and drawdowns based on live market data.

Built with a **FastAPI** backend, **React + TypeScript** frontend, and **PostgreSQL** database, orchestrated using **Docker Compose** for seamless deployment and reproducible environments.

---

## Key Features

- **Real-Time Risk Engine**: Pulls historical price data via `yfinance` to dynamically compute:
  - **95% Daily Value at Risk (VaR)** (Historical Simulation)
  - **Annualized Sharpe Ratio**
  - **Maximum Drawdown (%)**
  - **Portfolio Valuation & Asset Weights**
- **Dynamic Portfolio Management**: Add, remove, or modify asset tickers and target weights directly in the UI with automated recalculations.
- **Interactive Visualizations**: Interactive asset allocation distribution rendered via `Recharts`.
- **Database Persistence**: Portfolio holdings, validation rules, and schemas managed through `SQLAlchemy` ORM and `Pydantic` v2 models.
- **Enterprise Containerization**: Isolated multi-container architecture using `docker-compose` with production-grade Nginx web serving.

---

## Architecture Overview

```text
                  ┌──────────────────────────────┐
                  │    Browser (Host Machine)    │
                  │    http://localhost:5173     │
                  └──────────────┬───────────────┘
                                 │
  ─────── Docker Virtual Bridge Network ─────────────────────────
                                 │
      ┌──────────────────────────┼──────────────────────────┐
      │                          │                          │
      ▼                          ▼                          ▼
┌───────────┐              ┌───────────┐              ┌───────────┐
│  frontend │              │  backend  │              │ postgres  │
│  (Nginx)  │ ───────────> │ (FastAPI) │ ───────────> │ (DB v15)  │
└───────────┘              └───────────┘              └───────────┘
```

- **Frontend Container**: React / TypeScript / Vite compiled static assets served via **Nginx** (Port `5173`).
- **Backend Container**: FastAPI async REST API running on **Uvicorn** (Port `8000`).
- **Database Container**: **PostgreSQL 15** service with persistent volume storage (`postgres_data`).

---

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Axios
- **Backend**: FastAPI, Uvicorn, SQLAlchemy, Pydantic v2, Pandas, NumPy, yfinance
- **Database**: PostgreSQL 15 (Docker) / SQLite (Local Fallback)
- **DevOps**: Docker, Docker Compose, Nginx

---

## Quick Start (Docker Compose)

### Prerequisites

Ensure you have the following installed on your host system:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose V2)
- [Git](https://git-scm.com/)

### Running the Stack

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/portfolio-risk-dashboard.git
   cd portfolio-risk-dashboard
   ```

2. **Launch Containers**
   ```bash
   docker compose up --build -d
   ```

3. **Access Services**
   - **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
   - **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database**: Port `5432`

4. **Stop Services**
   ```bash
   docker compose down
   ```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/portfolio/metrics` | Fetches calculated risk metrics (VaR, Sharpe, Max Drawdown, Value) |
| `GET` | `/api/portfolio/holdings` | Retrieves current asset holdings and weights from PostgreSQL |
| `POST` | `/api/portfolio/holdings` | Replaces portfolio allocation (Validates that weights sum to 1.0) |

---

## Local Development (Docker not required)

If you prefer to run services individually without Docker:

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
