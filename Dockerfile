# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

ENV GOPROXY=https://goproxy.cn,direct
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o ./bin/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o ./bin/match ./cmd/match
RUN CGO_ENABLED=0 GOOS=linux go build -o ./bin/miner ./cmd/miner
RUN CGO_ENABLED=0 GOOS=linux go build -o ./bin/admin ./cmd/admin

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/bin ./bin
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080 8081 8082 8083

CMD ["./bin/api"]
