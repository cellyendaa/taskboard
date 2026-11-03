package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"taskboard/services"
)

type FocusController struct{ focus *services.FocusService }

func NewFocusController(f *services.FocusService) *FocusController { return &FocusController{f} }

type logFocusRequest struct {
	TaskID  uint `json:"task_id" binding:"required"`
	Seconds int  `json:"seconds" binding:"required"`
}

func (ctl *FocusController) Create(c *gin.Context) {
	var req logFocusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	task, err := ctl.focus.Log(currentUserID(c), req.TaskID, req.Seconds)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, task)
}

func (ctl *FocusController) Stats(c *gin.Context) {
	stats, err := ctl.focus.Stats(currentUserID(c), c.Query("tz"))
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, stats)
}