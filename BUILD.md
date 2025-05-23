# Instrukcja budowania aplikacji Rubik's Sensei

## Struktura plików do budowania

Po oczyszczeniu projektu, kluczowe pliki do budowania aplikacji EXE znajdują się w głównym katalogu:

### Pliki kluczowe:
- `launcher.py` - Główny punkt wejścia aplikacji (uruchamia Flask w wątku + Electron)
- `rubik-sensei.spec` - Specyfikacja PyInstaller z konfiguracją pakowania
- `build.bat` - Skrypt budowania dla Windows
- `requirements-build.txt` - Zależności potrzebne do budowania

### Architektura:
```
RubikSensei.exe
├── Backend Flask (wątek w tym samym procesie)
│   ├── SQLAlchemy + SQLite
│   ├── API endpoints  
│   └── Health check (/health)
└── Frontend Electron (osobny proces)
    ├── Main window
    ├── HTML/CSS/JS z katalogów: pages/, components/, assets/, css/
    └── Komunikacja z backend przez HTTP
```

## Instrukcje budowania

### Wymagania:
- Python 3.13+ z venv
- Node.js z npm
- PyInstaller
- Wszystkie zależności z `backend/requirements.txt` i `requirements-build.txt`

### Proces budowania:

1. **Automatyczne budowanie:**
   ```bash
   .\build.bat
   ```

2. **Ręczne budowanie:**
   ```bash
   # Aktywuj środowisko wirtualne
   .\.venv\Scripts\activate.bat
   
   # Zainstaluj zależności
   pip install -r backend\requirements.txt
   pip install -r requirements-build.txt
   npm install
   
   # Zbuduj aplikację
   pyinstaller --clean rubik-sensei.spec
   ```

### Wynik:
- Plik `dist/RubikSensei.exe` - Gotowa aplikacja do dystrybucji
- Log budowania w konsoli
- Log działania aplikacji w `dist/rubik-sensei.log`

## Rozwiązane problemy:

1. **Problem rekurencji** - Backend uruchamiany w wątku zamiast osobnego procesu
2. **Brakujące moduły SQLAlchemy** - Dodane do hidden_imports w .spec
3. **Niepełne pliki Electron** - Dołączany cały katalog node_modules/electron
4. **Brak logowania** - Szczegółowe logi do pliku i konsoli

## Struktura spakowanej aplikacji:

PyInstaller tworzy tymczasowy katalog (np. `_MEI123456`) z następującą strukturą:
```
_MEI123456/
├── backend/ (wszystkie pliki Python backendu)
├── pages/ (strony HTML)
├── components/ (komponenty JS)
├── assets/ (zasoby)
├── css/ (style)
├── node_modules/electron/ (kompletny Electron)
├── main.js (główny plik Electron)
└── package.json (konfiguracja npm)
```

## Testowanie:

Po zbudowaniu, aplikacja powinna:
1. Uruchomić się z podwójnego kliknięcia lub z konsoli
2. Pokazać logi uruchamiania w konsoli
3. Uruchomić backend Flask na porcie 5000
4. Uruchomić okno Electron z interfejsem użytkownika
5. Zapisać szczegółowe logi do `rubik-sensei.log`

Jeśli występują problemy, sprawdź plik `rubik-sensei.log` w tym samym katalogu co EXE.

## Licencja

[Dodaj informacje o licencji]

## Kontakt

[Dodaj informacje kontaktowe]
