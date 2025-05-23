#!/usr/bin/env python3
"""
Główny launcher dla aplikacji Rubik's Sensei
Uruchamia backend Flask w tle, a następnie frontend Electron
"""
import os
import sys
import subprocess
import time
import threading
import signal
import requests
import platform
from pathlib import Path

class RubikSenseiLauncher:
    def __init__(self):
        self.backend_thread = None
        self.frontend_process = None
        self.flask_app = None
        self.should_stop = False
        
        # Obsługa PyInstaller - używamy sys._MEIPASS do znalezienia plików
        if getattr(sys, 'frozen', False):
            # Aplikacja została spakowana przez PyInstaller
            # sys._MEIPASS zawiera ścieżkę do katalogu z wyodrębnionymi plikami
            self.base_dir = Path(sys._MEIPASS)
        else:
            # Rozwój lokalny
            self.base_dir = Path(__file__).parent.parent
            
    def check_backend_health(self, max_retries=30, delay=1):
        """Sprawdza czy backend jest gotowy"""
        for i in range(max_retries):
            try:
                response = requests.get('http://localhost:5000/health', timeout=2)
                if response.status_code == 200:
                    return True
            except:
                pass
            time.sleep(delay)
        return False
    
    def run_flask_backend(self):
        """Uruchamia backend Flask w osobnym wątku"""
        try:
            # Dodaj katalog backend do sys.path
            backend_dir = self.base_dir / 'backend'
            if str(backend_dir) not in sys.path:
                sys.path.insert(0, str(backend_dir))
            
            # Zmień katalog roboczy na backend
            original_cwd = os.getcwd()
            os.chdir(str(backend_dir))
            
            # Importuj i uruchom aplikację Flask
            from db import init_db
            from app import app
            
            # Inicjalizuj bazę danych
            init_db()
            
            print("Backend Flask uruchomiony w wątku")
            
            # Uruchom Flask w wątku
            app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False, threaded=True)
            
        except Exception as e:
            print(f"Błąd uruchamiania backendu Flask: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Przywróć oryginalny katalog roboczy
            try:
                os.chdir(original_cwd)
            except:
                pass
    
    def start_backend(self):
        """Uruchomienie backendu Flask w osobnym wątku"""
        print("Uruchamiam backend...")
        
        backend_dir = self.base_dir / 'backend'
        
        if not backend_dir.exists():
            print(f"Błąd: Katalog backend nie istnieje: {backend_dir}")
            return False
        
        try:
            # Uruchom backend w osobnym wątku
            self.backend_thread = threading.Thread(target=self.run_flask_backend, daemon=True)
            self.backend_thread.start()
            
            # Sprawdź czy backend wystartował poprawnie
            if self.check_backend_health():
                print("Backend uruchomiony pomyślnie!")
                return True
            else:
                print("Błąd uruchamiania backendu!")
                return False
                
        except Exception as e:
            print(f"Wyjątek podczas uruchamiania backendu: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def start_frontend(self):
        """Uruchomienie frontendu Electron"""
        print("Uruchamiam frontend...")
        
        if getattr(sys, 'frozen', False):
            # W spakowanej aplikacji - różne ścieżki dla różnych systemów
            if platform.system() == 'Windows':
                electron_path = self.base_dir / 'node_modules' / 'electron' / 'dist' / 'electron.exe'
            else:
                electron_path = self.base_dir / 'node_modules' / 'electron' / 'dist' / 'electron'
            
            print(f"Sprawdzam ścieżkę: {electron_path}")
            print(f"Istnieje: {electron_path.exists()}")
            
            if not electron_path.exists():
                print(f"Błąd: Nie znaleziono pliku Electron: {electron_path}")
                # Lista wszystkich plików w node_modules dla debugowania
                node_modules_dir = self.base_dir / 'node_modules'
                if node_modules_dir.exists():
                    print(f"Zawartość {node_modules_dir}:")
                    for item in node_modules_dir.iterdir():
                        print(f"  - {item.name}")
                        if item.name == 'electron' and item.is_dir():
                            electron_dir = item
                            print(f"    Zawartość electron/:")
                            for subitem in electron_dir.iterdir():
                                print(f"      - {subitem.name}")
                                if subitem.name == 'dist' and subitem.is_dir():
                                    dist_dir = subitem
                                    print(f"        Zawartość electron/dist/:")
                                    for distitem in dist_dir.iterdir():
                                        print(f"          - {distitem.name}")
                return False
            
            # Sprawdź czy main.js istnieje
            main_js_path = self.base_dir / 'main.js'
            if not main_js_path.exists():
                print(f"Błąd: Nie znaleziono main.js: {main_js_path}")
                return False
            
            try:
                # Zmień katalog roboczy na katalog aplikacji
                os.chdir(str(self.base_dir))
                print(f"Uruchamiam Electron: {electron_path} z main.js: {main_js_path}")
                # Uruchom electron z pełną ścieżką do main.js
                self.frontend_process = subprocess.Popen([str(electron_path), str(main_js_path)])
                return True
            except Exception as e:
                print(f"Błąd uruchamiania frontendu: {e}")
                return False
        else:
            # Rozwój lokalny - użyj npx electron
            try:
                # Zmień katalog roboczy na katalog główny aplikacji
                os.chdir(str(self.base_dir))
                self.frontend_process = subprocess.Popen(['npx', 'electron', '.'])
                return True
            except Exception as e:
                print(f"Błąd uruchamiania frontendu: {e}")
                return False
    
    def cleanup(self):
        """Zamknięcie wszystkich procesów"""
        print("Zamykam aplikację...")
        
        if self.frontend_process:
            self.frontend_process.terminate()
            try:
                self.frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.frontend_process.kill()
        
        if self.backend_thread:
            self.backend_thread.join()
    
    def signal_handler(self, signum, frame):
        """Handler dla sygnałów systemowych"""
        self.cleanup()
        sys.exit(0)
    
    def run(self):
        """Główna metoda uruchamiająca aplikację"""
        # Rejestruj handlery sygnałów
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        try:
            # Uruchom backend
            if not self.start_backend():
                print("Nie udało się uruchomić backendu!")
                return False
            
            # Uruchom frontend
            if not self.start_frontend():
                print("Nie udało się uruchomić frontendu!")
                self.cleanup()
                return False
                
            # Poczekaj na zakończenie frontendu
            if self.frontend_process:
                self.frontend_process.wait()
            
            return True
            
        except Exception as e:
            print(f"Błąd głównej pętli: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.cleanup()

if __name__ == "__main__":
    launcher = RubikSenseiLauncher()
    success = launcher.run()
    sys.exit(0 if success else 1) 