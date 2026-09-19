from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import yfinance as yf
import numpy as np
import pandas as pd
from typing import List

import models, schemas, database

# Create DB Tables on Startup
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Portfolio Risk Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

# Initialize default portfolio if empty
def seed_default_portfolio(db: Session):
    if db.query(models.PortfolioItem).count() == 0:
        defaults = [
            ("AAPL", 0.40),
            ("MSFT", 0.30),
            ("GOOGL", 0.20),
            ("AMZN", 0.10)
        ]
        for ticker, weight in defaults:
            db.add(models.PortfolioItem(ticker=ticker, weight=weight))
        db.commit()

@app.get("/api/portfolio/holdings", response_model=List[schemas.PortfolioItemResponse])
def get_holdings(db: Session = Depends(database.get_db)):
    seed_default_portfolio(db)
    return db.query(models.PortfolioItem).all()

@app.post("/api/portfolio/holdings", response_model=List[schemas.PortfolioItemResponse])
def update_holdings(items: List[schemas.PortfolioItemCreate], db: Session = Depends(database.get_db)):
    # Validate sum of weights equals 1.0 (100%)
    total_weight = sum(item.weight for item in items)
    if not (0.99 <= total_weight <= 1.01):
        raise HTTPException(status_code=400, detail="Portfolio weights must sum to 1.0 (100%)")

    # Clear and replace holdings
    db.query(models.PortfolioItem).delete()
    db.commit()

    db_items = [models.PortfolioItem(ticker=item.ticker.upper(), weight=item.weight) for item in items]
    db.add_all(db_items)
    db.commit()
    return db.query(models.PortfolioItem).all()

@app.get("/api/portfolio/metrics")
def get_portfolio_metrics(db: Session = Depends(database.get_db)):
    seed_default_portfolio(db)
    holdings = db.query(models.PortfolioItem).all()

    portfolio = {item.ticker: item.weight for item in holdings}
    total_portfolio_value = 100000.0

    tickers = list(portfolio.keys())
    weights = np.array(list(portfolio.values()))

    data = yf.download(tickers, period="1y")["Close"]
    daily_returns = data.pct_change().dropna()
    portfolio_daily_returns = daily_returns.dot(weights)

    confidence_level = 0.95
    var_percentile = np.percentile(portfolio_daily_returns, (1 - confidence_level) * 100)
    daily_var_dollars = abs(var_percentile * total_portfolio_value)

    mean_return = portfolio_daily_returns.mean()
    std_dev = portfolio_daily_returns.std()
    sharpe_ratio = (mean_return / std_dev) * np.sqrt(252)

    cumulative_returns = (1 + portfolio_daily_returns).cumprod()
    peak = cumulative_returns.cummax()
    drawdown = (cumulative_returns - peak) / peak
    max_drawdown = drawdown.min()

    return {
        "total_value": total_portfolio_value,
        "daily_var": round(daily_var_dollars, 2),
        "sharpe_ratio": round(float(sharpe_ratio), 2),
        "max_drawdown": round(float(max_drawdown), 4),
        "asset_allocation": [
            {"asset": item.ticker, "percentage": int(item.weight * 100)}
            for item in holdings
        ]
    }