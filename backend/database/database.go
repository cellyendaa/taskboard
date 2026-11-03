package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"taskboard/models"
)

func Connect(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.Project{}, &models.Task{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}
		// Task lama belum punya posisi: pakai id sebagai urutan awal
	db.Exec("UPDATE tasks SET position = id WHERE position = 0")
	return db
}