#!/usr/bin/env python3
"""
Główny launcher dla aplikacji Rubik's Sensei
Uruchamia backend Flask w osobnym wątku, a następnie frontend Electron
"""
import os
import sys
import subprocess
import time
import threading
import signal
import requests
import logging
from pathlib import Path

class RubikSenseiLauncher:
    def __init__(self):
        self.frontend_process = None
        self.backend_thread = None
        self.flask_app = None
        self.backend_running = False
        
        # Konfiguracja ścieżek - różnie dla spakowanej i niespakowanej aplikacji
        if getattr(sys, 'frozen', False):
            # Aplikacja spakowana przez PyInstaller
            self.base_dir = Path(sys.executable).parent
            self.app_dir = Path(sys._MEIPASS) if hasattr(sys, '_MEIPASS') else self.base_dir
        else:
            # Rozwój lokalny
            self.base_dir = Path(__file__).parent
            self.app_dir = self.base_dir
        
        # Konfiguracja logowania
        self.setup_logging()
        self.logger.info(f"Aplikacja uruchomiona. Base dir: {self.base_dir}")
        self.logger.info(f"App dir: {self.app_dir}")
        self.logger.info(f"Frozen: {getattr(sys, 'frozen', False)}")
        
    def setup_logging(self):
        """Konfiguracja logowania do pliku i konsoli"""
        log_file = self.base_dir / 'rubik-sensei.log'
        
        # Konfiguracja podstawowa
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def setup_backend_environment(self):
        """Konfiguruje środowisko dla backendu Flask"""
        try:
            # Dodaj katalog backendu do ścieżki Python
            backend_dir = self.app_dir / 'backend'
            if backend_dir.exists():
                sys.path.insert(0, str(backend_dir))
                self.logger.info(f"Dodano do sys.path: {backend_dir}")
            else:
                self.logger.error(f"Katalog backendu nie istnieje: {backend_dir}")
                return False
            
            # Zmień katalog roboczy na backend
            original_cwd = os.getcwd()
            os.chdir(str(backend_dir))
            self.logger.info(f"Zmieniono katalog roboczy na: {backend_dir}")
            
            return True
        except Exception as e:
            self.logger.error(f"Błąd konfiguracji środowiska backendu: {e}")
            return False
    
    def start_backend_thread(self):
        """Uruchomienie backendu Flask w osobnym wątku"""
        def run_flask():
            try:
                self.logger.info("Uruchamiam backend Flask w wątku...")
                
                # Konfiguruj środowisko
                if not self.setup_backend_environment():
                    self.logger.error("Nie udało się skonfigurować środowiska backendu")
                    return
                
                # Importy backendu
                from flask import Flask
                from flask_cors import CORS
                
                # Inicjalizacja bazy danych
                try:
                    from db import init_db
                    init_db()
                    self.logger.info("Baza danych zainicjalizowana")
                except Exception as e:
                    self.logger.warning(f"Błąd inicjalizacji bazy danych: {e}")
                
                # Import aplikacji Flask
                from app import app
                self.flask_app = app
                
                self.logger.info("Backend Flask gotowy do uruchomienia")
                self.backend_running = True
                
                # Uruchom Flask
                app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False, threaded=True)
                
            except Exception as e:
                self.logger.error(f"Błąd uruchamiania backendu Flask: {e}")
                self.backend_running = False
        
        # Uruchom backend w osobnym wątku
        self.backend_thread = threading.Thread(target=run_flask, daemon=True)
        self.backend_thread.start()
        self.logger.info("Wątek backendu uruchomiony")
        
        # Czekaj na uruchomienie backendu
        return self.wait_for_backend()
    
    def wait_for_backend(self, max_retries=30, delay=1):
        """Czeka na uruchomienie backendu"""
        self.logger.info("Czekam na uruchomienie backendu...")
        for i in range(max_retries):
            try:
                response = requests.get('http://localhost:5000/health', timeout=2)
                if response.status_code == 200:
                    self.logger.info("Backend jest dostępny!")
                    return True
            except Exception as e:
                self.logger.debug(f"Próba {i+1}/{max_retries}: Backend niedostępny - {e}")
            
            if not self.backend_running:
                self.logger.error("Backend przestał działać")
                return False
                
            time.sleep(delay)
        
        self.logger.error("Backend nie odpowiada po określonym czasie!")
        return False
    
    def start_frontend(self):
        """Uruchomienie frontendu Electron"""
        self.logger.info("Uruchamiam frontend...")
        
        try:
            # Sprawdź dostępność głównych plików frontendu
            main_js = self.app_dir / 'main.js'
            package_json = self.app_dir / 'package.json'
            
            if not main_js.exists():
                self.logger.error(f"Plik main.js nie istnieje: {main_js}")
                return False
            
            if not package_json.exists():
                self.logger.error(f"Plik package.json nie istnieje: {package_json}")
                return False
            
            self.logger.info(f"Pliki frontendu znalezione: {main_js}, {package_json}")
            
            if getattr(sys, 'frozen', False):
                # W spakowanej aplikacji używamy electron z node_modules
                node_modules = self.app_dir / 'node_modules'
                electron_path = node_modules / '.bin' / 'electron.cmd'
                
                if not electron_path.exists():
                    electron_path = node_modules / 'electron' / 'dist' / 'electron.exe'
                
                if not electron_path.exists():
                    self.logger.error(f"Electron nie znaleziony w: {node_modules}")
                    return False
                
                self.logger.info(f"Uruchamiam Electron: {electron_path} z katalogu {self.app_dir}")
                
                self.frontend_process = subprocess.Popen(
                    [str(electron_path), '.'],
                    cwd=str(self.app_dir),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            else:
                # Rozwój lokalny - używamy npx
                self.logger.info("Uruchamiam Electron przez npx")
                self.frontend_process = subprocess.Popen(
                    ['npx', 'electron', '.'],
                    cwd=str(self.app_dir),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            
            self.logger.info(f"Frontend uruchomiony z PID: {self.frontend_process.pid}")
            
            # Sprawdź czy proces się nie zakończył natychmiast
            time.sleep(1)
            if self.frontend_process.poll() is not None:
                # Proces się zakończył - pobierz logi błędów
                stdout, stderr = self.frontend_process.communicate()
                self.logger.error(f"Frontend zakończył się natychmiast!")
                self.logger.error(f"STDOUT: {stdout.decode('utf-8', errors='ignore')}")
                self.logger.error(f"STDERR: {stderr.decode('utf-8', errors='ignore')}")
                return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Błąd uruchamiania frontendu: {e}")
            return False
    
    def cleanup(self):
        """Zamknięcie wszystkich procesów"""
        self.logger.info("Zamykam aplikację...")
        
        if self.frontend_process:
            self.logger.info("Zamykam frontend...")
            self.frontend_process.terminate()
            try:
                self.frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.logger.warning("Frontend nie odpowiada - zabijam proces")
                self.frontend_process.kill()
        
        if self.flask_app:
            self.logger.info("Zamykam backend Flask...")
            # Flask zostanie zamknięty automatycznie gdy główny proces się zakończy
            self.backend_running = False
    
    def signal_handler(self, signum, frame):
        """Handler dla sygnałów systemowych"""
        self.logger.info(f"Otrzymano sygnał {signum}")
        self.cleanup()
        sys.exit(0)
    
    def run(self):
        """Główna metoda uruchamiająca aplikację"""
        self.logger.info("Rozpoczynam uruchamianie aplikacji Rubik's Sensei")
        
        # Rejestruj handlery sygnałów
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        try:
            # Uruchom backend w wątku
            if not self.start_backend_thread():
                self.logger.error("Nie udało się uruchomić backendu!")
                return False
            
            # Krótka pauza przed uruchomieniem frontendu
            time.sleep(2)
            
            # Uruchom frontend
            if not self.start_frontend():
                self.logger.error("Nie udało się uruchomić frontendu!")
                self.cleanup()
                return False
            
            self.logger.info("Aplikacja uruchomiona pomyślnie! Czekam na zamknięcie...")
            
            # Czekaj na zamknięcie frontendu
            self.frontend_process.wait()
            self.logger.info("Frontend został zamknięty")
            
        except KeyboardInterrupt:
            self.logger.info("Przerwano przez użytkownika")
        except Exception as e:
            self.logger.error(f"Nieoczekiwany błąd: {e}")
        finally:
            self.cleanup()
        
        self.logger.info("Aplikacja zakończona")
        return True

if __name__ == '__main__':
    launcher = RubikSenseiLauncher()
    success = launcher.run()
    sys.exit(0 if success else 1) 