package repositories

import (
	"gorm.io/gorm"

	"taskboard/models"
)

type TaskRepository struct{ db *gorm.DB }

func NewTaskRepository(db *gorm.DB) *TaskRepository { return &TaskRepository{db} }

func (r *TaskRepository) Create(t *models.Task) error {
	return r.db.Create(t).Error
}

func (r *TaskRepository) FindByProjectID(projectID uint) ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.Where("project_id = ?", projectID).Order("created_at ASC").Find(&tasks).Error
	return tasks, err
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