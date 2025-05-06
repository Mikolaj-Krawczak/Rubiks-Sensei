# Menedżer Algorytmów Kostki Rubika

Witamy w projekcie Menedżera Algorytmów Kostki Rubika! Ta aplikacja umożliwia zarządzanie, przeglądanie i trenowanie algorytmów układania kostki Rubika.

## Spis Treści
1.  [Instalacja](#instalacja)
2.  [Uruchamianie](#uruchamianie)
    *   [Backend](#uruchamianie-backendu)
    *   [Frontend](#uruchamianie-frontendu)
3.  [Struktura Projektu](#struktura-projektu)
4.  [Opis Plików Logiki Backendu (Python)](#opis-plików-logiki-backendu-python)

## Instalacja

Aby zainstalować zależności frontendu, użyj menedżera pakietów npm:

```bash
npm install
```

Zależności backendu (Python) zostaną automatycznie zainstalowane podczas pierwszego uruchomienia skryptu `start-backend.sh` lub `start-backend.bat`.

## Uruchamianie

### Uruchamianie Backendu

Backend aplikacji odpowiada za logikę biznesową, zarządzanie bazą danych algorytmów oraz udostępnianie API dla frontendu.

Aby uruchomić backend:
*   **Na systemach Linux/macOS:**
    ```bash
    ./start-backend.sh
    ```
*   **Na systemie Windows:**
    ```bash
    .\start-backend.bat
    ```

Skrypty te automatycznie:
1.  Utworzą (jeśli nie istnieje) i aktywują wirtualne środowisko Pythona w katalogu `.venv`.
2.  Zainstalują wymagane biblioteki Python z pliku `backend/requirements.txt`.
3.  Uruchomią serwer backendowy (aplikację Flask).

### Uruchamianie Frontendu

Frontend aplikacji jest interfejsem użytkownika, który komunikuje się z backendem.

Aby uruchomić aplikację frontendową (po wcześniejszym uruchomieniu backendu):

```bash
npm start
```

Spowoduje to uruchomienie serwera deweloperskiego frontendu. Aplikacja będzie dostępna w przeglądarce pod adresem wskazanym w konsoli po uruchomieniu polecenia.

## Struktura Projektu

Poniżej znajduje się opis głównych katalogów i plików w projekcie:

```
.
├── .git/                   # Katalog Gita
├── .idea/                  # Katalog konfiguracji IDE JetBrains (np. IntelliJ IDEA, PyCharm)
├── .venv/                  # Wirtualne środowisko Pythona (tworzone automatycznie przez skrypty startowe backendu)
├── assets/                 # Zasoby statyczne frontendu (np. obrazy, ikony używane w interfejsie)
├── backend/                # Główny katalog backendu aplikacji
│   ├── instance/           # Katalog instancji aplikacji Flask, zawiera plik bazy danych SQLite (database.db)
│   ├── __pycache__/        # Pamięć podręczna skompilowanych plików Python
│   ├── app.py              # Główny plik aplikacji backendowej (Flask)
│   ├── db.py               # Moduł obsługi bazy danych (SQLAlchemy, SQLite)
│   ├── examples.js         # Plik JavaScript z przykładami wywołań API backendu
│   ├── models.py           # Definicje modeli bazy danych (SQLAlchemy ORM)
│   ├── requirements.txt    # Lista zależności Pythona dla backendu
│   ├── run.py              # Skrypt uruchamiający aplikację Flask
│   └── README.md           # Dokumentacja README specyficzna dla backendu
├── components/             # Katalog zawierający komponenty interfejsu użytkownika frontendu
├── css/                    # Pliki stylów CSS dla frontendu
├── node_modules/           # Zależności projektu Node.js (instalowane przez npm)
├── pages/                  # Katalog zawierający definicje poszczególnych stron/widoków aplikacji frontendowej
├── scripts/                # Dodatkowe skrypty JavaScript używane przez frontend
│   ├── admin-algorithms.js # Skrypt JS do zarządzania algorytmami w panelu administracyjnym
│   ├── admin-users.js      # Skrypt JS do zarządzania użytkownikami w panelu administracyjnym
│   ├── bibliotekaAlgorytmow.js # Skrypt JS związany z funkcjonalnością biblioteki algorytmów
│   ├── generateCube.js     # Skrypt JS do generowania wizualizacji kostki
│   ├── handleNavigation.js # Skrypt JS obsługujący nawigację w aplikacji frontendowej
│   ├── scrambleGenerator.js # Skrypt JS do generowania sekwencji mieszania (scramble)
│   ├── scrambleVisualizer.js # Skrypt JS do wizualizacji sekwencji mieszania (scramble)
│   └── training-3x3.js     # Skrypt JS obsługujący sesje treningowe dla kostki 3x3
├── .gitignore              # Pliki i katalogi ignorowane przez Git
├── main.js                 # Główny plik electrona  inicjujący frontend aplikacji
├── package-lock.json       # Dokładne wersje zainstalowanych zależności npm, generowany automatycznie
├── package.json            # Definicja projektu Node.js, zawiera listę zależności frontendu i skrypty npm
├── README.md               # Ten plik - główna dokumentacja projektu
├── start-backend.bat       # Skrypt startowy backendu dla systemu Windows
└── start-backend.sh        # Skrypt startowy backendu dla systemów Linux/macOS
```

## Opis Plików Logiki Backendu (Python)

Poniżej znajduje się omówienie głównych plików Python odpowiadających za logikę backendu aplikacji:

*   ### `backend/app.py`
    Centralny plik aplikacji backendowej, napisany przy użyciu frameworka Flask. Odpowiada za definiowanie endpointów API, obsługę żądań HTTP od frontendu, przetwarzanie danych oraz interakcję z modułami bazy danych (`db.py`) i modeli (`models.py`). Implementuje logikę biznesową aplikacji, w tym operacje na danych dotyczących kostek, algorytmów, użytkowników i ich ułożeń.

*   ### `backend/db.py`
    Moduł ten zarządza połączeniem z bazą danych SQLite przy użyciu SQLAlchemy. Zawiera funkcje do inicjalizacji bazy danych (`init_db`), tworzenia tabel na podstawie zdefiniowanych modeli oraz dodawania początkowych, przykładowych danych. Dostarcza również mechanizm sesji SQLAlchemy (`get_db_session`) do interakcji z bazą danych przez inne części aplikacji, głównie `app.py`.

*   ### `backend/models.py`
    W tym pliku zdefiniowane są modele danych aplikacji przy użyciu ORM SQLAlchemy. Modele te (`Kostka`, `Algorytm`, `Uzytkownik`, `Ulozenie`) reprezentują strukturę tabel w bazie danych jako klasy Pythona. Ułatwiają one operacje na danych i zapewniają spójność danych. Definiują atrybuty encji oraz relacje między nimi.

*   ### `backend/run.py`
    Skrypt służący do uruchomienia aplikacji backendowej Flask. Importuje instancję aplikacji z `app.py` i uruchamia serwer deweloperski Flask. Jest on wywoływany przez skrypty `start-backend.sh` i `start-backend.bat`.