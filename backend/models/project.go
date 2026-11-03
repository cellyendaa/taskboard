package models

import "time"

type Project struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index;not null" json:"user_id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}