FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN echo "VITE_API_URL=http://api:8080" > .env && \
    echo "VITE_MINER_URL=http://miner:8082" >> .env && \
    echo "VITE_WS_URL=ws://api:8080" >> .env

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
