# MAD — System Architecture & Anonymity Specification

## 1. Overview

MAD (Anonymous Addiction Support App) is built with strict anonymity boundaries at the database layer. No endpoint or query ever joins PII fields from `users` or `questionnaire_responses` into chatroom or message data returned to clients.

## 2. Core Components

```mermaid
graph TB
    Client["PWA Client<br/>React + Tailwind"]
    Nginx["Nginx Reverse Proxy<br/>Port 80"]
    API["FastAPI Backend<br/>Port 8000"]
    SIO["Socket.IO Server<br/>ASGI AsyncNamespace"]
    DB["PostgreSQL 16<br/>Data Persistence"]
    Redis["Redis 7<br/>Pub/Sub Broker"]
    ML["scikit-learn<br/>Feature Vector Clustering"]

    Client -->|HTTP / WebSockets| Nginx
    Nginx -->|/api/*| API
    Nginx -->|/socket.io/*| SIO
    API --> DB
    SIO --> DB
    SIO --> Redis
    API --> ML
```

## 3. Data Isolation Matrix

| Layer | Table | Exposed to Chat API? | Allowed Fields |
|---|---|---|---|
| PII | `users` | ❌ No | `email_hash` (SHA-256), `password_hash` (bcrypt) |
| PII | `questionnaire_responses` | ❌ No | `addiction_type`, `frequency`, `feature_vector` |
| Anonymous | `profiles` | ✅ Yes | `display_name` (e.g. "Fox_482"), `avatar_seed` |
| Anonymous | `chatrooms` | ✅ Yes | `id`, `addiction_type`, `is_general` |
| Anonymous | `messages` | ✅ Yes | `content`, `sent_at`, `profile_id` |

## 4. Algorithmic Matching Vector Specification

The feature vector encodes user questionnaire responses into a 7-dimensional space:
- `v[0..2]`: One-hot encoded addiction type (`alcohol`, `smoking`, `gaming`)
- `v[3]`: Normalized frequency score (`daily`: 1.0, `weekly`: 0.7, `monthly`: 0.4, `rarely`: 0.1)
- `v[4]`: Severity score (derived from onset & frequency)
- `v[5]`: Disclosed to others binary (0.0 or 1.0)
- `v[6]`: Knows similar others binary (0.0 or 1.0)

Vectors are L2-normalized using `sklearn.preprocessing.normalize` prior to running K-Means clustering.

## 5. SOS Crisis Alert Path

```mermaid
sequenceDiagram
    participant User as Client App
    participant SOS as SOS API Router
    participant SIO as Socket.IO Chatroom
    participant DB as PostgreSQL

    User->>SOS: POST /api/sos {chatroom_id, level}
    SOS->>DB: Insert SOSEvent row
    SOS->>SIO: Broadcast `sos_alert` event to room_{chatroom_id}
    alt level == 'urgent'
        SOS-->>User: Return 24/7 Crisis Helplines
    else level == 'struggling'
        SOS-->>User: Acknowledge alert broadcasted
    end
```
