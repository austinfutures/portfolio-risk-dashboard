from pydantic import BaseModel, Field

class PortfolioItemBase(BaseModel):
    ticker: str = Field(..., example="AAPL")
    weight: float = Field(..., ge=0.0, le=1.0, example=0.25)

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemResponse(PortfolioItemBase):
    id: int

    class Config:
        from_attributes = True