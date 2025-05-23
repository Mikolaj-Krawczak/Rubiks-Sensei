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
from pathlib import Path

class RubikSenseiLauncher:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.base_dir = Path(__file__).parent
        
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
    
    def start_backend(self):
        """Uruchomienie backendu Flask"""
        print("Uruchamiam backend...")
        
        if getattr(sys, 'frozen', False):
            # Aplikacja została spakowana przez PyInstaller
            backend_dir = self.base_dir / 'backend'
            python_exe = sys.executable
        else:
            # Rozwój lokalny
            backend_dir = self.base_dir / 'backend'
            python_exe = sys.executable
        
        os.chdir(backend_dir)
        
        self.backend_process = subprocess.Popen(
            [python_exe, 'run.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=backend_dir
        )
        
        # Sprawdź czy backend wystartował poprawnie
        if self.check_backend_health():
            print("Backend uruchomiony pomyślnie!")
            return True
        else:
            print("Błąd uruchamiania backendu!")
            return False
    
    def start_frontend(self):
        """Uruchomienie frontendu Electron"""
        print("Uruchamiam frontend...")
        
        os.chdir(self.base_dir)
        
        if getattr(sys, 'frozen', False):
            # W spakowanej aplikacji używamy electron z resources
            electron_path = self.base_dir / 'node_modules' / '.bin' / 'electron'
        else:
            # Rozwój lokalny
            electron_path = 'npx'
        
        try:
            if getattr(sys, 'frozen', False):
                self.frontend_process = subprocess.Popen([str(electron_path), '.'])
            else:
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
        
        if self.backend_process:
            self.backend_process.terminate()
            try:
                self.backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.backend_process.kill()
    
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
            
            # Czekaj na zamknięcie frontendu
            self.frontend_process.wait()
            
        except KeyboardInterrupt:
            pass
        finally:
            self.cleanup()
        
        return True

if __name__ == '__main__':
    launcher = RubikSenseiLauncher()
    success = launcher.run()
    sys.exit(0 if success else 1) 