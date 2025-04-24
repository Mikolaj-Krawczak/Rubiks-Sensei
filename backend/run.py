#!/usr/bin/env python3
"""
Prosty skrypt do uruchomienia backendu Rubik's Sensei
"""
import os
import sys

# Dodaj bieżący katalog do ścieżki pythona
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Zmień bieżący katalog, aby wszystkie ścieżki były poprawne
os.chdir(current_dir)

try:
    # Importy dla aplikacji
    from flask import Flask
    from flask_cors import CORS
    from models import Base
    from db import init_db, add_sample_data
    
    # Inicjalizacja bazy danych
    init_db()
    add_sample_data()
    
    # Import aplikacji musi być po inicjalizacji bazy danych
    from app import app
    
    print("Uruchamianie API Rubik's Sensei na http://localhost:5000")
    print("Naciśnij CTRL+C aby zatrzymać")
    
    if __name__ == '__main__':
        # Wyłączamy auto-reloader, aby uniknąć błędów z podwójną ścieżką
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
except ImportError as e:
    print(f"Błąd importu: {e}")
    print("Upewnij się, że zainstalowałeś wszystkie zależności:")
    print("pip install -r requirements.txt")
except Exception as e:
    print(f"Błąd: {e}") 