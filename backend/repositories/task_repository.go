package repositories

import (
	"gorm.io/gorm"

	"taskboard/models"
	"time"
)

type TaskRepository struct{ db *gorm.DB }

func NewTaskRepository(db *gorm.DB) *TaskRepository { return &TaskRepository{db} }

func (r *TaskRepository) Create(t *models.Task) error {
	return r.db.Create(t).Error
}

func (r *TaskRepository) FindByProjectID(projectID uint) ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.Where("project_id = ?", projectID).Order("position ASC, id ASC").Find(&tasks).Error
	return tasks, err
}

// NextPosition mengembalikan posisi untuk task baru (paling bawah).
func (r *TaskRepository) NextPosition(projectID uint) (float64, error) {
	var max float64
	err := r.db.Model(&models.Task{}).
		Where("project_id = ?", projectID).
		Select("COALESCE(MAX(position), 0)").
		Scan(&max).Error
	return max + 1, err
}

// FindByIDForUser memastikan task milik project yang dimiliki user tersebut.
func (r *TaskRepository) FindByIDForUser(id, userID uint) (*models.Task, error) {
	var t models.Task
	err := r.db.
		Joins("JOIN projects ON projects.id = tasks.project_id").
		Where("tasks.id = ? AND projects.user_id = ?", id, userID).
		First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TaskRepository) Update(t *models.Task) error {
	return r.db.Save(t).Error
}

func (r *TaskRepository) Delete(id uint) error {
	return r.db.Delete(&models.Task{}, id).Error
}
// CompletedTimes mengembalikan waktu selesai semua task Done milik user sejak 'since'.
func (r *TaskRepository) CompletedTimes(userID uint, since time.Time) ([]time.Time, error) {
	var times []time.Time
	err := r.db.Model(&models.Task{}).
		Joins("JOIN projects ON projects.id = tasks.project_id").
		Where("projects.user_id = ? AND tasks.status = ? AND tasks.completed_at >= ?", userID, models.StatusDone, since).
		Pluck("tasks.completed_at", &times).Error
	return times, err
}