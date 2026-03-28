# Rubik's Sensei

> **This is a demo version of a desktop application for learning and training with the Rubik's Cube.**
> Approximately 2/3 of the planned features have been implemented. A ready-to-run `.exe` file is available in the `dist/` folder — no installation required.
>
> Before a full release, the application requires improvements and rework of certain logical and technical aspects. Nevertheless, it serves as a solid demonstration of desktop application development skills using Python (Flask), Electron, and SQLite.

---

## Table of Contents
1. [Features](#features)
2. [Installation & Running](#installation--running)
    - [Backend](#running-the-backend)
    - [Frontend](#running-the-frontend)
    - [Executable (.exe)](#executable-exe)
3. [Project Structure](#project-structure)
4. [Backend Logic Files](#backend-logic-files-python)
5. [Building the .exe](#building-the-exe)

---

## Features

After launching the application, the home screen appears with options to navigate between the algorithm browser, training module, and competition module.

![image](https://github.com/user-attachments/assets/9f3fcf34-0e92-4c1a-a895-4d1d3c682412)

After selecting a module, the app asks which cube type you want to work with.

![image](https://github.com/user-attachments/assets/9eeb6168-0209-453c-8ea7-97953d41bb39)

After selecting your choice, you can browse new algorithms or challenge your records in single-solve or series mode.

![image](https://github.com/user-attachments/assets/d8a30aac-3353-4812-9151-1f032707361d)

---

## Installation & Running

### Running the Backend

The backend handles business logic, algorithm database management, and exposes an API for the frontend.

To start the backend:
- **Linux/macOS:**
  ```bash
  ./start-backend.sh
  ```
- **Windows:**
  ```bash
  .\start-backend.bat
  ```

These scripts automatically:
1. Create (if missing) and activate a Python virtual environment in `.venv`.
2. Install required Python libraries from `backend/requirements.txt`.
3. Start the Flask backend server.

### Running the Frontend

The frontend is the user interface that communicates with the backend.

To start the frontend (after starting the backend):

```bash
npm install
npm start
```

This launches the Electron desktop window.

### Executable (.exe)

A standalone executable is available at `dist/RubikSensei.exe` — no Python or Node.js installation needed on the target machine.

---

## Project Structure

```
.
├── backend/                # Python Flask backend
│   ├── instance/           # Flask instance folder (SQLite database.db)
│   ├── app.py              # Main Flask application file
│   ├── db.py               # Database connection module (SQLAlchemy, SQLite)
│   ├── models.py           # Database model definitions (SQLAlchemy ORM)
│   ├── run.py              # Flask app startup script
│   └── requirements.txt    # Python dependencies
├── components/             # Frontend UI components
├── css/                    # Frontend CSS stylesheets
├── pages/                  # Frontend page/view definitions
├── scripts/                # Frontend JavaScript scripts
│   ├── generate2x2Cube.js
│   ├── generateCube.js
│   ├── scrambleGenerator.js
│   ├── scrambleVisualizer.js
│   ├── training-3x3.js
│   └── ...
├── assets/                 # Static assets (images, icons)
├── dist/                   # Build output
│   └── RubikSensei.exe     # Standalone executable
├── launcher.py             # Application entry point (used by PyInstaller)
├── main.js                 # Electron main process
├── package.json            # Node.js project definition
├── start-backend.bat       # Backend startup script (Windows)
├── start-backend.sh        # Backend startup script (Linux/macOS)
├── build.bat               # Build script (Windows)
├── rubik-sensei.spec       # PyInstaller configuration
└── BUILD.md                # Detailed build guide
```

---

## Backend Logic Files (Python)

- **`backend/app.py`** — Central Flask application file. Defines API endpoints, handles HTTP requests from the frontend, and implements business logic for cubes, algorithms, users, and solves.

- **`backend/db.py`** — Manages the SQLite database connection via SQLAlchemy. Handles initialization, table creation, and seeding of sample data. Provides the `get_db_session` mechanism for database interactions.

- **`backend/models.py`** — Defines data models using SQLAlchemy ORM (`Cube`, `Algorithm`, `User`, `Solve`). Represents database table structures as Python classes with defined attributes and relationships.

- **`backend/run.py`** — Entry script for starting the Flask development server. Imports the app instance from `app.py` and runs it. Invoked by `start-backend.sh` and `start-backend.bat`.

---

## Building the .exe

The project uses **PyInstaller** to package the entire app (Flask backend + Electron frontend) into a single `.exe` file.

### Architecture

```
┌─────────────────────────────────────────┐
│               RubikSensei.exe            │
├─────────────────────────────────────────┤
│  Python Backend (Flask)                 │
│  ├── HTTP Server (localhost:2115)       │
│  ├── API endpoints (/api/*)             │
│  ├── SQLAlchemy database                │
│  └── Business logic                     │
├─────────────────────────────────────────┤
│  Frontend (Electron)                    │
│  ├── Chromium renderer                  │
│  ├── Node.js runtime                    │
│  ├── HTML/CSS/JS files                  │
│  └── Window management                  │
└─────────────────────────────────────────┘
```

### Startup Sequence

1. PyInstaller bootloader launches `launcher.py`
2. Flask server starts on `localhost:2115` in a separate thread
3. Electron starts and connects to the Flask server
4. Chromium renders the UI from Flask endpoints
5. Frontend and backend communicate via HTTP API

### Build Commands

**Recommended — use `build.bat`:**
```batch
.\build.bat
```

What `build.bat` does:
1. Checks for `launcher.py`
2. Creates/activates `.venv`
3. Installs Python and Node.js dependencies
4. Cleans previous builds
5. Runs PyInstaller with correct parameters
6. Verifies the resulting `.exe`

**Manual build:**
```bash
.\.venv\Scripts\activate
pyinstaller --clean --workpath=build-config\build rubik-sensei.spec
```

### PyInstaller Parameters

| Parameter | Description |
|-----------|-------------|
| `--clean` | Clears cache and temp files before build |
| `--workpath=build-config\build` | Sets working folder for temp files |
| `rubik-sensei.spec` | Configuration file with all build settings |

### Build Statistics

- **RubikSensei.exe**: ~140–150 MB
- **Temp build folder**: ~300–400 MB (can be deleted after build)
- **Build time**: 60–90 seconds (hardware dependent)

```
RubikSensei.exe (142 MB)
├── Python interpreter    (15 MB)
├── Python libraries      (40 MB)
├── Electron runtime      (60 MB)
├── Application files     (20 MB)
└── Resources & assets     (7 MB)
```
