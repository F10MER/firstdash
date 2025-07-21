# Этап 1: Сборка приложения
FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем pnpm
RUN npm install -g pnpm

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости с помощью pnpm
RUN pnpm install --frozen-lockfile

# Копируем остальные файлы проекта
COPY . .

# Собираем проект
RUN pnpm run build

# Этап 2: Запуск приложения с помощью Caddy
FROM caddy:latest

WORKDIR /app

# Копируем собранные файлы из этапа сборки
COPY --from=builder /app/dist ./dist

# Копируем конфигурацию Caddy
COPY Caddyfile ./

# Запускаем Caddy
CMD ["caddy", "run", "--config", "/app/Caddyfile", "--adapter", "caddyfile"]
