# -*- mode: python ; coding: utf-8 -*-

import os
import platform
from pathlib import Path

# Ścieżka do głównego katalogu aplikacji (jeden poziom wyżej od build-scripts)
app_path = Path(SPECPATH).parent

# Dane do dołączenia (backend files)
backend_datas = []
backend_path = app_path / 'backend'
for root, dirs, files in os.walk(backend_path):
    for file in files:
        if file.endswith(('.py', '.txt', '.db')):
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, app_path)
            backend_datas.append((file_path, os.path.dirname(rel_path)))

# Frontend files (wszystkie potrzebne pliki Electron)
frontend_datas = []
frontend_dirs = ['pages', 'components', 'assets', 'css', 'scripts']
frontend_files = ['main.js', 'package.json']

# Dodaj foldery frontendu
for dir_name in frontend_dirs:
    dir_path = app_path / dir_name
    if dir_path.exists():
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, app_path)
                frontend_datas.append((file_path, os.path.dirname(rel_path)))

# Dodaj pojedyncze pliki frontendu
for file_name in frontend_files:
    file_path = app_path / file_name
    if file_path.exists():
        frontend_datas.append((str(file_path), '.'))

# Node modules - Electron binaries
node_modules_path = app_path / 'node_modules'
if node_modules_path.exists():
    # Electron binary dla różnych systemów
    if platform.system() == 'Windows':
        electron_paths = ['electron/dist', '.bin']
        electron_executable = 'electron.exe'
    else:
        electron_paths = ['electron/dist', '.bin'] 
        electron_executable = 'electron'
    
    for dir_name in electron_paths:
        electron_path = node_modules_path / dir_name
        if electron_path.exists():
            for root, dirs, files in os.walk(electron_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    # Zawsze dołącz główny plik electron executable
                    if file == electron_executable and 'electron/dist' in root:
                        rel_path = os.path.relpath(file_path, app_path)
                        frontend_datas.append((file_path, os.path.dirname(rel_path)))
                        continue
                    
                    # Pomiń bardzo duże pliki (> 50MB) - ale nie electron executable
                    try:
                        if os.path.getsize(file_path) > 50 * 1024 * 1024:
                            continue
                    except:
                        pass
                    
                    rel_path = os.path.relpath(file_path, app_path)
                    frontend_datas.append((file_path, os.path.dirname(rel_path)))

# Połącz wszystkie dane
all_datas = backend_datas + frontend_datas

# Określ nazwę pliku exe w zależności od systemu
exe_name = 'RubikSensei.exe' if platform.system() == 'Windows' else 'RubikSensei'

a = Analysis(
    [str(app_path / 'build-scripts' / 'launcher.py')],
    pathex=[str(app_path)],
    binaries=[],
    datas=all_datas,
    hiddenimports=[
        'flask',
        'flask_cors', 
        'sqlalchemy',
        'requests',
        'pathlib',
        'subprocess',
        'threading',
        'signal',
        'backend.app',
        'backend.db',
        'backend.models',
        'sqlite3',
        'werkzeug',
        'werkzeug.utils',
        'logging',
        'json',
        'os',
        'datetime'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name=exe_name,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Ukryj konsolę dla Windows
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(app_path / 'assets' / 'icon.ico') if (app_path / 'assets' / 'icon.ico').exists() else None,
) 