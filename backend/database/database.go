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

	if err := db.AutoMigrate(&models.User{}, &models.Project{}, &models.Task{}, &models.FocusSession{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}

	// Task lama belum punya posisi: pakai id sebagai urutan awal
	db.Exec("UPDATE tasks SET position = id WHERE position = 0")
		// Task yang sudah Done sebelum fitur ini ada: pakai tanggal dibuat sebagai tanggal selesai
	db.Exec("UPDATE tasks SET completed_at = created_at WHERE status = 'DONE' AND completed_at IS NULL")

	return db
}