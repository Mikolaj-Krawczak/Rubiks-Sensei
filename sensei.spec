# -*- mode: python ; coding: utf-8 -*-

import os
import platform
from pathlib import Path

# Ścieżka do głównego katalogu aplikacji
app_path = Path(SPECPATH)

print(f"Building from: {app_path}")

# Funkcja do zbierania plików z katalogu
def collect_files_from_dir(source_dir, target_dir):
    """Zbiera wszystkie pliki z katalogu źródłowego do docelowego"""
    datas = []
    if source_dir.exists():
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(app_path)
                target_path = Path(target_dir) / rel_path.relative_to(source_dir.relative_to(app_path))
                datas.append((str(file_path), str(target_path.parent)))
    return datas

# Backend files
print("Collecting backend files...")
backend_datas = collect_files_from_dir(app_path / 'backend', 'backend')

# Frontend files - główne pliki
frontend_datas = []
frontend_files = ['main.js', 'package.json']
for file_name in frontend_files:
    file_path = app_path / file_name
    if file_path.exists():
        frontend_datas.append((str(file_path), '.'))
        print(f"Added frontend file: {file_name}")

# Frontend directories
frontend_dirs = ['pages', 'components', 'assets', 'css', 'scripts']
for dir_name in frontend_dirs:
    dir_path = app_path / dir_name
    if dir_path.exists():
        collected = collect_files_from_dir(dir_path, dir_name)
        frontend_datas.extend(collected)
        print(f"Added frontend directory: {dir_name} ({len(collected)} files)")

# Node modules - tylko Electron
print("Collecting Electron binaries...")
electron_datas = []
node_modules_path = app_path / 'node_modules'

if node_modules_path.exists():
    # Cały katalog electron
    electron_dir = node_modules_path / 'electron'
    if electron_dir.exists():
        collected = collect_files_from_dir(electron_dir, 'node_modules/electron')
        electron_datas.extend(collected)
        print(f"Added Electron directory: {len(collected)} files")
    
    # Electron .bin folder
    bin_dir = node_modules_path / '.bin'
    if bin_dir.exists():
        for file_path in bin_dir.iterdir():
            if file_path.is_file() and 'electron' in file_path.name:
                electron_datas.append((str(file_path), 'node_modules/.bin'))
                print(f"Added Electron binary: {file_path.name}")

# Wszystkie dane do pakowania
all_datas = backend_datas + frontend_datas + electron_datas

print(f"Total files to pack: {len(all_datas)}")

# Nazwa pliku exe
exe_name = 'RubikSensei.exe' if platform.system() == 'Windows' else 'RubikSensei'

# Hidden imports - wszystkie potrzebne moduły
hidden_imports = [
    'flask',
    'flask_cors',
    'sqlalchemy',
    'sqlalchemy.ext.declarative',
    'sqlalchemy.orm',
    'sqlalchemy.sql',
    'sqlalchemy.engine',
    'sqlalchemy.pool',
    'requests',
    'pathlib',
    'subprocess',
    'threading',
    'signal',
    'logging',
    'json',
    'os',
    'sys',
    'time'
]

a = Analysis(
    ['launcher.py'],
    pathex=[str(app_path)],
    binaries=[],
    datas=all_datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'scipy'],  # Wykluczamy niepotrzebne duże biblioteki
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
    debug=False,  # Wyłączamy debug dla produkcji
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Ukrywamy konsolę dla profesjonalnego wyglądu
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(app_path / 'assets' / 'icon.ico') if (app_path / 'assets' / 'icon.ico').exists() else None,
) 