package services

import (
	"strings"

	"taskboard/models"
	"taskboard/repositories"
)

type ProjectService struct {
	projects *repositories.ProjectRepository
}

func NewProjectService(p *repositories.ProjectRepository) *ProjectService {
	return &ProjectService{projects: p}
}

func (s *ProjectService) Create(userID uint, title, description string) (*models.Project, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, ErrInvalidInput
	}
	p := &models.Project{UserID: userID, Title: title, Description: description}
	if err := s.projects.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) List(userID uint) ([]models.Project, error) {
	return s.projects.FindByUserID(userID)
}