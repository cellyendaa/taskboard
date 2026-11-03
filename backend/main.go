package main

import (
	"log"
	_ "time/tzdata" // data zona waktu bawaan, supaya LoadLocation("Asia/Jakarta") jalan di Windows

	"taskboard/config"
	"taskboard/database"
	"taskboard/routes"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg.DatabaseURL)
	r := routes.Setup(cfg, db)

	log.Printf("server running on :%s", cfg.Port)
	log.Fatal(r.Run(":" + cfg.Port))
}