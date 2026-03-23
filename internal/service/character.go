package service

import (
	"o7m2/internal/domain"
	"o7m2/internal/repository/mysql"
)

type CharacterService struct {
	charRepo *mysql.CharacterRepository
}

func NewCharacterService(charRepo *mysql.CharacterRepository) *CharacterService {
	return &CharacterService{charRepo: charRepo}
}

func (s *CharacterService) List(category, status string) ([]*domain.Character, error) {
	return s.charRepo.FindAll(category, status)
}

func (s *CharacterService) GetByID(id string) (*domain.Character, error) {
	return s.charRepo.FindByID(id)
}

func (s *CharacterService) Create(char *domain.Character) error {
	return s.charRepo.Create(char)
}

func (s *CharacterService) Update(char *domain.Character) error {
	return s.charRepo.Update(char)
}

func (s *CharacterService) Delete(id string) error {
	return s.charRepo.Delete(id)
}
