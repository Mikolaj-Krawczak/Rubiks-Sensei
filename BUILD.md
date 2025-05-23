# Budowanie Aplikacji Rubik Sensei dla Windows

Ten plik zawiera instrukcje dotyczące budowania aplikacji Rubik Sensei jako standalone executable dla Windows.

## Wymagania systemowe

### Windows
- Windows 10 lub nowszy (64-bit)
- Python 3.11+
- Node.js 18+
- npm
- Git

## Automatyczne budowanie

### Windows
Uruchom skrypt batch w katalogu głównym:
```cmd
cd build-scripts
build.bat
```

Skrypt automatycznie:
1. Zainstaluje wszystkie wymagane zależności Python
2. Zainstaluje zależności Node.js
3. Zbuduje aplikację używając PyInstaller
4. Utworzy plik `dist\RubikSensei.exe`

## Ręczne budowanie

Jeśli chcesz zbudować aplikację ręcznie, wykonaj następujące kroki:

### 1. Przygotowanie środowiska

```cmd
# Klonuj repozytorium
git clone <repo-url>
cd Rubick-Sensei

# Utwórz środowisko wirtualne Python
python -m venv .venv
.venv\Scripts\activate.bat

# Zainstaluj zależności Python
pip install --upgrade pip
pip install -r backend\requirements.txt
pip install -r requirements-build.txt

# Zainstaluj zależności Node.js
npm install
```

### 2. Budowanie aplikacji

```cmd
# Wyczyść poprzednie buildy
if exist "dist" rmdir /s /q dist
if exist "build" rmdir /s /q build

# Zbuduj aplikację
pyinstaller --clean build-scripts\rubik-sensei.spec
```

### 3. Uruchomienie

Po zakończeniu budowania, plik wykonywalny znajdzie się w folderze `dist\`:
```cmd
dist\RubikSensei.exe
```

## Struktura plików

```
Rubick-Sensei/
├── build-scripts/
│   ├── build.bat              # Skrypt budowania dla Windows
│   ├── launcher.py            # Główny launcher aplikacji
│   ├── rubik-sensei.spec      # Konfiguracja PyInstaller
│   └── start-backend.bat      # Pomocniczy skrypt startowy backendu
├── backend/                   # Backend Flask
├── components/                # Komponenty frontendowe
├── pages/                     # Strony aplikacji
├── assets/                    # Zasoby (ikony, obrazy)
├── css/                       # Style CSS
├── scripts/                   # Skrypty JavaScript
├── main.js                    # Główny plik Electron
└── package.json              # Konfiguracja Node.js
```

## Rozwiązywanie problemów

### Błędy budowania

1. **Błąd: "Module not found"**
   - Upewnij się, że wszystkie zależności są zainstalowane
   - Sprawdź czy jesteś w aktywowanym środowisku wirtualnym

2. **Błąd: "electron.exe not found"**
   - Uruchom `npm install` aby zainstalować Electron
   - Sprawdź czy `node_modules/electron/dist/electron.exe` istnieje

3. **Błąd podczas uruchamiania exe**
   - Sprawdź logi w konsoli (ustaw `console=True` w rubik-sensei.spec)
   - Upewnij się, że wszystkie potrzebne pliki są w folderze `dist/`

### Testowanie lokalnie

Przed budowaniem exe, możesz przetestować aplikację lokalnie:

```cmd
# Uruchom backend
cd backend
python app.py

# W nowym terminalu uruchom frontend
npx electron .
```

## Tworzenie instalatora (opcjonalne)

Aby utworzyć installer dla Windows, możesz użyć narzędzi takich jak:
- NSIS (Nullsoft Scriptable Install System)
- Inno Setup
- WiX Toolset

Przykładowy skrypt NSIS można znajdować w folderze `installers/` (jeśli istnieje).

## GitHub Actions

Aplikacja jest automatycznie budowana dla Windows przy każdym push do głównej gałęzi za pomocą GitHub Actions. Zobacz `.github/workflows/build-releases.yml` dla szczegółów.

### Ręczne uruchomienie build w GitHub

1. Idź do zakładki "Actions" w repozytorium
2. Wybierz workflow "Build Windows Release"
3. Kliknij "Run workflow"
4. Wprowadź numer wersji
5. Kliknij "Run workflow"

### Pobieranie buildu z GitHub

1. Idź do zakładki "Releases"
2. Znajdź najnowszą wersję
3. Pobierz plik `RubikSensei-*-windows-x64.zip`
4. Rozpakuj i uruchom `RubikSensei.exe`

## Licencja

[Dodaj informacje o licencji]

## Kontakt

[Dodaj informacje kontaktowe]
