# API Gateway Microservices System

A microservices-based API Gateway system built using Node.js, TypeScript, Express, and PostgreSQL (Neon) that demonstrates system design concepts such as API routing, request logging, performance metrics, and load testing.

This project simulates a real production architecture where an API Gateway sits in front of multiple microservices, collects request metrics, and allows performance analysis under load.

---

## 1. Architecture

```
Client
   ↓
API Gateway
   ↓
---------------------------
|                         |
User Service        Order Service
   ↓                     ↓
      PostgreSQL (Neon DB)
```

The API Gateway is responsible for:

- Routing requests to microservices
- Logging request metrics
- Measuring system performance
- Serving aggregated metrics

---

## 2. Features Implemented

### 2.1 API Gateway

Centralized entry point for all services.

**Responsibilities:**
- Route requests to services
- Track request latency
- Log requests to database
- Provide metrics endpoints

---

### 2.2 Microservices

Two independent services:

**User Service**

Handles:
- `POST /users`
- `GET /users/:id`

Stores user data in PostgreSQL.

**Order Service**

Handles:
- `POST /orders`
- `GET /orders/:id`

Stores order data in PostgreSQL.

---

### 2.3 Request Logging System

Every request passing through the gateway is logged into: `request_logs`

**Stored fields:**

| Column | Description |
|---|---|
| `route` | API route accessed |
| `latency_ms` | Request latency |
| `status_code` | HTTP status |
| `cache_hit` | Future caching flag |
| `created_at` | Timestamp |

**Example record:**

```
/users/1 | 180ms | 200 | false
```

---

### 2.4 Metrics Calculation

Metrics are calculated from raw request logs.

**Endpoint:** `GET /metrics`

**Metrics include:**

| Metric | Description |
|---|---|
| Total Requests | Number of logged requests |
| Average Latency | Mean response time |
| p95 Latency | 95th percentile latency |
| Requests per Second (RPS) | Throughput |

---

### 2.5 Benchmark Snapshots

Aggregated metrics can be stored in: `metrics_summary`

**Table schema:**

| Column | Description |
|---|---|
| `logging_mode` | sync / kafka |
| `avg_latency` | Average latency |
| `p95_latency` | 95th percentile |
| `rps` | Throughput |
| `created_at` | Benchmark timestamp |

This allows comparison between system optimizations.

---

## 3. Tech Stack

**Backend**
- Node.js
- Express.js
- TypeScript

**Database**
- PostgreSQL
- Neon Serverless Postgres

**Load Testing**
- Autocannon

**Dev Tools**
- Postman
- ts-node-dev

---

## 4. Project Structure

```
API-Gateway/
│
├── gateway
│   ├── middleware
│   ├── routes
│   ├── utils
│   ├── db
│   └── index.ts
│
├── services
│   ├── user-service
│   ├── order-service
│   └── analytics-service (future)
│
└── frontend (future)
```

---

## 5. Running the Project

**Step 1: Install dependencies**
```bash
npm install
```

**Step 2: Run services individually**

Start user service:
```bash
cd services/user-service
npm run dev
```

Start order service:
```bash
cd services/order-service
npm run dev
```

Start API gateway:
```bash
cd gateway
npm run dev
```

---

## 6. Load Testing with Autocannon

**Install autocannon globally:**
```bash
npm install -g autocannon
```

**Run load test:**
```bash
autocannon -c 50 -d 10 http://localhost:3000/users/1
```

**Parameters:**

| Flag | Meaning |
|---|---|
| `-c` | Concurrent users |
| `-d` | Duration |
| `URL` | Endpoint to test |

**Example output:**
```
Latency Avg: 2534 ms
Req/Sec Avg: 17.9
229 requests in 10 seconds
```

---

## 7. Performance Metrics

Example benchmark results:

| Metric | Value |
|---|---|
| Avg Latency | ~2534 ms |
| p95 Latency | ~5800 ms |
| Throughput | ~18 requests/sec |

> These values were collected using: `autocannon -c 50 -d 10`

Screenshots of load tests and database logs are included in the repository.

---

## 8. Known Limitation (Current Architecture)

The system currently uses **synchronous database logging**, which introduces latency.

**Current Request Flow:**
```
Client
   ↓
Gateway
   ↓
User Service
   ↓
Postgres query
   ↓
Gateway metrics middleware
   ↓
Postgres INSERT (request_logs)
   ↓
Response sent
```

This means every request performs **two database operations:**
1. Business query
2. Metrics logging query

Under high concurrency, database connections become the bottleneck, which leads to higher response latency.

---

## 9. Planned Optimizations

To improve performance and demonstrate advanced system design patterns, the following optimizations will be implemented:

### 9.1 Kafka-based Asynchronous Logging

Instead of writing logs directly to the database:

```
Request → Kafka → Worker → Database
```

**Benefits:**
- Reduced request latency
- Non-blocking logging
- Better scalability

### 9.2 Token Bucket Rate Limiting

Protect the gateway from abuse by limiting requests per client.

**Example:**
```
100 requests per minute per IP
```

### 9.3 LRU Cache

Cache frequently accessed GET requests:
- `GET /users/:id`
- `GET /orders/:id`

**Expected benefit:** Latency reduction

### 9.4 Metrics Dashboard (Next.js)

A frontend dashboard will visualize:
- RPS
- Latency
- p95 latency
- Request volume

---

## 10. Future Improvements

- Kafka async logging
- Redis caching layer
- Docker containerization
- CI/CD pipeline
- Distributed tracing
- Horizontal scaling

---

## 11. Learning Goals

This project demonstrates practical understanding of:

- Microservices architecture
- API Gateway design
- Performance monitoring
- Load testing
- System bottleneck analysis
- Backend scalability concepts

---

## 12. Author

**Abhinav**
Engineering Student | Backend & Systems Enthusiast

---

## 13. Screenshots

![Sync Output 1](<Output-Results & Metrics/sync_output_1.png>)
![Sync Output 2](<Output-Results & Metrics/sync_output_2.png>)

Load testing and database metrics screenshots are included in the repository *(Output-Results & Metrics folder)*.