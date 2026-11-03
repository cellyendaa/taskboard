package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"taskboard/config"
	"taskboard/controllers"
	"taskboard/middlewares"
	"taskboard/repositories"
	"taskboard/services"
)

func Setup(cfg config.Config, db *gorm.DB) *gin.Engine {
	// Dependency wiring (manual DI)
	userRepo := repositories.NewUserRepository(db)
	projectRepo := repositories.NewProjectRepository(db)
	taskRepo := repositories.NewTaskRepository(db)

	authSvc := services.NewAuthService(userRepo, cfg.JWTSecret)
	projectSvc := services.NewProjectService(projectRepo)
	taskSvc := services.NewTaskService(taskRepo, projectRepo)

	authCtl := controllers.NewAuthController(authSvc)
	projectCtl := controllers.NewProjectController(projectSvc)
	taskCtl := controllers.NewTaskController(taskSvc)

	r := gin.Default()
	r.Use(middlewares.CORS(cfg.AllowedOrigin))

	api := r.Group("/api")
	api.POST("/register", authCtl.Register)
	api.POST("/login", authCtl.Login)

	protected := api.Group("")
	protected.Use(middlewares.AuthRequired(cfg.JWTSecret))
	{
		protected.GET("/projects", projectCtl.List)
		protected.POST("/projects", projectCtl.Create)
		protected.PATCH("/projects/:id", projectCtl.Update)   // tambahkan
		protected.DELETE("/projects/:id", projectCtl.Delete)  // tambahkan
		protected.GET("/tasks", taskCtl.List)
		protected.POST("/tasks", taskCtl.Create)
		protected.PATCH("/tasks/:id", taskCtl.Update)
		protected.DELETE("/tasks/:id", taskCtl.Delete)
	}

	return r
}