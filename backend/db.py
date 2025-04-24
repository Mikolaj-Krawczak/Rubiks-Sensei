from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Kostka, Algorytm, Uzytkownik, Ulozenie
import os

# Ścieżka do bazy danych
DB_PATH = 'sqlite:///rubiks_sensei.db'

def init_db():
    """Inicjalizuje bazę danych i tworzy tabele"""
    engine = create_engine(DB_PATH)
    Base.metadata.create_all(engine)
    return engine

def get_session():
    """Tworzy i zwraca sesję bazy danych"""
    engine = create_engine(DB_PATH)
    Session = sessionmaker(bind=engine)
    return Session()

def add_sample_data():
    """Dodaje przykładowe dane do bazy danych"""
    session = get_session()
    
    # Sprawdź czy dane już istnieją
    if session.query(Kostka).count() > 0:
        session.close()
        return
    
    # Dodaj kostki
    kostka_2x2 = Kostka(nazwa='Pocket Cube', rozmiar='2x2')
    kostka_3x3 = Kostka(nazwa='Rubiks Cube', rozmiar='3x3')
    kostka_4x4 = Kostka(nazwa='Revenge Cube', rozmiar='4x4')
    kostka_pyraminx = Kostka(nazwa='Pyraminx', rozmiar='Pyraminx')
    
    session.add_all([kostka_2x2, kostka_3x3, kostka_4x4, kostka_pyraminx])
    session.commit()
    
    # Dodaj algorytmy dla kostki 3x3
    algorytmy = [
        Algorytm(
            kostka_id=kostka_3x3.id,
            nazwa='Awkward Shape',
            notacja='R U R\' U\' R U\' R\' F\' U\' F R U R\'',
            sciezka_obrazu='../assets/images/algorithms/R U R\' U\' R U\' R\' F\' U\' F R U R\'.png'
        ),
        Algorytm(
            kostka_id=kostka_3x3.id,
            nazwa='Awkward Shape',
            notacja='F R\' F R2 U\' R\' U\' R U R\' F2',
            sciezka_obrazu='../assets/images/algorithms/F R\' F R2 U\' R\' U\' R U R\' F2.png'
        ),
        Algorytm(
            kostka_id=kostka_3x3.id,
            nazwa='Awkward Shape',
            notacja='R U R\' U R U2 R\' F R U R\' U\' F\'',
            sciezka_obrazu='../assets/images/algorithms/R U R\' U R U2 R\' F R U R\' U\' F\'.png'
        ),
        Algorytm(
            kostka_id=kostka_3x3.id,
            nazwa='Big Lightning Bolt',
            notacja='L F\' L\' U\' L U F U\' L\'',
            sciezka_obrazu='../assets/images/algorithms/L F\' L\' U\' L U F U\' L\'.png'
        ),
        Algorytm(
            kostka_id=kostka_3x3.id,
            nazwa='Cross',
            notacja='R U2 R2 U\' R2 U\' R2 U2 R',
            sciezka_obrazu='../assets/images/algorithms/R U2 R2 U\' R2 U\' R2 U2 R.png'
        )
    ]
    
    session.add_all(algorytmy)
    
    # Dodaj przykładowego użytkownika
    admin_user = Uzytkownik(
        nazwa_uzytkownika='admin',
        haslo='admin123',  # W produkcji powinno być hashowane!
        ranga_kyu=1
    )
    
    test_user = Uzytkownik(
        nazwa_uzytkownika='test',
        haslo='test123',
        ranga_kyu=6
    )
    
    session.add_all([admin_user, test_user])
    session.commit()

    # Dodaj przykładowe ułożenia
    ulozenia = [
        Ulozenie(uzytkownik_id=test_user.id, kostka_id=kostka_3x3.id, czas=50.0, scramble="R U R' U'"),
        Ulozenie(uzytkownik_id=test_user.id, kostka_id=kostka_2x2.id, czas=15.2, scramble="U R U' L'"),
        Ulozenie(uzytkownik_id=admin_user.id, kostka_id=kostka_pyraminx.id, czas=30.5, scramble="R L R' L'")
    ]
    session.add_all(ulozenia)
    session.commit()
    session.close()

if __name__ == "__main__":
    # Inicjalizuj bazę danych
    init_db()
    # Dodaj przykładowe dane
    add_sample_data()
    print("Baza danych została zainicjalizowana i wypełniona przykładowymi danymi.") 