FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN echo "VITE_API_URL=/api" > .env && \
    echo "VITE_MINER_URL=/api/mining" >> .env && \
    echo "VITE_WS_URL=ws://localhost:8080" >> .env

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
