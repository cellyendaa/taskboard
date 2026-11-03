package services

import (
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"taskboard/models"
	"taskboard/repositories"
	"taskboard/utils"
)

type AuthService struct {
	users     *repositories.UserRepository
	jwtSecret string
}

func NewAuthService(users *repositories.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{users: users, jwtSecret: jwtSecret}
}

func (s *AuthService) Register(name, email, password string) (*models.User, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	if _, err := s.users.FindByEmail(email); err == nil {
		return nil, "", ErrEmailTaken
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, "", err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	user := &models.User{Name: strings.TrimSpace(name), Email: email, PasswordHash: string(hash)}
	if err := s.users.Create(user); err != nil {
		return nil, "", err
	}

	token, err := utils.GenerateToken(user.ID, s.jwtSecret)
	return user, token, err
}

func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	user, err := s.users.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	token, err := utils.GenerateToken(user.ID, s.jwtSecret)
	return user, token, err
}