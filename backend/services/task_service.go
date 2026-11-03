package services

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"taskboard/models"
	"taskboard/repositories"
)

type CreateTaskInput struct {
	ProjectID   uint    `json:"project_id" binding:"required"`
	Title       string  `json:"title" binding:"required,max=200"`
	Description string  `json:"description"`
	Status      string  `json:"status" binding:"omitempty,oneof=TODO IN_PROGRESS DONE"`
	Priority    string  `json:"priority" binding:"omitempty,oneof=LOW MEDIUM HIGH"`
	DueDate     *string `json:"due_date"` // format: YYYY-MM-DD
}

type UpdateTaskInput struct {
	Title       *string `json:"title" binding:"omitempty,max=200"`
	Description *string `json:"description"`
	Status      *string `json:"status" binding:"omitempty,oneof=TODO IN_PROGRESS DONE"`
	Priority    *string `json:"priority" binding:"omitempty,oneof=LOW MEDIUM HIGH"`
	DueDate     *string `json:"due_date"` // "" = hapus due date
	Position    *float64 `json:"position"`
}

type TaskService struct {
	tasks    *repositories.TaskRepository
	projects *repositories.ProjectRepository
}

func NewTaskService(t *repositories.TaskRepository, p *repositories.ProjectRepository) *TaskService {
	return &TaskService{tasks: t, projects: p}
}

func (s *TaskService) Create(userID uint, in CreateTaskInput) (*models.Task, error) {
	if _, err := s.projects.FindByIDAndUser(in.ProjectID, userID); err != nil {
		return nil, mapNotFound(err)
	}

	due, err := parseDate(in.DueDate)
	if err != nil {
		return nil, ErrInvalidInput
	}

	pos, err := s.tasks.NextPosition(in.ProjectID)
	if err != nil {
		return nil, err
	}

	t := &models.Task{
		ProjectID:   in.ProjectID,
		Title:       strings.TrimSpace(in.Title),
		Description: in.Description,
		Status:      defaultStr(in.Status, models.StatusTodo),
		Priority:    defaultStr(in.Priority, models.PriorityMedium),
		DueDate:     due,
	}
	if err := s.tasks.Create(t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TaskService) ListByProject(userID, projectID uint) ([]models.Task, error) {
	if _, err := s.projects.FindByIDAndUser(projectID, userID); err != nil {
		return nil, mapNotFound(err)
	}
	return s.tasks.FindByProjectID(projectID)
}

func (s *TaskService) Update(userID, taskID uint, in UpdateTaskInput) (*models.Task, error) {
	t, err := s.tasks.FindByIDForUser(taskID, userID)
	if err != nil {
		return nil, mapNotFound(err)
	}

	if in.Title != nil {
		t.Title = strings.TrimSpace(*in.Title)
	}
	if in.Description != nil {
		t.Description = *in.Description
	}
	if in.Status != nil {
		t.Status = *in.Status
	}
	if in.Priority != nil {
		t.Priority = *in.Priority
	}
	if in.DueDate != nil {
		due, err := parseDate(in.DueDate)
		if err != nil {
			return nil, ErrInvalidInput
		}
		t.DueDate = due
	}

	if in.Position != nil {
		t.Position = *in.Position
	}

	if err := s.tasks.Update(t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TaskService) Delete(userID, taskID uint) error {
	if _, err := s.tasks.FindByIDForUser(taskID, userID); err != nil {
		return mapNotFound(err)
	}
	return s.tasks.Delete(taskID)
}

// ---- helpers ----

func mapNotFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

func defaultStr(v, fallback string) string {
	if v == "" {
		return fallback
	}
	return v
}

func parseDate(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}