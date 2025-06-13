package main

import (
	"log"
	"os"

	"golang_saas/config"
	"golang_saas/graph"
	"golang_saas/middleware"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Initialize database
	config.InitDatabase()
	defer func() {
		if sqlDB, err := config.DB.DB(); err == nil {
			sqlDB.Close()
		}
	}()

	// Initialize Redis
	config.InitRedis()
	defer config.CloseRedis()

	// Run migrations based on command line argument
	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		if err := config.MigrateSystem(); err != nil {
			log.Fatal("System migration failed:", err)
		}
		log.Println("System migration completed successfully")
		return
	}

	// Create Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3001", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Tenant", "X-Tenant-Slug"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Authentication middleware
	r.Use(middleware.AuthMiddleware(config.DB))

	// GraphQL resolver
	resolver := &graph.Resolver{
		DB: config.DB,
	}

	// GraphQL handler
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	// GraphQL endpoints
	r.POST("/graphql", func(c *gin.Context) {
		srv.ServeHTTP(c.Writer, c.Request)
	})

	// GraphQL playground (development only)
	if gin.Mode() == gin.DebugMode {
		r.GET("/", func(c *gin.Context) {
			playground.Handler("GraphQL playground", "/graphql").ServeHTTP(c.Writer, c.Request)
		})
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("GraphQL server ready at http://localhost:%s/", port)
	if gin.Mode() == gin.DebugMode {
		log.Printf("GraphQL playground available at http://localhost:%s/", port)
	}

	r.Run(":" + port)
}
