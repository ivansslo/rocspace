# 🟢 Solace Cloud — RoClace Cluster — AKTIF

## 📊 Service Info

| Key | Value |
|---|---|
| **Service** | RoClace Cluster |
| **Service ID** | `p37j7q6aggq` |
| **Org** | `3n3br39jdj4` |
| **Type** | Developer (Free) |
| **Region** | `eks-ap-southeast-1a` (AWS Singapore) |
| **VPN** | `roclace-cluster` |
| **Status** | ✅ Running |
| **Limits** | 100 clients · 100 queues · 25 GB · 8 Mbps · 2 GB/month |

---

## 🔌 Connection Endpoints

### Messaging (Username: `solace-cloud-client`)
| Protocol | URI |
|---|---|
| **REST (HTTPS)** | `https://mr-connection-mwc1f9igml1.messaging.solace.cloud:9443` |
| **MQTT (SSL)** | `ssl://mr-connection-mwc1f9igml1.messaging.solace.cloud:8883` |
| **MQTT (WSS)** | `wss://mr-connection-mwc1f9igml1.messaging.solace.cloud:8443` |
| **WebSocket** | `wss://mr-connection-mwc1f9igml1.messaging.solace.cloud:443` |
| **AMQP (SSL)** | `amqps://mr-connection-mwc1f9igml1.messaging.solace.cloud:5671` |
| **SMF (TLS)** | `tcps://mr-connection-mwc1f9igml1.messaging.solace.cloud:55443` |

**Password:** `<SOLACE_PASS>`

### Management
| Role | Username | Password |
|---|---|---|
| **Admin** | `roclace-cluster-admin` | `<SOLACE_ADMIN_PASS>` |
| **Viewer** | `roclace-cluster-view` | `<SOLACE_VIEW_PASS>` |
| **Manager** | `mission-control-manager` | `<SOLACE_MANAGER_PASS>` |

**SEMP API:** `https://mr-connection-mwc1f9igml1.messaging.solace.cloud:943/SEMP/v2/config`
**Web UI:** `https://mr-connection-mwc1f9igml1.messaging.solace.cloud:943`

---

## 📬 Queues Created (5)

| Queue | Type | Subscriptions | Purpose |
|---|---|---|---|
| `hermes/agent/orchestrator` | exclusive | `hermes/task/>`, `hermes/response/>` | Task routing & responses |
| `hermes/agent/ai-chat` | exclusive | — | AI chat agent tasks |
| `hermes/agent/tools` | exclusive | — | Tool execution tasks |
| `hermes/agent/memory` | exclusive | — | Memory/context tasks |
| `hermes/events` | non-exclusive | `hermes/>` | Event log (all events) |

---

## 🗺️ Topic Hierarchy

```
hermes/
├── task/
│   ├── ai-chat      → AI chat requests
│   ├── tools         → Tool execution
│   ├── memory        → Memory operations
│   └── crawl         → Web crawling
├── response/
│   ├── ai-chat      → AI responses
│   ├── tools         → Tool results
│   └── memory        → Memory results
├── event/
│   ├── user-input    → User messages
│   ├── agent-action  → Agent actions
│   └── system        → System events
└── test              → Test messages
```

---

## 🔗 Integrasi dengan RocSpace

```
User → CF Worker (gateway) → Solace REST API → Event Broker
                                                    │
                    ┌───────────────────────────────┼───────────────┐
                    ▼                               ▼               ▼
             orchestrator queue              ai-chat queue    tools queue
             (task decomposition)            (Groq/Gemini)    (ClawLink)
                    │
                    ▼
             hermes/events queue (audit log → MongoDB)
```

### Dari Cloudflare Worker:
```javascript
// Publish event ke Solace
await fetch('https://mr-connection-mwc1f9igml1.messaging.solace.cloud:9443/topic/hermes/task/ai-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(SOLACE_USER + ':' + SOLACE_PASS),
    'Solace-delivery-mode': 'persistent'
  },
  body: JSON.stringify({
    task: 'chat',
    model: 'groq/llama-3.3-70b',
    prompt: 'Hello!',
    requestId: crypto.randomUUID()
  })
});
```

---

## 🔑 API Token
```
SOLACE_TOKEN=eyJhbGciOiJSUzI1NiIs... (JWT, org: 3n3br39jdj4)
SOLACE_API=https://api.solace.cloud/api/v0
```

---

## ✅ Test Results
- ✅ REST publish → HTTP 200
- ✅ SEMP config API → working
- ✅ Queue creation → 5/5 success
- ✅ Topic subscriptions → 3/3 success
- ✅ Messages routed to queues correctly
