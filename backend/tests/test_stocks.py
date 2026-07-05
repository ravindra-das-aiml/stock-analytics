import pytest

@pytest.mark.asyncio
async def test_get_stock_valid(client):
    response = await client.get("/api/v1/stocks/AAPL")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "AAPL"
    assert "current_price" in data

@pytest.mark.asyncio
async def test_get_stock_invalid(client):
    response = await client.get("/api/v1/stocks/INVALIDXYZ123")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_history(client):
    response = await client.get("/api/v1/stocks/AAPL/history?period=1mo")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) > 0

@pytest.mark.asyncio
async def test_get_history_valid_periods(client):
    for period in ["1d", "5d", "1mo", "3mo"]:
        response = await client.get(f"/api/v1/stocks/AAPL/history?period={period}")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_search_stocks(client):
    response = await client.get("/api/v1/stocks/search?q=AAPL")
    assert response.status_code == 200
    assert "results" in response.json()
