# ACMEMobility — Angular 21 Frontend

Single Page Application for the ACMEMobility microservices platform.

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Angular 21 (standalone, signals, new control flow) |
| State | Angular Signals (`signal`, `computed`, `effect`) |
| HTTP | `HttpClient` with `provideHttpClient` + `withFetch()` |
| WebSocket | `rxjs/webSocket` (`WebSocketSubject`) |
| Styling | SCSS with CSS custom properties (design tokens) |
| Build | `@angular-devkit/build-angular:application` (esbuild) |
| Serve | nginx 1.27-alpine |
| Container | Docker multi-stage build |

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── vehicle.model.ts      ← domain types + pure helpers
│   │   │   └── trace-log.model.ts    ← execution trace types
│   │   └── services/
│   │       ├── websocket.service.ts  ← RxJS WebSocketSubject wrapper
│   │       ├── vehicle.service.ts    ← orchestrates WS → HTTP → signals
│   │       └── session.service.ts    ← userId (sessionStorage)
│   ├── features/
│   │   └── vehicles/                 ← lazy-loaded feature module
│   │       ├── components/
│   │       │   ├── vehicle-card/
│   │       │   ├── vehicle-grid/
│   │       │   ├── stats-bar/
│   │       │   └── process-trace/
│   │       ├── vehicles.component.ts ← feature shell
│   │       └── vehicles.routes.ts
│   ├── shared/
│   │   └── components/
│   │       ├── header/
│   │       └── status-bar/
│   ├── app.component.ts
│   ├── app.config.ts                 ← provideRouter, provideHttpClient
│   └── app.routes.ts
├── environments/
│   ├── environment.ts                ← dev (proxy)
│   └── environment.prod.ts           ← prod (nginx)
└── styles.scss                       ← global reset + CSS tokens
```

## Getting Started

### Local development

```bash
npm install
npm start
# → http://localhost:4200
# Angular dev-server proxies /api and /ws to localhost:8080 via proxy.conf.json
```

### Production Docker build

```bash
docker build -t acme-mobility-frontend .
docker run -p 80:80 acme-mobility-frontend
```

### Docker Compose (with rental-service)

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - rental-service

  rental-service:
    image: acme-rental-service:latest
    ports:
      - "8080:8080"
```

## Flow Summary

```
1. VehiclesComponent.ngOnInit()
      └─ VehicleService.initialize(userId)
            ├─ WebSocketService.connect(userId)   ← STEP 1: open WS first
            │     ws://host/ws/vehicles?userId=…
            │
            └─ (on WS open) HTTP GET /api/vehicles?userId=…   ← STEP 2
                  └─ Zeebe starts process instance
                        └─ Worker pushes via WS: { type: "VEHICLES_AVAILABLE", … }
                              └─ vehicles signal updated → UI re-renders
```
