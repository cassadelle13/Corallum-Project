FROM node:18-alpine

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка TypeScript
RUN npm run build

# Открытие порта
EXPOSE 8000

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=8000

# Запуск приложения
CMD ["npm", "start"]
