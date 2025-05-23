#!/bin/bash
set -e

echo "🚀 Budowanie aplikacji Rubik Sensei do exe..."

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "launcher.py" ]; then
    echo "❌ Błąd: Nie znaleziono launcher.py. Upewnij się że jesteś w katalogu głównym aplikacji."
    exit 1
fi

echo "📦 Krok 1: Instalowanie zależności Python..."
if [ ! -d ".venv" ]; then
    echo "Tworzę środowisko wirtualne..."
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
pip install -r requirements-build.txt

echo "📦 Krok 2: Instalowanie zależności Node.js..."
if [ ! -d "node_modules" ]; then
    echo "Instaluję pakiety npm..."
    npm install
fi

echo "🧹 Krok 3: Czyszczenie poprzednich buildów..."
rm -rf dist/
rm -rf build/

echo "🔨 Krok 4: Budowanie aplikacji z PyInstaller..."
pyinstaller --clean rubik-sensei.spec

echo "✅ Budowanie zakończone!"
echo "📁 Plik exe znajduje się w: dist/RubikSensei"

# Sprawdź czy plik został utworzony
if [ -f "dist/RubikSensei" ]; then
    echo "🎉 Sukces! Aplikacja została zbudowana pomyślnie."
    echo "💡 Aby uruchomić: ./dist/RubikSensei"
else
    echo "❌ Błąd: Plik exe nie został utworzony."
    exit 1
fi 