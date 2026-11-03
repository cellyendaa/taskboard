package services

import (
	"time"

	"taskboard/models"
	"taskboard/repositories"
)

const (
	maxSessionSeconds = 4 * 60 * 60 // satu sesi maksimal 4 jam
	dateLayout        = "2006-01-02"
)

type DayStat struct {
	Date      string `json:"date"`
	Seconds   int    `json:"seconds"`
	Completed int    `json:"completed"`
}

type FocusStats struct {
	TodaySeconds int       `json:"today_seconds"`
	WeekSeconds  int       `json:"week_seconds"`
	TotalSeconds int64     `json:"total_seconds"`
	Streak       int       `json:"streak"`
	Daily        []DayStat `json:"daily"`
}

type FocusService struct {
	focus *repositories.FocusRepository
	tasks *repositories.TaskRepository
}

func NewFocusService(f *repositories.FocusRepository, t *repositories.TaskRepository) *FocusService {
	return &FocusService{focus: f, tasks: t}
}

// Log mencatat satu sesi fokus dan mengembalikan task dengan total terbaru.
func (s *FocusService) Log(userID, taskID uint, seconds int) (*models.Task, error) {
	if seconds < 1 || seconds > maxSessionSeconds {
		return nil, ErrInvalidInput
	}
	if _, err := s.tasks.FindByIDForUser(taskID, userID); err != nil {
		return nil, mapNotFound(err)
	}
	if err := s.focus.Create(&models.FocusSession{UserID: userID, TaskID: taskID, Seconds: seconds}); err != nil {
		return nil, err
	}
	return s.tasks.FindByIDForUser(taskID, userID)
}

// Stats menghitung statistik per hari menurut zona waktu user (tz, misal "Asia/Jakarta").
// Hari dianggap aktif kalau ada sesi fokus ATAU ada task yang diselesaikan.
func (s *FocusService) Stats(userID uint, tz string) (*FocusStats, error) {
	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	startToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	since := startToday.AddDate(0, 0, -365)

	sessions, err := s.focus.FindSince(userID, since)
	if err != nil {
		return nil, err
	}
	completed, err := s.tasks.CompletedTimes(userID, since)
	if err != nil {
		return nil, err
	}
	total, err := s.focus.TotalSeconds(userID)
	if err != nil {
		return nil, err
	}

	focusByDay := map[string]int{}
	for _, ss := range sessions {
		focusByDay[ss.CreatedAt.In(loc).Format(dateLayout)] += ss.Seconds
	}
	doneByDay := map[string]int{}
	for _, c := range completed {
		doneByDay[c.In(loc).Format(dateLayout)]++
	}
	active := func(key string) bool { return focusByDay[key] > 0 || doneByDay[key] > 0 }

	// 7 hari terakhir, dari yang terlama sampai hari ini
	daily := make([]DayStat, 0, 7)
	week := 0
	for i := 6; i >= 0; i-- {
		key := startToday.AddDate(0, 0, -i).Format(dateLayout)
		daily = append(daily, DayStat{Date: key, Seconds: focusByDay[key], Completed: doneByDay[key]})
		week += focusByDay[key]
	}

	// Streak: hari aktif berturut-turut. Kalau hari ini belum aktif,
	// streak belum putus, jadi hitung mundur dari kemarin.
	streak := 0
	day := startToday
	if !active(day.Format(dateLayout)) {
		day = day.AddDate(0, 0, -1)
	}
	for active(day.Format(dateLayout)) {
		streak++
		day = day.AddDate(0, 0, -1)
	}

	return &FocusStats{
		TodaySeconds: focusByDay[startToday.Format(dateLayout)],
		WeekSeconds:  week,
		TotalSeconds: total,
		Streak:       streak,
		Daily:        daily,
	}, nil
}