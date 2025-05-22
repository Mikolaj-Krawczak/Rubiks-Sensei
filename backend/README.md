# Backend Rubik's Sensei

Prosty backend w Pythonie (Flask) do obsługi aplikacji Rubik's Sensei.

## Struktura bazy danych

Backend zawiera następujące modele:
- **Kostki** - przechowuje informacje o różnych typach kostek (2x2, 3x3, 4x4, Pyraminx)
- **Algorytmy** - przechowuje algorytmy do rozwiązywania kostek
- **Użytkownicy** - przechowuje dane użytkowników
- **Ułożenia** - przechowuje informacje o czasach ułożeń przez użytkowników

## Instalacja

1. Upewnij się, że masz zainstalowanego Pythona 3.6+ 
2. Zainstaluj zależności:

```bash
pip install -r backend/requirements.txt
```

## Uruchomienie

Aby uruchomić backend, wykonaj komendę:

```bash
cd backend
python run.py
```

Backend będzie dostępny pod adresem: http://localhost:5000

## Endpointy API

### Kostki
- `GET /api/kostki` - pobierz wszystkie kostki
- `GET /api/kostki/<id>` - pobierz kostkę o określonym ID
- `POST /api/kostki` - dodaj nową kostkę

### Algorytmy
- `GET /api/algorytmy` - pobierz wszystkie algorytmy
- `GET /api/algorytmy?kostka_id=<id>` - pobierz algorytmy dla określonej kostki
- `GET /api/algorytmy/<id>` - pobierz algorytm o określonym ID
- `POST /api/algorytmy` - dodaj nowy algorytm

### Użytkownicy
- `GET /api/uzytkownicy` - pobierz wszystkich użytkowników
- `GET /api/uzytkownicy/<id>` - pobierz użytkownika o określonym ID
- `POST /api/uzytkownicy` - dodaj nowego użytkownika

### Ułożenia
- `GET /api/ulozenia` - pobierz wszystkie ułożenia
- `GET /api/ulozenia?uzytkownik_id=<id>` - pobierz ułożenia określonego użytkownika
- `GET /api/ulozenia?kostka_id=<id>` - pobierz ułożenia dla określonej kostki
- `POST /api/ulozenia` - dodaj nowe ułożenie 