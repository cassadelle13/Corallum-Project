# 🏢 Corallum Enterprise - AI-Powered Workflow Automation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

Enterprise-grade workflow automation platform with multi-tenant architecture, SSO authentication, RBAC, AI-powered workflow generation, and 99.9% uptime guarantee.

## ✨ Key Features

### 🏢 Enterprise Architecture
- **Multi-tenant**: Complete isolation between organizations
- **SSO Authentication**: SAML, OIDC, OAuth2 support
- **Role-Based Access Control (RBAC)**: Granular permissions
- **Audit Logging**: Complete activity tracking
- **Enterprise Security**: SOC2, GDPR compliant

### 🤖 AI-Powered Workflows
- **LangChain Integration**: Advanced AI capabilities
- **Local LLM Support**: Ollama, Llama2, Mistral
- **RAG Knowledge Base**: Business context awareness
- **Smart Generation**: Context-aware workflow creation
- **Continuous Learning**: Improves over time

### ⚡ Production Reliability
- **Inngest Integration**: 99.9% uptime guarantee
- **Durable Execution**: Automatic recovery from failures
- **Retry Mechanism**: Exponential backoff
- **Real-time Monitoring**: Performance metrics
- **Scalable Architecture**: Horizontal scaling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/corallum/enterprise.git
cd corallum-enterprise
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start with Docker Compose**
```bash
docker-compose up -d
```

Or start manually:
```bash
npm run build
npm start
```

5. **Access the platform**
- Enterprise API: http://localhost:8003
- Health Check: http://localhost:8003/health
- Grafana Dashboard: http://localhost:3001

## 📖 API Documentation

### Authentication

#### Login with Email/Password
```bash
curl -X POST http://localhost:8003/api/v2/enterprise/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: your-tenant" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

#### SSO Authentication
```bash
curl -X POST http://localhost:8003/api/v2/enterprise/auth/sso/saml \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: your-tenant" \
  -d '{
    "ssoData": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    }
  }'
```

### AI Workflow Generation

#### Generate Workflow with Business Context
```bash
curl -X POST http://localhost:8003/api/v2/ai/generate-workflow \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Automate customer onboarding process",
    "businessContext": "SaaS company with 1000+ customers",
    "industry": "technology",
    "constraints": {
      "budget": "under $5000",
      "timeline": "2 weeks"
    }
  }'
```

#### Add Knowledge to RAG System
```bash
curl -X POST http://localhost:8003/api/v2/ai/knowledge/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "ecommerce",
    "content": "Our ecommerce process includes order validation, payment processing, inventory updates, and shipping notifications...",
    "metadata": {
      "source": "internal-docs",
      "version": "1.0"
    }
  }'
```

### Reliable Workflow Execution

#### Start Workflow with Reliability Guarantees
```bash
curl -X POST http://localhost:8003/api/v2/reliability/execute-workflow \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "customer-onboarding",
    "workflowDefinition": {
      "nodes": [...],
      "edges": [...]
    },
    "input": {
      "customerId": "12345",
      "plan": "premium"
    }
  }'
```

#### Monitor Execution Status
```bash
curl -X GET http://localhost:8003/api/v2/reliability/executions/exec_123456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Enterprise      │    │   External      │
│   (React)       │◄──►│   Backend        │◄──►│   Services      │
│                 │    │  (Express.js)    │    │   (APIs, DB)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼──┐ ┌────▼────┐ ┌──▼──────┐
            │  AI      │ │Inngest  │ │PostgreSQL│
            │LangChain │ │Reliability│ │Database │
            └──────────┘ └─────────┘ └─────────┘
                    │         │         │
            ┌───────▼──┐ ┌────▼────┐ ┌──▼──────┐
            │  Ollama  │ │  Redis  │ │  SSO    │
            │Local LLM │ │  Cache  │ │Providers │
            └──────────┘ └─────────┘ └─────────┘
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8003` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_NAME` | Database name | `corallum_enterprise` |
| `JWT_SECRET` | JWT signing key | - |
| `AI_PROVIDER` | AI provider | `ollama` |
| `AI_MODEL` | AI model | `llama2` |
| `RAG_ENABLED` | Enable RAG | `true` |
| `INNGEST_API_KEY` | Inngest API key | - |

### Multi-tenant Setup

1. **Create a tenant**
```bash
curl -X POST http://localhost:8003/api/v2/enterprise/tenants \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme",
    "settings": {
      "maxUsers": 100,
      "features": ["ai-workflows", "sso"]
    }
  }'
```

2. **Configure SSO**
```bash
curl -X POST http://localhost:8003/api/v2/enterprise/sso/configure \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "saml",
    "config": {
      "idpUrl": "https://your-idp.com/saml",
      "certificate": "-----BEGIN CERTIFICATE-----..."
    },
    "enabled": true
  }'
```

## 📊 Monitoring & Analytics

### Health Check
```bash
curl http://localhost:8003/health
```

### Metrics
```bash
curl -X GET http://localhost:8003/api/v2/reliability/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Performance Analytics
```bash
curl -X GET http://localhost:8003/api/v2/reliability/analytics/performance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔒 Security

### Authentication
- JWT-based authentication
- SSO integration (SAML, OIDC)
- Multi-factor authentication support

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Tenant isolation

### Data Protection
- Encryption at rest and in transit
- GDPR compliance
- Audit logging

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

### Cloud Deployment
- AWS: ECS, RDS, ElastiCache
- Google Cloud: GKE, Cloud SQL, Memorystore
- Azure: AKS, Azure Database, Redis Cache

## 📈 Scaling

### Horizontal Scaling
- Load balancer configuration
- Database read replicas
- Redis clustering

### Performance Optimization
- Connection pooling
- Caching strategies
- CDN integration

## 🛠️ Development

### Local Development
```bash
npm run dev
```

### Testing
```bash
npm test
npm run test:watch
```

### Code Quality
```bash
npm run lint
npm run lint:fix
```

## 📚 Documentation

- [API Reference](./docs/api.md)
- [Architecture Guide](./docs/architecture.md)
- [Security Guide](./docs/security.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: enterprise@corallum.com
- 💬 Discord: [Corallum Community](https://discord.gg/corallum)
- 📖 Documentation: [docs.corallum.com](https://docs.corallum.com)

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Advanced AI models
- [ ] Multi-cloud deployment
- [ ] Advanced integrations (Salesforce, SAP, etc.)

---

**Built with ❤️ by the Corallum Enterprise Team**
