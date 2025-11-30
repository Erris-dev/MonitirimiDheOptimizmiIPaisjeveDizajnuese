### 📁 Project Structure

This repository is organized as a monorepo, primarily separated into `backend` (Go microservices), `frontend`, and supporting infrastructure for deployment and monitoring.

```
APP
.
├── backend/
│   ├── api-gateway/          
│   ├── microservices/
│   │   ├── analytics-reporting-service/
│   │   │   ├── src/
│   │   │   ├── .env
│   │   │   └── Dockerfile
│   │   ├── auth-service/
│   │   │   ├── src/
│   │   │   ├── tmp/
│   │   │   ├── .env
│   │   │   ├── Dockerfile
│   │   │   ├── go.mod
│   │   │   └── go.sum
│   │   ├── data-ingestion-service/
│   │   │   ├── src/
│   │   │   ├── .env
│   │   │   └── Dockerfile
│   │   └── data-processing-service/
│   │       ├── src/
│   │       ├── .env
│   │       └── Dockerfile
│   ├── tmp/
│   ├── .gitignore
│   ├── docker-compose.yml
│   ├── go.work
│   └── package.json
├── ci-cd/
├── docs/
├── frontend/
├── infrastructure/
├── k8s/
├── monitoring/
│   ├── alertmanager/
│   ├── grafana/
│   └── prometheus/
└── README.MD
```