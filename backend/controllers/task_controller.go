package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"taskboard/services"
)

type TaskController struct{ tasks *services.TaskService }

func NewTaskController(t *services.TaskService) *TaskController { return &TaskController{t} }

func (ctl *TaskController) List(c *gin.Context) {
	projectID, err := strconv.ParseUint(c.Query("project_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project_id is required"})
		return
	}
	tasks, err := ctl.tasks.ListByProject(currentUserID(c), uint(projectID))
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, tasks)
}

func (ctl *TaskController) Create(c *gin.Context) {
	var in services.CreateTaskInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	task, err := ctl.tasks.Create(currentUserID(c), in)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, task)
}

func (ctl *TaskController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}
	var in services.UpdateTaskInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	task, err := ctl.tasks.Update(currentUserID(c), uint(id), in)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, task)
}

func (ctl *TaskController) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}
	if err := ctl.tasks.Delete(currentUserID(c), uint(id)); err != nil {
		handleError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}