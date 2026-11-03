package main

import (
	"log"

	"taskboard/config"
	"taskboard/database"
	"taskboard/routes"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg.DBPath)
	r := routes.Setup(cfg, db)

	log.Printf("server running on :%s", cfg.Port)
	log.Fatal(r.Run(":" + cfg.Port))
}