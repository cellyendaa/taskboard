package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"taskboard/services"
)

func currentUserID(c *gin.Context) uint {
	return c.GetUint("userID")
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrEmailTaken):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	case errors.Is(err, services.ErrInvalidCredentials):
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
	case errors.Is(err, services.ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, services.ErrInvalidInput):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
	}
}