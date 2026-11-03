package repositories

import (
	"time"

	"gorm.io/gorm"

	"taskboard/models"
)

type FocusRepository struct{ db *gorm.DB }

func NewFocusRepository(db *gorm.DB) *FocusRepository { return &FocusRepository{db} }

// Create menyimpan sesi dan menambah total fokus task dalam SATU transaksi.
// Penambahan dilakukan di level SQL (focus_seconds + N), jadi aman dari race condition.
func (r *FocusRepository) Create(s *models.FocusSession) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(s).Error; err != nil {
			return err
		}
		return tx.Model(&models.Task{}).
			Where("id = ?", s.TaskID).
			UpdateColumn("focus_seconds", gorm.Expr("focus_seconds + ?", s.Seconds)).Error
	})
}

func (r *FocusRepository) FindSince(userID uint, since time.Time) ([]models.FocusSession, error) {
	var list []models.FocusSession
	err := r.db.Where("user_id = ? AND created_at >= ?", userID, since).Find(&list).Error
	return list, err
}

func (r *FocusRepository) TotalSeconds(userID uint) (int64, error) {
	var total int64
	err := r.db.Model(&models.FocusSession{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(seconds), 0)").
		Scan(&total).Error
	return total, err
}