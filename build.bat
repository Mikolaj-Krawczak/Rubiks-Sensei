@echo off
setlocal enabledelayedexpansion

echo 🚀 Budowanie aplikacji Rubik Sensei do exe...

:: Sprawdź czy jesteśmy w odpowiednim katalogu
if not exist "launcher.py" (
    echo ❌ Błąd: Nie znaleziono launcher.py. Upewnij się że jesteś w katalogu głównym aplikacji.
    exit /b 1
)

echo 📦 Krok 1: Instalowanie zależności Python...
if not exist ".venv" (
    echo Tworzę środowisko wirtualne...
    python -m venv .venv
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
pip install -r requirements-build.txt

echo 📦 Krok 2: Instalowanie zależności Node.js...
if not exist "node_modules" (
    echo Instaluję pakiety npm...
    npm install
)

echo 🧹 Krok 3: Czyszczenie poprzednich buildów...
if exist "dist" rmdir /s /q dist
if exist "build" rmdir /s /q build

echo 🔨 Krok 4: Budowanie aplikacji z PyInstaller...
pyinstaller --clean rubik-sensei.spec

echo ✅ Budowanie zakończone!
echo 📁 Plik exe znajduje się w: dist\RubikSensei.exe

:: Sprawdź czy plik został utworzony
if exist "dist\RubikSensei.exe" (
    echo 🎉 Sukces! Aplikacja została zbudowana pomyślnie.
    echo 💡 Aby uruchomić: dist\RubikSensei.exe
) else (
    echo ❌ Błąd: Plik exe nie został utworzony.
    exit /b 1
) 