package repositories

import (
	"gorm.io/gorm"

	"taskboard/models"
)

type UserRepository struct{ db *gorm.DB }

func NewUserRepository(db *gorm.DB) *UserRepository { return &UserRepository{db} }

func (r *UserRepository) Create(u *models.User) error {
	return r.db.Create(u).Error
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var u models.User
	if err := r.db.Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}