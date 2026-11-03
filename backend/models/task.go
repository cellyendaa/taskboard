package models

import "time"

const (
	StatusTodo       = "TODO"
	StatusInProgress = "IN_PROGRESS"
	StatusDone       = "DONE"

	PriorityLow    = "LOW"
	PriorityMedium = "MEDIUM"
	PriorityHigh   = "HIGH"
)

type Task struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	ProjectID   uint       `gorm:"index;not null" json:"project_id"`
	Title       string     `gorm:"not null" json:"title"`
	Description string     `json:"description"`
	Status      string     `gorm:"not null;default:TODO" json:"status"`
	Priority    string     `gorm:"not null;default:MEDIUM" json:"priority"`
	Position    float64    `gorm:"not null;default:0" json:"position"`
	DueDate     *time.Time `json:"due_date"`
	CreatedAt   time.Time  `json:"created_at"`
}