from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import datetime

# Klasa bazowa dla wszystkich modeli SQLAlchemy
Base = declarative_base()

class Kostka(Base):
    """
    Model reprezentujący kostkę Rubika.
    
    Attributes:
        id (int): Unikalny identyfikator kostki
        nazwa (str): Nazwa modelu kostki (np. "3x3", "2x2", "Pyraminx")
        rozmiar (str): Rozmiar kostki (np. "3x3x3", "2x2x2", "Pyramid")
        algorytmy (relationship): Relacja jeden-do-wielu z modelem Algorytm
        ulozenia (relationship): Relacja jeden-do-wielu z modelem Ulozenie
    """
    __tablename__ = 'kostki'
    
    id = Column(Integer, primary_key=True)
    nazwa = Column(String(50), nullable=False)
    rozmiar = Column(String(20), nullable=False)
    
    # Relacje
    algorytmy = relationship("Algorytm", back_populates="kostka", cascade="all, delete-orphan")
    ulozenia = relationship("Ulozenie", back_populates="kostka", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Kostka(id={self.id}, nazwa='{self.nazwa}', rozmiar='{self.rozmiar}')>"

class Algorytm(Base):
    """
    Model reprezentujący algorytm do układania kostki Rubika.
    
    Attributes:
        id (int): Unikalny identyfikator algorytmu
        kostka_id (int): Klucz obcy odnoszący się do modelu Kostka
        nazwa (str): Nazwa algorytmu (np. "PLL - Permutation T", "OLL - Case 27")
        notacja (str): Sekwencja ruchów w notacji kostkowej (np. "R U R' U'")
        sciezka_obrazu (str): Ścieżka do pliku graficznego przedstawiającego algorytm
        kostka (relationship): Relacja wiele-do-jednego z modelem Kostka
    """
    __tablename__ = 'algorytmy'
    
    id = Column(Integer, primary_key=True)
    kostka_id = Column(Integer, ForeignKey('kostki.id'), nullable=False)
    nazwa = Column(String(100), nullable=False)
    notacja = Column(String(200), nullable=False)
    sciezka_obrazu = Column(String(200), nullable=True)
    
    # Relacje
    kostka = relationship("Kostka", back_populates="algorytmy")
    
    def __repr__(self):
        return f"<Algorytm(id={self.id}, nazwa='{self.nazwa}', notacja='{self.notacja}')>"

class Uzytkownik(Base):
    """
    Model reprezentujący użytkownika aplikacji.
    
    Attributes:
        id (int): Unikalny identyfikator użytkownika
        nazwa_uzytkownika (str): Nazwa użytkownika (login)
        haslo (str): Hasło użytkownika (w produkcji powinno być zahaszowane)
        ranga_kyu (int): Ranga użytkownika w systemie Kyu (6-1, gdzie 1 to najwyższa)
        ulozenia (relationship): Relacja jeden-do-wielu z modelem Ulozenie
    """
    __tablename__ = 'uzytkownicy'
    
    id = Column(Integer, primary_key=True)
    nazwa_uzytkownika = Column(String(50), nullable=False, unique=True)
    haslo = Column(String(100), nullable=False)
    ranga_kyu = Column(Integer, default=6)  # 6 kyu (najniższa) do 1 kyu (najwyższa)
    
    # Relacje
    ulozenia = relationship("Ulozenie", back_populates="uzytkownik", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Uzytkownik(id={self.id}, nazwa='{self.nazwa_uzytkownika}', ranga_kyu={self.ranga_kyu})>"

class Ulozenie(Base):
    """
    Model reprezentujący pojedyncze ułożenie kostki przez użytkownika.
    
    Attributes:
        id (int): Unikalny identyfikator ułożenia
        uzytkownik_id (int): Klucz obcy odnoszący się do modelu Uzytkownik
        kostka_id (int): Klucz obcy odnoszący się do modelu Kostka
        czas (float): Czas ułożenia w sekundach
        scramble (str): Sekwencja pomieszania kostki przed ułożeniem
        data (datetime): Data i czas zapisania ułożenia
        uzytkownik (relationship): Relacja wiele-do-jednego z modelem Uzytkownik
        kostka (relationship): Relacja wiele-do-jednego z modelem Kostka
    """
    __tablename__ = 'ulozenia'
    
    id = Column(Integer, primary_key=True)
    uzytkownik_id = Column(Integer, ForeignKey('uzytkownicy.id'), nullable=False)
    kostka_id = Column(Integer, ForeignKey('kostki.id'), nullable=False)
    czas = Column(Float, nullable=False)  # czas w sekundach
    scramble = Column(String(200), nullable=True)  # notacja pomieszania
    data = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relacje
    uzytkownik = relationship("Uzytkownik", back_populates="ulozenia")
    kostka = relationship("Kostka", back_populates="ulozenia")
    
    def __repr__(self):
        return f"<Ulozenie(id={self.id}, uzytkownik_id={self.uzytkownik_id}, kostka_id={self.kostka_id}, czas={self.czas})>" 