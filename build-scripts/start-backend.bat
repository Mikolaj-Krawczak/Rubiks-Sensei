@echo off
REM Skrypt start-backend.bat - uruchamianie backendu na Windows
SETLOCAL ENABLEDELAYEDEXPANSION

REM Przejdź do katalogu głównego (jeden poziom wyżej)
cd /d "%~dp0.."

REM Sprawdź czy istnieje środowisko wirtualne
IF NOT EXIST ".venv\Scripts\activate" (
    echo Tworzę środowisko wirtualne .venv...
    python -m venv .venv
) ELSE (
    echo Aktywuję istniejące środowisko wirtualne .venv...
)

REM Aktywacja venv
call .venv\Scripts\activate

echo Instaluję zależności Python...
pip install -r backend\requirements.txt

echo Uruchamiam backend API...
python backend\run.py

echo Backend zatrzymany. Naciśnij dowolny klawisz, aby wyjść...
pause >nul 