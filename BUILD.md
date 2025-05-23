# 🚀 BUILD.md - Przewodnik Budowania RubikSensei

## 📋 Spis Treści
- [Technologia PyInstaller](#technologia-pyinstaller)
- [Struktura Projektu](#struktura-projektu)
- [Proces Budowania](#proces-budowania)
- [Komendy](#komendy)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Technologia PyInstaller

### Co to jest PyInstaller?
**PyInstaller** to zaawansowane narzędzie do pakowania aplikacji Python w standalone executables (.exe na Windows). Pozwala na utworzenie jednego pliku wykonywalnego, który zawiera:

- **Interpreter Python** - wbudowany, nie wymaga instalacji Python na docelowej maszynie
- **Wszystkie biblioteki Python** - Flask, SQLAlchemy, Requests, etc.
- **Pliki zasobów** - HTML, CSS, JS, obrazy, ikony
- **Binarne zależności** - DLL-e, moduły natywne
- **Frontend Electron** - pełny runtime Node.js + Chromium

### Jak PyInstaller pakuje Electron + Flask?

#### 🎯 **Hybryda Desktop + Web**
Nasza aplikacja to unikalna hybryda:
```
┌─────────────────────────────────────────┐
│               RubikSensei.exe            │
├─────────────────────────────────────────┤
│  🐍 Python Backend (Flask)              │
│  ├── HTTP Server (localhost:5000)       │
│  ├── API endpoints (/api/*)             │
│  ├── SQLAlchemy database                │
│  └── Business logic                     │
├─────────────────────────────────────────┤
│  ⚡ Frontend (Electron)                 │
│  ├── Chromium renderer                  │
│  ├── Node.js runtime                    │
│  ├── HTML/CSS/JS files                  │
│  └── Window management                  │
└─────────────────────────────────────────┘
```

#### 🔄 **Proces Startowy**
1. **PyInstaller bootloader** uruchamia `launcher.py`
2. **Flask server** startuje na `localhost:5000` w osobnym wątku
3. **Electron** uruchamia się i łączy z Flask serverem
4. **Chromium** renderuje interfejs z Flask endpoints
5. **Komunikacja** poprzez HTTP API między frontend/backend

---



## 📁 Struktura Projektu

```
RubiksSensei/
├── 📄 launcher.py                    # Główny punkt wejścia aplikacji
├── 📄 build.bat                      # Skrypt budowania (Windows)
├── 📄 rubik-sensei.spec              # Konfiguracja PyInstaller
├── 📄 requirements-build.txt         # Zależności do budowania
├── 📄 BUILD.md                       # Ten dokument
│
├── 🗂️ backend/                       # Backend Python Flask
│   ├── 📄 app.py                     # Fabryka aplikacji Flask
│   ├── 📄 requirements.txt           # Zależności backendu
│   ├── 🗂️ models/                    # Modele SQLAlchemy
│   ├── 🗂️ routes/                    # Endpointy API
│   └── 🗂️ services/                  # Logika biznesowa
│
├── 🗂️ frontend/                      # Pliki frontendu Electron
│   ├── 📄 main.js                    # Główny proces Electron
│   ├── 📄 package.json               # Zależności Node.js
│   ├── 🗂️ pages/                     # Szablony HTML
│   ├── 🗂️ components/                # Komponenty UI do wielokrotnego użytku
│   ├── 🗂️ css/                       # Arkusze stylów
│   ├── 🗂️ scripts/                   # JavaScript frontendu
│   └── 🗂️ assets/                    # Obrazy, ikony, itp.
│
├── 🗂️ build-config/                  # Konfiguracja budowania
│   └── 🗂️ build/                     # Folder roboczy PyInstaller
│       └── 🗂️ rubik-sensei/          # Pliki tymczasowe budowania
│           ├── 📄 Analysis-00.toc    # Analiza zależności
│           ├── 📄 PYZ-00.pyz         # Skompresowane moduły Python
│           ├── 📄 PKG-00.toc         # Manifest pakietu
│           └── 📄 warn-*.txt         # Logi ostrzeżeń
│
├── 🗂️ dist/                          # Wyjście budowania
│   ├── 📄 RubikSensei.exe            # 🎯 GŁÓWNY PLIK WYKONYWALNY
│   └── 📄 rubik-sensei.log           # Logi z ostatniego budowania
│
├── 🗂️ .venv/                         # Wirtualne środowisko Python
│   ├── 🗂️ Scripts/                   # Pliki wykonywalne Python
│   │   ├── 📄 activate.bat           # Aktywacja środowiska
│   │   └── 📄 pyinstaller.exe        # Plik wykonywalny PyInstaller
│   └── 🗂️ Lib/site-packages/        # Zainstalowane biblioteki
│
└── 🗂️ node_modules/                  # Zależności Node.js
    ├── 🗂️ electron/                  # Środowisko uruchomieniowe Electron
    │   ├── 🗂️ dist/                  # Binarne pliki Electron
    │   └── 📄 package.json            # Metadane Electron
    └── 🗂️ .bin/                      # Pliki wykonywalne Electron
        ├── 📄 electron.exe            # Binarny plik Electron dla Windows
        ├── 📄 electron.cmd            # Skrypt Windows
        └── 📄 electron.ps1            # Skrypt PowerShell
```



## ⚡ Komendy

### 🎯 Dwa Sposoby Budowania

#### Opcja 1: Użycie build.bat (Zalecane)
```batch
# Pełny automatyczny build
.\build.bat
```

**Co robi `build.bat`:**
1. ✅ Sprawdza obecność `launcher.py`
2. 🐍 Tworzy/aktywuje `.venv`
3. 📦 Instaluje zależności Python i Node.js
4. 🧹 Czyści poprzednie buildy
5. 🔨 Uruchamia PyInstaller z właściwymi parametrami
6. ✅ Weryfikuje utworzenie exe

#### Opcja 2: Bezpośrednie wywołanie PyInstaller
```bash
# Aktywuj środowisko
.\.venv\Scripts\activate

# Uruchom PyInstaller
pyinstaller --clean --workpath=build-config\build rubik-sensei.spec
```

### 🔧 Parametry PyInstaller

| Parametr | Opis |
|----------|------|
| `--clean` | Czyści cache i pliki tymczasowe przed buildem |
| `--workpath=build-config\build` | Ustawia folder roboczy dla plików tymczasowych |
| `rubik-sensei.spec` | Plik konfiguracyjny z wszystkimi ustawieniami |

### 📋 Dodatkowe Komendy

#### Sprawdzenie Wersji
```bash
pyinstaller --version
```

#### Debug Build
```bash
pyinstaller --debug=all rubik-sensei.spec
```

#### Clean Build bez cache
```bash
pyinstaller --clean --noconfirm rubik-sensei.spec
```




## 📊 Statystyki Buildowania

### Typowe Rozmiary
- **RubikSensei.exe**: ~140-150 MB
- **Folder build-config/build**: ~300-400 MB (pliki tymczasowe można od razu usunąć po zakończeniu procesu)
- **Czas budowania**: 60-90 sekund (zależnie od hardware)

### Zawartość exe
```
RubikSensei.exe (142 MB)
├── Python interpreter (15 MB)
├── Python biblioteki (40 MB)  
├── Electron runtime (60 MB)
├── Application files (20 MB)
└── Resources & assets (7 MB)
```

---

## 🎯 Najlepsze Praktyki

### 1. Przed budowaniem
- ✅ Zamknij wszystkie instancje aplikacji
- ✅ Sprawdź czy .venv jest aktywne
- ✅ Upewnij się że wszystkie zależności są zainstalowane

### 2. Podczas budowania
- ⏱️ Nie przerywaj procesu (może trwać 1-2 minuty)
- 📊 Monitoruj logi w terminalu
- 🔍 Zwróć uwagę na ostrzeżenia (WARNING)

### 3. Po budowaniu
- ✅ Przetestuj exe na czystej maszynie (bez Python/Node.js)
- 📁 Usuń folder build-config/build po udanym buildzie (oszczędność miejsca)
- 💾 Zbackupuj working exe przed następnym buildem

### 4. Optymalizacja
- 🗜️ Regularnie czyść cache PyInstaller
- 📦 Minimalizuj liczbę includowanych plików
- 🎯 Używaj specific imports zamiast `import *`

---

## 📞 Wsparcie

W przypadku problemów sprawdź:
1. **Logi budowania** w terminalu
2. **Plik warn-*.txt** w build-config/build/rubik-sensei/
3. **Task Manager** - czy proces nie jest zablokowany
4. **Permissions** - czy folder ma uprawnienia zapisu



## 🚨 Troubleshooting

### Problem 1: "Import Error" podczas uruchamiania exe
**Objaw**: Aplikacja nie startuje, błąd importu modułu

**Rozwiązanie**:
```python
# Dodaj do hidden_imports w rubik-sensei.spec
hidden_imports = [
    'missing_module_name',
    # ... inne moduły
]
```

### Problem 2: "Permission Denied" podczas budowania
**Objaw**: 
```
PermissionError: [WinError 5] Odmowa dostępu: RubikSensei.exe
```

**Rozwiązanie**:
1. Zamknij uruchomioną aplikację RubikSensei.exe
2. Sprawdź Task Manager czy proces nie działa w tle
3. Uruchom ponownie build

### Problem 3: Brakujące pliki frontend
**Objaw**: Aplikacja startuje ale UI się nie ładuje

**Rozwiązanie**:
Sprawdź czy wszystkie katalogi są uwzględnione:
```python
frontend_dirs = ['pages', 'components', 'assets', 'css', 'scripts']
```

### Problem 4: Duży rozmiar exe (>200MB)
**Objaw**: Plik exe jest za duży

**Rozwiązanie**:
```python
# Dodaj więcej wykluczeń w rubik-sensei.spec
excludes=[
    'tkinter', 'matplotlib', 'numpy', 'scipy',
    'pandas', 'jupyter', 'notebook'
]
```

### Problem 5: Błąd UPX compression
**Objaw**: 
```
OSError: Failed to execute UPX
```

**Rozwiązanie**:
```python
# Wyłącz UPX w rubik-sensei.spec
exe = EXE(
    # ...
    upx=False,  # Zmień na False
    # ...
)
```

### Problem 6: Brak ikony aplikacji
**Objaw**: Exe ma domyślną ikonę Python

**Rozwiązanie**:
1. Umieść plik `icon.ico` w folderze `assets/`
2. Sprawdź ścieżkę w spec:
```python
icon=str(app_path / 'assets' / 'icon.ico')
```


