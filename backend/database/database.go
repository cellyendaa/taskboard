package database

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"taskboard/models"
)

func Connect(path string) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.Project{}, &models.Task{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}
	return db
}