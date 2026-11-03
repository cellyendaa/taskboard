package repositories

import (
	"gorm.io/gorm"

	"taskboard/models"
)

type ProjectRepository struct{ db *gorm.DB }

func NewProjectRepository(db *gorm.DB) *ProjectRepository { return &ProjectRepository{db} }

func (r *ProjectRepository) Create(p *models.Project) error {
	return r.db.Create(p).Error
}

func (r *ProjectRepository) FindByUserID(userID uint) ([]models.Project, error) {
	var projects []models.Project
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&projects).Error
	return projects, err
}

func (r *ProjectRepository) FindByIDAndUser(id, userID uint) (*models.Project, error) {
	var p models.Project
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}