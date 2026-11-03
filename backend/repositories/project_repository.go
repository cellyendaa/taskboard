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

func (r *ProjectRepository) Update(p *models.Project) error {
	return r.db.Save(p).Error
}

// Delete menghapus project beserta semua task-nya dalam satu transaksi.
func (r *ProjectRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("project_id = ?", id).Delete(&models.Task{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Project{}, id).Error
	})
}