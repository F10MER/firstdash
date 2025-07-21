    dockerfile
    # Используйте базовый образ Node.js для сборки
    FROM node:18-alpine AS builder

    WORKDIR /app

    COPY package.json pnpm-lock.yaml ./ # Или yarn.lock, package-lock.json

    RUN npm install --force # Или pnpm install --force, yarn install --force

    COPY . .

    RUN npm run build # Или pnpm run build, yarn build

    # Используйте образ Caddy для обслуживания статики
    FROM caddy:latest

    WORKDIR /app

    # Скопируйте собранные файлы из этапа builder
    COPY --from=builder /app/dist ./dist

    # Скопируйте Caddyfile
    COPY Caddyfile .

    # Укажите Caddy использовать Caddyfile
    CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
