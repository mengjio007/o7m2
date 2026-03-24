# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN echo "VITE_API_URL=/api" > .env && \
    echo "VITE_MINER_URL=/api/mining" >> .env && \
    echo "VITE_WS_URL=ws://localhost:8080" >> .env

RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
