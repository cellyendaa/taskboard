package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"taskboard/services"
	
	"strconv"
)

type updateProjectRequest struct {
	Title       *string `json:"title" binding:"omitempty,max=150"`
	Description *string `json:"description"`
}

func (ctl *ProjectController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}
	var req updateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p, err := ctl.projects.Update(currentUserID(c), uint(id), req.Title, req.Description)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, p)
}

func (ctl *ProjectController) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}
	if err := ctl.projects.Delete(currentUserID(c), uint(id)); err != nil {
		handleError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

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