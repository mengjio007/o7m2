.PHONY: all build run clean dev docker-up docker-down

# Build all services
all: build

# Build all Go binaries
build:
	@echo "Building all services..."
	go build -o bin/api ./cmd/api
	go build -o bin/match ./cmd/match
	go build -o bin/miner ./cmd/miner
	go build -o bin/admin ./cmd/admin

# Run all services locally
run-api:
	go run ./cmd/api

run-match:
	go run ./cmd/match

run-miner:
	go run ./cmd/miner

run-admin:
	go run ./cmd/admin

# Development with docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

# Clean build artifacts
clean:
	rm -rf bin/

# Initialize database
db-init:
	mysql -u root -p < migrations/001_init.sql

# Go mod tidy
tidy:
	go mod tidy

# Frontend
frontend-install:
	cd web/trading && npm install
	cd web/admin && npm install

frontend-dev:
	cd web/trading && npm run dev

frontend-build:
	cd web/trading && npm run build
	cd web/admin && npm run build

# Help
help:
	@echo "Available commands:"
	@echo "  make build          - Build all Go services"
	@echo "  make run-api        - Run API service"
	@echo "  make run-match      - Run matching engine"
	@echo "  make run-miner      - Run mining service"
	@echo "  make run-admin      - Run admin service"
	@echo "  make docker-up      - Start all services with Docker"
	@echo "  make docker-down    - Stop all Docker services"
	@echo "  make db-init        - Initialize database"
	@echo "  make tidy           - Run go mod tidy"
	@echo "  make frontend-dev   - Start frontend dev server"
	@echo "  make clean          - Clean build artifacts"
