package models

import "time"

type FocusSession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	TaskID    uint      `gorm:"index;not null" json:"task_id"`
	Seconds   int       `gorm:"not null" json:"seconds"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}