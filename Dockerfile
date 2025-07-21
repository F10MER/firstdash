# Используйте базовый образ Node.js для сборки
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Рекомендуется использовать 'npm ci' для более надежных сборок
RUN npm ci

COPY . .

RUN npm run build

# Используйте образ Caddy для обслуживания статики
FROM caddy:latest

# Установите рабочий каталог
WORKDIR /app

# Скопируйте собранные файлы из этапа builder
COPY --from=builder /app/dist ./dist

# Скопируйте Caddyfile
COPY Caddyfile ./

# Укажите Caddy использовать Caddyfile
CMD ["caddy", "run", "--config", "/app/Caddyfile", "--adapter", "caddyfile"]
