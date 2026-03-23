package main

import (
	"log"
	"net"

	"google.golang.org/grpc"

	"o7m2/internal/engine"
	"o7m2/pkg/config"
)

func main() {
	cfg := config.Load()

	// Initialize matching engine
	eng := engine.NewEngine()

	// TODO: Load characters from database
	// For now, add some demo characters
	eng.AddCharacter("char001")
	eng.AddCharacter("char002")
	eng.AddCharacter("char003")

	// Create gRPC server
	grpcServer := grpc.NewServer()
	// TODO: Register MatchServiceServer

	// Start listening
	lis, err := net.Listen("tcp", ":"+cfg.Server.MatchPort)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	log.Printf("Match engine starting on port %s", cfg.Server.MatchPort)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
