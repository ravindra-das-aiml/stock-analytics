import pytest

async def get_token(client):
    await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    })
    response = await client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "password123"
    })
    return response.json()["access_token"]

@pytest.mark.asyncio
async def test_get_empty_portfolio(client):
    token = await get_token(client)
    response = await client.get("/api/v1/portfolio/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["holdings"] == []

@pytest.mark.asyncio
async def test_buy_stock(client):
    token = await get_token(client)
    response = await client.post("/api/v1/portfolio/buy",
        json={"symbol": "AAPL", "quantity": 10, "buy_price": 150.0},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert "AAPL" in response.json()["message"]

@pytest.mark.asyncio
async def test_portfolio_after_buy(client):
    token = await get_token(client)
    await client.post("/api/v1/portfolio/buy",
        json={"symbol": "AAPL", "quantity": 10, "buy_price": 150.0},
        headers={"Authorization": f"Bearer {token}"}
    )
    response = await client.get("/api/v1/portfolio/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()["holdings"]) == 1

@pytest.mark.asyncio
async def test_sell_stock(client):
    token = await get_token(client)
    buy_response = await client.post("/api/v1/portfolio/buy",
        json={"symbol": "AAPL", "quantity": 10, "buy_price": 150.0},
        headers={"Authorization": f"Bearer {token}"}
    )
    holding_id = buy_response.json()["id"]
    response = await client.delete(f"/api/v1/portfolio/{holding_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_portfolio_unauthorized(client):
    response = await client.get("/api/v1/portfolio/")
    assert response.status_code == 401
