#!/usr/bin/env bash
set -e

# Aktywacja środowiska wirtualnego
if [ -f ".venv/bin/activate" ]; then
  echo "Aktywuję istniejące środowisko wirtualne .venv..."
  source .venv/bin/activate
else
  echo "Tworzę środowisko wirtualne .venv..."
  python3 -m venv .venv
  source .venv/bin/activate
fi

# Instalacja zależności
echo "Instaluję zależności Python..."
pip install -r backend/requirements.txt

# Uruchamianie backendu
echo "Uruchamiam backend API..."
python backend/run.py 