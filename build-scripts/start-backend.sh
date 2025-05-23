#!/bin/bash
# Skrypt start-backend.sh - uruchamianie backendu na macOS/Linux

# Przejdź do katalogu głównego (jeden poziom wyżej od build-scripts)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "🐍 Sprawdzam środowisko wirtualne Python..."

# Sprawdź czy istnieje środowisko wirtualne
if [ ! -f ".venv/bin/activate" ]; then
    echo "Tworzę środowisko wirtualne .venv..."
    python3 -m venv .venv
else
    echo "Aktywuję istniejące środowisko wirtualne .venv..."
fi

# Aktywacja venv
source .venv/bin/activate

echo "📦 Instaluję zależności Python..."
pip install -r backend/requirements.txt

echo "🚀 Uruchamiam backend API..."
echo "Backend będzie dostępny na: http://localhost:5000"
echo "Aby zatrzymać, naciśnij Ctrl+C"
echo ""

# Sprawdź czy backend/run.py istnieje, jeśli nie to użyj app.py
if [ -f "backend/run.py" ]; then
    python backend/run.py
elif [ -f "backend/app.py" ]; then
    echo "⚠️  Nie znaleziono backend/run.py, używam backend/app.py"
    cd backend
    python app.py
else
    echo "❌ Błąd: Nie znaleziono backend/run.py ani backend/app.py"
    exit 1
fi

echo ""
echo "✅ Backend zatrzymany." 