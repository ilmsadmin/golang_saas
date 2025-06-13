package config

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

var RedisClient *redis.Client

func InitRedis() {
	addr := fmt.Sprintf("%s:%s", AppConfig.RedisHost, AppConfig.RedisPort)
	
	RedisClient = redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     AppConfig.RedisPassword,
		DB:           0, // default DB
		DialTimeout:  10 * time.Second,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		PoolSize:     10,
		PoolTimeout:  30 * time.Second,
	})

	// Test connection
	ctx := context.Background()
	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v. Continuing without Redis cache.", err)
		RedisClient = nil
		return
	}

	log.Println("Redis connection established")
}

func CloseRedis() {
	if RedisClient != nil {
		RedisClient.Close()
	}
}