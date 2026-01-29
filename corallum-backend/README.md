# Corallum Backend

AI-powered workflow automation platform backend.

## 🚀 Особенности

- **🤖 AI Agent** - Создание workflow по текстовому описанию
- **⚡ Workflow Engine** - Выполнение с AI-оптимизацией
- **🔌 Node System** - Расширяемая система узлов
- **🌐 Real-time Events** - WebSocket обновления
- **📊 Analytics** - Анализ производительности
- **🔧 Auto-fixes** - AI-помощь с ошибками

## 📁 Структура проекта

```
corallum-backend/
├── src/
│   ├── api/              # API эндпоинты
│   ├── core/             # Ядро системы
│   │   ├── workflow/   # Workflow engine
│   │   ├── execution/   # Выполнение
│   │   └── nodes/      # Реестр узлов
│   ├── ai/               # AI агент
│   │   ├── agent/      # Основной AI агент
│   │   ├── generation/  # Генерация кода
│   │   └── optimization/ # Оптимизация
│   ├── integrations/     # Интеграции
│   ├── events/           # Система событий
│   ├── storage/          # Хранение данных
│   └── types/           # TypeScript типы
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🛠️ Установка и запуск

### Требования
- Node.js 18+
- npm или yarn
- Docker (опционально)
- OpenAI API ключ (для AI функций)

### Быстрый старт

1. **Клонирование и установка:**
```bash
git clone <repository-url>
cd corallum-backend
npm install
```

2. **Настройка переменных окружения:**
```bash
# Создать .env файл
cp .env.example .env

# Редактировать .env
OPENAI_API_KEY=your-openai-api-key
PORT=8000
NODE_ENV=development
```

3. **Запуск в режиме разработки:**
```bash
npm run dev
```

4. **Запуск через Docker:**
```bash
# Только backend
docker-compose up corallum-backend

# С базой данных (production)
docker-compose --profile production up
```

## 📚 API Эндпоинты

### Создание workflow из текста
```bash
curl -X POST http://localhost:8000/api/v1/workflows/create-from-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Когда приходит новое письмо в Gmail, создай задачу в Trello"}'
```

### Выполнение workflow
```bash
curl -X POST http://localhost:8000/api/v1/workflows/workflow-123/execute \
  -H "Content-Type: application/json" \
  -d '{"triggerData": {"email": "test@example.com"}}'
```

### Оптимизация workflow
```bash
curl -X POST http://localhost:8000/api/v1/workflows/workflow-123/optimize \
  -H "Content-Type: application/json"
```

### Получение статуса выполнения
```bash
curl http://localhost:8000/api/v1/executions/exec-456
```

## 🤖 AI Возможности

### Создание workflow по запросу
- Естественный язык → структура workflow
- Автоматический подбор узлов
- Генерация связей
- Создание кастомных узлов

### AI-оптимизация
- Анализ производительности
- Выявление узких мест
- Предложения по улучшению
- Автоматическое исправление

### Real-time помощь
- AI-подсказки при ошибках
- Автоматические исправления
- Альтернативные решения
- Примеры кода

## 🔌 Расширяемость

### Создание кастомных узлов
```typescript
import { INode } from '../types';

export class CustomNode implements INode {
    type = 'custom_integration';
    displayName = 'My Custom Integration';
    description = 'Custom integration with external API';
    icon = 'custom';
    category = 'integration';
    
    async execute(data: any): Promise<any> {
        // Ваша логика
        return { result: 'Custom execution result' };
    }
}
```

### Регистрация узла
```typescript
import { NodeRegistry } from '../core/nodes/NodeRegistry';

const registry = new NodeRegistry();
registry.registerNode(new CustomNode());
```

## 📊 Мониторинг

### Health check
```bash
curl http://localhost:8000/health
```

### Логи
```bash
# Просмотр логов выполнения
docker-compose logs corallum-backend

# В реальном времени через WebSocket
ws://localhost:8000
```

## 🐳 Docker Production

### Сборка образа
```bash
docker build -t corallum-backend .
```

### Запуск с базой данных
```bash
docker-compose --profile production up -d
```

### Переменные окружения для production
- `OPENAI_API_KEY` - OpenAI API ключ
- `DATABASE_URL` - URL базы данных PostgreSQL
- `REDIS_URL` - URL Redis для кэша
- `NODE_ENV` - Установить в 'production'

## 🧪 Разработка

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка TypeScript
```bash
npm run build
```

### Запуск тестов
```bash
npm test
```

### Линтинг
```bash
npm run lint
```

## 🔧 Конфигурация

### TypeScript (tsconfig.json)
- Строгая типизация
- ES2020 target
- CommonJS modules
- Source maps

### Пакеты (package.json)
- Express.js для API
- TypeScript для типизации
- Jest для тестов
- Nodemon для разработки

## 📝 Лицензия

MIT License - можно использовать в коммерческих продуктах.

## 🤝 Поддержка

Для вопросов и поддержки:
- Создайте Issue в репозитории
- Смотрите документацию API
- Изучайте примеры интеграций

---

**Corallum Backend** - умная автоматизация с AI-суперсилой! 🚀
