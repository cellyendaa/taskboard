package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"taskboard/services"
)

type ProjectController struct{ projects *services.ProjectService }

func NewProjectController(p *services.ProjectService) *ProjectController {
	return &ProjectController{p}
}

type createProjectRequest struct {
	Title       string `json:"title" binding:"required,max=150"`
	Description string `json:"description"`
}

func (ctl *ProjectController) List(c *gin.Context) {
	projects, err := ctl.projects.List(currentUserID(c))
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, projects)
}

func (ctl *ProjectController) Create(c *gin.Context) {
	var req createProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p, err := ctl.projects.Create(currentUserID(c), req.Title, req.Description)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, p)
}