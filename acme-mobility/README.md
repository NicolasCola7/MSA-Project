# ACMEMobility — Dev Environment

## Stack

| Component | Technology | URL |
|---|---|---|
| Frontend | nginx + HTML/JS | http://localhost:3000 |
| Rental Service | Spring Boot 3 / Java 21 | http://localhost:8080 |
| Camunda Operate | Camunda 8.4 | http://localhost:8081 |
| Zeebe (gRPC) | Camunda 8.4 | localhost:26500 |
| Elasticsearch | 8.9.1 | http://localhost:9200 |

---

## Prerequisites

- Docker ≥ 24 and Docker Compose v2
- At least 6 GB RAM available for Docker (Elasticsearch is heavy)

---

## Run

```bash
# 1. Clone / enter the project
cd acme-mobility

# 2. Build and start all containers
docker-compose up --build

# Wait ~90 seconds for Elasticsearch + Zeebe to be ready.
# Watch for: "Deployed: processId=rental-service-process version=1"
```

## Verify

```bash
# Health check
curl http://localhost:8080/api/health

# Get available vehicles (also triggers Zeebe process)
curl "http://localhost:8080/api/vehicles?userId=user-test"

# Open the frontend
open http://localhost:3000

# Monitor process instances in Camunda Operate
open http://localhost:8081   # login: demo / demo
```

---

## Flow triggered by GET /api/vehicles

```
User opens app
  → GET /api/vehicles?userId=user-xyz
  → VehicleService returns vehicle list (REST)
  → publishMessage("Message_openingMap", correlationKey=userId)
  → Zeebe starts rental-service-process instance
  → Job Worker [dbOperation]     → GetAvailableVehiclesWorker
  → Job Worker [returnVehicles]  → ReturnVehiclesWorker
  → Process waits for next user action (QR scan / reservation)
```

---

## Useful commands

```bash
# Stop all containers
docker-compose down

# Stop and delete volumes (full reset)
docker-compose down -v

# View rental-service logs
docker-compose logs -f rental-service

# View Zeebe logs
docker-compose logs -f zeebe
```

---

## Next steps

- [ ] Implement QR scan endpoint → `POST /api/rental/scan`
- [ ] Wire up `blockMoney` → BankService (Jolie)
- [ ] Wire up `unlockVehicle` → StationService
- [ ] Add real DynamoDB for Vehicles table
- [ ] Add authentication (JWT)
