import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Kostka, Algorytm, Uzytkownik, Ulozenie

# Ścieżka do pliku bazy danych
DB_PATH = "sqlite:///instance/database.db"

def get_db_session():
    """
    Tworzy i zwraca sesję SQLAlchemy do wykonywania operacji na bazie danych.
    
    Returns:
        Session: Obiekt sesji SQLAlchemy połączony z bazą danych
    """
    engine = create_engine(DB_PATH)
    Session = sessionmaker(bind=engine)
    return Session()

def get_session():
    """
    Alias for get_db_session for compatibility with app.py
    """
    return get_db_session()

def init_db():
    """
    Inicjalizuje bazę danych, tworząc strukturę tabel i dodając przykładowe dane.
    
    Funkcja sprawdza, czy plik bazy danych już istnieje. Jeśli nie, tworzy
    katalog 'instance', tworzy bazę danych, inicjalizuje tabele i wypełnia
    je przykładowymi danymi.
    """
    # Sprawdź, czy plik bazy danych już istnieje
    db_file = "instance/database.db"
    
    if not os.path.exists(db_file):
        print("Tworzenie bazy danych...")
        
        # Utwórz katalog 'instance', jeśli nie istnieje
        os.makedirs("instance", exist_ok=True)
        
        # Utwórz plik bazy danych
        conn = sqlite3.connect(db_file)
        conn.close()
        
        # Inicjalizacja silnika bazy danych i tworzenie tabel
        engine = create_engine(DB_PATH)
        Base.metadata.create_all(engine)
        
        # Dodaj przykładowe dane
        add_sample_data()
        
        print("Baza danych została utworzona i wypełniona przykładowymi danymi.")
    else:
        print("Baza danych już istnieje.")

def add_sample_data():
    """
    Dodaje przykładowe dane do bazy danych.
    
    Funkcja tworzy i zapisuje w bazie:
    - Trzy rodzaje kostek Rubika różnych rozmiarów
    - Kilka podstawowych algorytmów dla każdej kostki
    - Trzech użytkowników o różnych rangach
    - Przykładowe ułożenia kostek przez użytkowników
    """
    session = get_db_session()
    
    # Dodaj przykładowe kostki
    kostka_3x3 = Kostka(nazwa="Kostka 3x3", rozmiar="3x3x3")
    kostka_2x2 = Kostka(nazwa="Kostka 2x2", rozmiar="2x2x2")
    kostka_pyraminx = Kostka(nazwa="Pyraminx", rozmiar="Pyramid")
    
    session.add_all([kostka_3x3, kostka_2x2, kostka_pyraminx])
    session.commit()
    
    # Dodaj przykładowe algorytmy
    algorytmy = [
        # Algorytmy dla kostki 3x3
        Algorytm(
            kostka_id=1, 
            nazwa="PLL - Permutation T", 
            notacja="R U R' U' R' F R2 U' R' U' R U R' F'",
            sciezka_obrazu="assets/images/algorithms/R U R' U R U2 R' F R U R' U' F'.png"
        ),
        Algorytm(
            kostka_id=1, 
            nazwa="OLL - Sune", 
            notacja="R U R' U R U2 R'",
            sciezka_obrazu="assets/images/algorithms/R U2 R' U' R U' R'.png"
        ),
        Algorytm(
            kostka_id=1, 
            nazwa="F2L - Przypadek 1", 
            notacja="U (R U' R')",
            sciezka_obrazu="assets/images/algorithms/R' F R U R' U' F' U R.png"
        ),
        
        # Algorytmy dla kostki 2x2
        Algorytm(
            kostka_id=2, 
            nazwa="PBL - Przypadek 1", 
            notacja="R U' R' U' F2 U' R U R' D R2",
            sciezka_obrazu="assets/images/algorithms/F R' F R2 U' R' U' R U R' F2.png"
        ),
        Algorytm(
            kostka_id=2, 
            nazwa="CLL - Sune", 
            notacja="R U R' U R U2 R'",
            sciezka_obrazu="assets/images/algorithms/L F' L' U' L U F U' L'.png"
        ),
        
        # Algorytmy dla Pyraminx
        Algorytm(
            kostka_id=3, 
            nazwa="L3C - przypadek 1", 
            notacja="R U R' U R U R'",
            sciezka_obrazu="assets/images/algorithms/R U2 R2 U' R2 U' R2 U2 R.png"
        ),
        Algorytm(
            kostka_id=3, 
            nazwa="Top First - przypadek 1", 
            notacja="L' R L R'",
            sciezka_obrazu="assets/images/algorithms/R' U' F U R U' R' F' R.png"
        )
    ]
    
    session.add_all(algorytmy)
    session.commit()
    
    # Dodaj przykładowych użytkowników
    uzytkownicy = [
        Uzytkownik(nazwa_uzytkownika="sensei", haslo="haslo123", ranga_kyu=1),
        Uzytkownik(nazwa_uzytkownika="uczen", haslo="uczen123", ranga_kyu=4),
        Uzytkownik(nazwa_uzytkownika="poczatkujacy", haslo="poczatek123", ranga_kyu=6)
    ]
    
    session.add_all(uzytkownicy)
    session.commit()
    
    # Dodaj przykładowe ułożenia
    ulozenia = [
        # Ułożenia dla użytkownika "sensei"
        Ulozenie(
            uzytkownik_id=1, 
            kostka_id=1, 
            czas=15.67, 
            scramble="R U R' U R U2 R' F R F' U' F' U' F"
        ),
        Ulozenie(
            uzytkownik_id=1, 
            kostka_id=2, 
            czas=3.45, 
            scramble="F R' F' R U R U' R'"
        ),
        Ulozenie(
            uzytkownik_id=1, 
            kostka_id=3, 
            czas=5.23, 
            scramble="R U R' U R U' R' U R U2 R'"
        ),
        
        # Ułożenia dla użytkownika "uczen"
        Ulozenie(
            uzytkownik_id=2, 
            kostka_id=1, 
            czas=45.12, 
            scramble="F R U R' U' F' U R U R' U R U2 R'"
        ),
        Ulozenie(
            uzytkownik_id=2, 
            kostka_id=2, 
            czas=12.34, 
            scramble="R U R' U' R' F R F'"
        ),
        
        # Ułożenia dla użytkownika "poczatkujacy"
        Ulozenie(
            uzytkownik_id=3, 
            kostka_id=1, 
            czas=120.45, 
            scramble="R U R' U' R' F R2 U' R' U' R U R' F'"
        )
    ]
    
    session.add_all(ulozenia)
    session.commit()
    
    session.close()

# Inicjalizuj bazę danych, gdy plik jest uruchamiany bezpośrednio
if __name__ == "__main__":
    init_db() 