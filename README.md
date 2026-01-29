**Frontend:** [https://cassadelle13.github.io/Corallum-Project/](https://cassadelle13.github.io/Corallum-Project/)

# 🏢 Corallum Enterprise - AI-Powered Workflow Automation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

Corallum Enterprise — это отказоустойчивая платформа для автоматизации бизнес-процессов, построенная на принципах **Durable Execution**, **Multi-tenant Isolation** и **Deterministic AI Orchestration**.

## 🏗️ Архитектурные принципы (Architectural Pillars)

Система спроектирована для работы в высоконагруженных Enterprise-средах, где надежность и безопасность данных являются приоритетом.

### 1. Надежность исполнения (Durable Execution)
В отличие от стандартных систем автоматизации, Corallum использует **Inngest** для управления жизненным циклом воркфлоу. Это гарантирует, что ни один процесс не будет потерян из-за сбоев сети или таймаутов LLM.
- **State Persistence**: Состояние каждого шага сохраняется, позволяя возобновлять выполнение с точки сбоя.
- **Exponential Backoff**: Автоматические повторные попытки для всех внешних интеграций.
- **См. подробнее**: [ADR-001: Workflow Reliability](ADR-001-Workflow-Reliability.md)

### 2. Безопасность и Изоляция (Enterprise Security)
- **Multi-tenancy**: Полная логическая изоляция данных на уровне базы данных и API-запросов.
- **Identity Management**: Поддержка протоколов SSO (SAML, OIDC) для бесшовной интеграции в корпоративную инфраструктуру.
- **RBAC**: Гранулярная система контроля доступа на основе ролей.

### 3. Интеллектуальная оркестрация (AI Engine)
- **RAG Integration**: Использование Retrieval-Augmented Generation для предоставления LLM актуального бизнес-контекста.
- **Hybrid LLM Strategy**: Возможность переключения между локальными моделями (Ollama) и облачными провайдерами (OpenAI) в зависимости от требований к конфиденциальности.

## 🛠️ Технологический стек

| Компонент | Технология |
| :--- | :--- |
| **Backend** | Node.js (Express), TypeScript |
| **Database** | PostgreSQL (Primary), Redis (Caching) |
| **Orchestration** | Inngest (Durable Workflows) |
| **AI Framework** | LangChain, Ollama SDK |
| **Infrastructure** | Docker, Kubernetes-ready |

## 📖 API Documentation (Core Endpoints)

### AI Workflow Generation
```bash
curl -X POST http://localhost:8003/api/v2/ai/generate-workflow \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Automate customer onboarding process",
    "businessContext": "SaaS company",
    "industry": "technology"
  }'
```

### Monitoring & Health
- **System Health**: `GET /health`
- **Performance Metrics**: `GET /api/v2/reliability/metrics`

## 📂 Документация

- [ADR-001: Workflow Reliability](ADR-001-Workflow-Reliability.md) — Обоснование выбора Inngest.
- `SECURITY.md` — Описание политик безопасности и обработки данных.

---
