from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class Kostka(Base):
    __tablename__ = 'kostki'
    
    id = Column(Integer, primary_key=True)
    nazwa = Column(String(50), nullable=False)
    rozmiar = Column(String(10), nullable=False)  # np. "2x2", "3x3", "4x4", "Pyraminx"
    
    algorytmy = relationship("Algorytm", back_populates="kostka")
    ulozenia = relationship("Ulozenie", back_populates="kostka")
    
    def __repr__(self):
        return f"<Kostka(id={self.id}, nazwa='{self.nazwa}', rozmiar='{self.rozmiar}')>"

class Algorytm(Base):
    __tablename__ = 'algorytmy'
    
    id = Column(Integer, primary_key=True)
    kostka_id = Column(Integer, ForeignKey('kostki.id'), nullable=False)
    nazwa = Column(String(100), nullable=False)
    notacja = Column(String(500), nullable=False)  # np. "R U R' U'"
    sciezka_obrazu = Column(String(500), nullable=True)
    
    kostka = relationship("Kostka", back_populates="algorytmy")
    
    def __repr__(self):
        return f"<Algorytm(id={self.id}, nazwa='{self.nazwa}', notacja='{self.notacja}')>"

class Uzytkownik(Base):
    __tablename__ = 'uzytkownicy'
    
    id = Column(Integer, primary_key=True)
    nazwa_uzytkownika = Column(String(50), unique=True, nullable=False)
    haslo = Column(String(100), nullable=False)  # hasło powinno być hashowane przed zapisaniem
    ranga_kyu = Column(Integer, default=6)  # np. 6 Kyu, 5 Kyu, itd.
    
    ulozenia = relationship("Ulozenie", back_populates="uzytkownik")
    
    def __repr__(self):
        return f"<Uzytkownik(id={self.id}, nazwa_uzytkownika='{self.nazwa_uzytkownika}', ranga_kyu={self.ranga_kyu})>"

class Ulozenie(Base):
    __tablename__ = 'ulozenia'
    
    id = Column(Integer, primary_key=True)
    uzytkownik_id = Column(Integer, ForeignKey('uzytkownicy.id'), nullable=False)
    kostka_id = Column(Integer, ForeignKey('kostki.id'), nullable=False)
    czas = Column(Float, nullable=False)  # czas w sekundach
    scramble = Column(String(500), nullable=True)  # sekwencja mieszania
    data_ulozenia = Column(DateTime, default=datetime.datetime.utcnow)
    
    uzytkownik = relationship("Uzytkownik", back_populates="ulozenia")
    kostka = relationship("Kostka", back_populates="ulozenia")
    
    def __repr__(self):
        return f"<Ulozenie(id={self.id}, uzytkownik_id={self.uzytkownik_id}, kostka_id={self.kostka_id}, czas={self.czas})>"

# Funkcja do inicjalizacji bazy danych
def init_db(db_path='sqlite:///rubiks_sensei.db'):
    engine = create_engine(db_path)
    Base.metadata.create_all(engine)
    return engine 