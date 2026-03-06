# 🚀 API Gateway Microservices System

> A production-inspired microservices architecture featuring API routing, LRU caching, token bucket rate limiting, request logging, and real-time performance metrics — built with Node.js, TypeScript, Express, and PostgreSQL (Neon).

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
  - [API Gateway](#api-gateway)
  - [Microservices](#microservices)
  - [Request Logging](#request-logging)
  - [Metrics Dashboard](#metrics-dashboard)
  - [Benchmark Snapshots](#benchmark-snapshots)
  - [Token Bucket Rate Limiting](#token-bucket-rate-limiting)
  - [LRU Cache](#lru-cache)
  - [Cache Metrics](#cache-metrics)
  - [Rate Limit Metrics](#rate-limit-metrics)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Load Testing](#load-testing)
- [Performance Results](#performance-results)
- [Known Limitations](#known-limitations)
- [Planned Optimizations](#planned-optimizations)
- [Future Improvements](#future-improvements)
- [Learning Goals](#learning-goals)
- [Screenshots](#screenshots)
- [Author](#author)

---

## Overview

This project simulates a real production architecture where an **API Gateway** sits in front of multiple microservices, collects request metrics, and allows performance analysis under load.

It demonstrates key system design concepts including:
- Centralized API routing via a gateway
- LRU in-memory caching for high-frequency GET endpoints
- Token Bucket rate limiting to protect backend services
- Synchronous request logging with observability metrics
- Load testing and benchmarking with Autocannon

---

## Architecture

```
                        Client
                           │
                     API Gateway
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    User Service                     Order Service
          │                                 │
          └────────────────┬────────────────┘
                           │
                  PostgreSQL (Neon DB)
```

**The API Gateway is responsible for:**
- Routing requests to the correct microservice
- Tracking and logging request latency
- Enforcing rate limits per client IP
- Serving cached responses for frequent reads
- Exposing aggregated metrics via a dashboard endpoint

---

## Features

### API Gateway

The centralized entry point for all client requests. Every request flows through the gateway before reaching a service.

**Responsibilities:**

| Responsibility | Details |
|---|---|
| Request Routing | Forwards requests to User or Order services |
| Latency Tracking | Measures and logs response time per request |
| Database Logging | Writes request metadata to `request_logs` |
| Metrics Serving | Exposes `GET /metrics/dashboard` |

---

### Microservices

Two independent services handle business logic and persist data to PostgreSQL.

#### User Service

| Endpoint | Description |
|---|---|
| `POST /users` | Create a new user |
| `GET /users/:id` | Retrieve a user by ID |

#### Order Service

| Endpoint | Description |
|---|---|
| `POST /orders` | Create a new order |
| `GET /orders/:id` | Retrieve an order by ID |

---

### Request Logging

Every request passing through the gateway is logged to the `request_logs` table in PostgreSQL, enabling full observability.

**Schema:**

| Column | Type | Description |
|---|---|---|
| `route` | `text` | API route accessed (e.g. `/users/1`) |
| `latency_ms` | `integer` | Response time in milliseconds |
| `status_code` | `integer` | HTTP status code returned |
| `cache_hit` | `boolean` | Whether the response was served from cache |
| `rate_limited` | `boolean` | Whether the request was blocked by the rate limiter |
| `logging_mode` | `text` | `sync` or `kafka` |
| `created_at` | `timestamp` | Timestamp of the request |

**Example record:**

```
route     | latency_ms | status_code | cache_hit | rate_limited
/users/1  |    180     |     200     |   true    |    false
```

---

### Metrics Dashboard

The gateway exposes a real-time metrics endpoint that aggregates data from the `request_logs` table.

**Endpoint:** `GET /metrics/dashboard`

**Available Metrics:**

| Metric | Description |
|---|---|
| Total Requests | Count of all logged requests |
| Average Latency | Mean response time across all requests |
| p95 Latency | 95th percentile response time |
| Cache Hit Rate | Percentage of requests served from cache |
| Rate Limited % | Percentage of requests blocked by rate limiter |
| Requests per Second (RPS) | System throughput |

---

### Benchmark Snapshots

Aggregated benchmark results can be persisted in the `metrics_summary` table, allowing comparison across system states (e.g. before/after adding cache or switching to async logging).

**Schema:**

| Column | Type | Description |
|---|---|---|
| `logging_mode` | `text` | `sync` or `kafka` |
| `avg_latency` | `float` | Average latency in ms |
| `p95_latency` | `float` | 95th percentile latency in ms |
| `rps` | `float` | Requests per second |
| `created_at` | `timestamp` | When the snapshot was taken |

---

### Token Bucket Rate Limiting

The gateway protects downstream services using a **Token Bucket** algorithm per client IP.

**Configuration:**

| Parameter | Value |
|---|---|
| Bucket Capacity | 100 tokens |
| Refill Rate | 50 tokens/second |

**Flow:**

```
Request arrives
      │
      ▼
Check token bucket for client IP
      │
      ├── Token available → Allow request
      │
      └── No token available → Return 429
```

**Example response when rate limited:**

```
HTTP 429 Too Many Requests
```

This protects the system from traffic spikes, abuse, and denial-of-service patterns.

![Rate Limiter Output](<Output-Results & Metrics/Screenshot 2026-03-06 181659.png>)

---

### LRU Cache

The gateway uses an **in-memory LRU (Least Recently Used) Cache** to serve frequent GET requests without hitting downstream services or the database.

**Cached Endpoints:**
- `GET /users/:id`
- `GET /orders/:id`

**Cache Design:**

| Component | Details |
|---|---|
| Data Structure | HashMap + Doubly Linked List |
| Eviction Policy | LRU (Least Recently Used) |

**Request Flow:**

```
GET request arrives
      │
      ▼
Check cache for key
      │
      ├── Cache HIT  → Return cached response immediately
      │
      └── Cache MISS → Forward to service → Store response → Return
```

**Benefits:**
- Drastically reduces database query volume
- Reduces load on microservices
- Improves average response time significantly

---

### Cache Metrics

The system tracks cache efficiency through the `cache_hit` boolean field in `request_logs`.

**Example query:**

```sql
SELECT
  COUNT(*) FILTER (WHERE cache_hit = true)  AS cache_hits,
  COUNT(*) FILTER (WHERE cache_hit = false) AS cache_misses,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE cache_hit = true) / COUNT(*), 2
  ) AS cache_hit_rate
FROM request_logs;
```

**Example result:**

```
Cache Hit Rate: 92%
```

---

### Rate Limit Metrics

The system also tracks how much traffic was blocked by the rate limiter.

**Example query:**

```sql
SELECT
  COUNT(*) FILTER (WHERE rate_limited = true) AS rate_limited_requests
FROM request_logs;
```

**Example result:**

```
Rate limited requests: 2,394
```

This provides insight into how much abusive or excess traffic the gateway is actively blocking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Web Framework | Express.js |
| Database | PostgreSQL via Neon Serverless |
| Load Testing | Autocannon |
| Dev Server | ts-node-dev |
| API Testing | Postman |

---

## Project Structure

```
API-Gateway/
│
├── gateway/
│   ├── middleware/
│   │   ├── metrics.ts           # Request latency tracking & logging
│   │   ├── rateLimiter.ts       # Token bucket rate limiting
│   │   └── cacheMiddleware.ts   # LRU cache middleware
│   │
│   ├── routes/
│   │   └── metricsRoutes.ts     # /metrics/dashboard endpoint
│   │
│   ├── db/
│   │   └── neon.ts              # Neon PostgreSQL client
│   │
│   └── index.ts                 # Gateway entry point
│
├── services/
│   ├── user-service/            # Handles /users endpoints
│   ├── order-service/           # Handles /orders endpoints
│   └── analytics-service/       # (Planned)
│
└── frontend/                    # (Planned — Next.js dashboard)
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- Neon PostgreSQL account (or any PostgreSQL instance)

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Configure environment

Create a `.env` file in each service and the gateway directory:

```env
DATABASE_URL=your_neon_postgres_connection_string
PORT=3000
```

### Step 3: Start each service

**User Service** (runs on port 3001):
```bash
cd services/user-service
npm run dev
```

**Order Service** (runs on port 3002):
```bash
cd services/order-service
npm run dev
```

**API Gateway** (runs on port 3000):
```bash
cd gateway
npm run dev
```

All requests should now be routed through `http://localhost:3000`.

---

## Load Testing

The project uses [Autocannon](https://github.com/mcollina/autocannon) for HTTP load testing.

### Install Autocannon

```bash
npm install -g autocannon
```

### Run a load test

```bash
autocannon -c 50 -d 10 http://localhost:3000/users/1
```

**Parameters:**

| Flag | Meaning |
|---|---|
| `-c 50` | 50 concurrent connections |
| `-d 10` | Run for 10 seconds |
| `URL` | Target endpoint |

**Example output:**

```
Latency Avg: 2534 ms
Req/Sec Avg: 17.9
Total Requests: 229 in 10 seconds
```

---

## Performance Results

Benchmarks collected using `autocannon -c 50 -d 10`.

### Without Cache

| Metric | Value |
|---|---|
| Avg Latency | ~2534 ms |
| p95 Latency | ~5800 ms |
| Throughput | ~18 req/sec |

### With Cache Enabled

| Metric | Value |
|---|---|
| Avg Latency | ~17 ms |
| p95 Latency | ~35 ms |
| Throughput | ~2750 req/sec |

> **Result: ~149× improvement in throughput and ~99% reduction in latency** by serving cached responses.

![Cache vs No Cache](<Output-Results & Metrics/sync_output_cachevsno_cache.png>)

---

## Known Limitations

The current system uses **synchronous database logging**, which adds latency to every request.

**Current request flow:**

```
Client
  │
  ▼
Gateway
  │
  ▼
User/Order Service
  │
  ▼
PostgreSQL (business query)
  │
  ▼
Gateway metrics middleware
  │
  ▼
PostgreSQL INSERT → request_logs   ← bottleneck under load
  │
  ▼
Response sent to client
```

Every request triggers **two database round-trips**:
1. The business query (e.g. fetch user by ID)
2. The metrics logging insert

Under high concurrency (50+ connections), database connection saturation becomes the primary bottleneck, leading to the elevated latency observed in no-cache benchmarks (~2534 ms avg).

---

## Planned Optimizations

### Kafka-based Asynchronous Logging

Decouple request logging from the critical path by using a message queue:

```
Request → Kafka Topic → Worker Consumer → PostgreSQL
```

The gateway will produce a log event to Kafka and immediately return the response, without waiting for the database write.

**Benefits:**
- Eliminates logging latency from the request path
- Non-blocking, fire-and-forget logging
- Improved throughput under high concurrency
- Better resilience to database slowdowns

### Metrics Dashboard (Next.js)

A frontend dashboard will visualize real-time and historical metrics including:
- Requests per second (RPS)
- Average and p95 latency
- Cache hit rate trends
- Rate limited request volume

---

## Future Improvements

| Improvement | Description |
|---|---|
| Kafka Async Logging | Decouple log writes from the request path |
| Redis Caching Layer | Persistent distributed cache to replace in-memory LRU |
| Docker Containerization | Containerize all services with Docker Compose |
| CI/CD Pipeline | Automated testing and deployment on push |
| Distributed Tracing | Request tracing with OpenTelemetry / Jaeger |
| Horizontal Scaling | Multiple gateway instances behind a load balancer |

---

## Learning Goals

This project demonstrates practical understanding of:

- **Microservices architecture** — Independent services communicating through an API Gateway
- **API Gateway design** — Centralized routing, middleware, and cross-cutting concerns
- **Caching strategies** — LRU eviction, cache hit/miss tracking, performance impact
- **Rate limiting** — Token bucket algorithm, per-IP enforcement
- **Performance monitoring** — Latency percentiles, RPS, observability via database logs
- **Load testing** — Simulating concurrent traffic with Autocannon
- **Bottleneck analysis** — Identifying and reasoning about system constraints
- **Backend scalability** — Design patterns for improving throughput and reducing latency

---

## Screenshots

### Load Test Output

![Sync Output 1](<Output-Results & Metrics/sync_output_1.png>)
![Sync Output 2](<Output-Results & Metrics/sync_output_2.png>)

### Cache vs No Cache Benchmark

![Cache vs No Cache](<Output-Results & Metrics/sync_output_cachevsno_cache.png>)

### Rate Limiter in Action

![Rate Limiter](<Output-Results & Metrics/Screenshot 2026-03-06 181659.png>)

> All screenshots and raw load test outputs are available in the `Output-Results & Metrics/` folder in the repository.

---

## Author

**Abhinav**
Engineering Student | Backend & Systems Enthusiast

---

*Built to explore and demonstrate real-world backend system design patterns.*