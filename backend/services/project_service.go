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

func (s *ProjectService) Update(userID, id uint, title, description *string) (*models.Project, error) {
	p, err := s.projects.FindByIDAndUser(id, userID)
	if err != nil {
		return nil, mapNotFound(err)
	}
	if title != nil {
		t := strings.TrimSpace(*title)
		if t == "" {
			return nil, ErrInvalidInput
		}
		p.Title = t
	}
	if description != nil {
		p.Description = *description
	}
	if err := s.projects.Update(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) Delete(userID, id uint) error {
	if _, err := s.projects.FindByIDAndUser(id, userID); err != nil {
		return mapNotFound(err)
	}
	return s.projects.Delete(id)
}