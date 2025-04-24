from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from sqlalchemy import desc
import json
from werkzeug.utils import secure_filename
from db import init_db, get_session, add_sample_data
from models import Kostka, Algorytm, Uzytkownik, Ulozenie

# Inicjalizacja aplikacji Flask
app = Flask(__name__)
CORS(app)  # Umożliwia żądania CORS

# Upewnij się, że baza danych istnieje
init_db()
add_sample_data()

# Katalog do przechowywania zdjęć algorytmów
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ===== Endpointy dla kostek =====

@app.route('/api/kostki', methods=['GET'])
def get_kostki():
    """Pobiera wszystkie kostki"""
    session = get_session()
    kostki = session.query(Kostka).all()
    result = [{"id": k.id, "nazwa": k.nazwa, "rozmiar": k.rozmiar} for k in kostki]
    session.close()
    return jsonify(result)

@app.route('/api/kostki/<int:kostka_id>', methods=['GET'])
def get_kostka(kostka_id):
    """Pobiera kostkę o określonym ID"""
    session = get_session()
    kostka = session.query(Kostka).filter(Kostka.id == kostka_id).first()
    
    if not kostka:
        session.close()
        return jsonify({"error": "Kostka nie znaleziona"}), 404
    
    result = {"id": kostka.id, "nazwa": kostka.nazwa, "rozmiar": kostka.rozmiar}
    session.close()
    return jsonify(result)

@app.route('/api/kostki', methods=['POST'])
def create_kostka():
    """Tworzy nową kostkę"""
    data = request.json
    
    if not data or not all(key in data for key in ['nazwa', 'rozmiar']):
        return jsonify({"error": "Brakujące dane"}), 400
    
    session = get_session()
    kostka = Kostka(nazwa=data['nazwa'], rozmiar=data['rozmiar'])
    session.add(kostka)
    session.commit()
    
    result = {"id": kostka.id, "nazwa": kostka.nazwa, "rozmiar": kostka.rozmiar}
    session.close()
    return jsonify(result), 201

# ===== Endpointy dla algorytmów =====

@app.route('/api/algorytmy', methods=['GET'])
def get_algorytmy():
    """Pobiera wszystkie algorytmy lub algorytmy dla określonej kostki"""
    kostka_id = request.args.get('kostka_id', type=int)
    
    session = get_session()
    query = session.query(Algorytm)
    
    if kostka_id:
        query = query.filter(Algorytm.kostka_id == kostka_id)
    
    algorytmy = query.all()
    result = [
        {
            "id": alg.id, 
            "kostka_id": alg.kostka_id, 
            "nazwa": alg.nazwa, 
            "notacja": alg.notacja,
            "sciezka_obrazu": alg.sciezka_obrazu
        } 
        for alg in algorytmy
    ]
    
    session.close()
    return jsonify(result)

@app.route('/api/algorytmy/<int:algorytm_id>', methods=['GET'])
def get_algorytm(algorytm_id):
    """Pobiera algorytm o określonym ID"""
    session = get_session()
    algorytm = session.query(Algorytm).filter(Algorytm.id == algorytm_id).first()
    
    if not algorytm:
        session.close()
        return jsonify({"error": "Algorytm nie znaleziony"}), 404
    
    result = {
        "id": algorytm.id, 
        "kostka_id": algorytm.kostka_id, 
        "nazwa": algorytm.nazwa, 
        "notacja": algorytm.notacja,
        "sciezka_obrazu": algorytm.sciezka_obrazu
    }
    
    session.close()
    return jsonify(result)

@app.route('/api/algorytmy', methods=['POST'])
def create_algorytm():
    """Tworzy nowy algorytm"""
    # Inicjalizacja zmiennych
    sciezka_obrazu = None
    # Jeśli przesłano multipart/form-data (np. z plikiem)
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        if 'obraz' in request.files:
            file = request.files['obraz']
            if file.filename:
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                sciezka_obrazu = file_path
        # Dane z formularza
        kostka_id = request.form.get('kostka_id', type=int)
        nazwa = request.form.get('nazwa')
        notacja = request.form.get('notacja')
    else:
        # Obsługa czystego JSON
        data = request.get_json() or {}
        kostka_id = data.get('kostka_id')
        nazwa = data.get('nazwa')
        notacja = data.get('notacja')
        sciezka_obrazu = data.get('sciezka_obrazu')

    # Walidacja danych
    if not all([kostka_id, nazwa, notacja]):
        return jsonify({"error": "Brakujące dane"}), 400

    session = get_session()
    # Sprawdź czy kostka istnieje
    kostka = session.query(Kostka).filter(Kostka.id == kostka_id).first()
    if not kostka:
        session.close()
        return jsonify({"error": "Kostka nie znaleziona"}), 404

    # Tworzenie obiektu
    algorytm = Algorytm(
        kostka_id=kostka_id,
        nazwa=nazwa,
        notacja=notacja,
        sciezka_obrazu=sciezka_obrazu
    )
    
    session.add(algorytm)
    session.commit()
    
    result = {
        "id": algorytm.id, 
        "kostka_id": algorytm.kostka_id, 
        "nazwa": algorytm.nazwa, 
        "notacja": algorytm.notacja,
        "sciezka_obrazu": algorytm.sciezka_obrazu
    }
    
    session.close()
    return jsonify(result), 201

# ===== Endpointy dla użytkowników =====

@app.route('/api/uzytkownicy', methods=['GET'])
def get_uzytkownicy():
    """Pobiera wszystkich użytkowników"""
    session = get_session()
    uzytkownicy = session.query(Uzytkownik).all()
    result = [
        {
            "id": u.id, 
            "nazwa_uzytkownika": u.nazwa_uzytkownika, 
            "ranga_kyu": u.ranga_kyu
        } 
        for u in uzytkownicy
    ]
    session.close()
    return jsonify(result)

@app.route('/api/uzytkownicy/<int:uzytkownik_id>', methods=['GET'])
def get_uzytkownik(uzytkownik_id):
    """Pobiera użytkownika o określonym ID"""
    session = get_session()
    uzytkownik = session.query(Uzytkownik).filter(Uzytkownik.id == uzytkownik_id).first()
    
    if not uzytkownik:
        session.close()
        return jsonify({"error": "Użytkownik nie znaleziony"}), 404
    
    result = {
        "id": uzytkownik.id, 
        "nazwa_uzytkownika": uzytkownik.nazwa_uzytkownika, 
        "ranga_kyu": uzytkownik.ranga_kyu
    }
    
    session.close()
    return jsonify(result)

@app.route('/api/uzytkownicy', methods=['POST'])
def create_uzytkownik():
    """Tworzy nowego użytkownika"""
    data = request.json
    
    if not data or not all(key in data for key in ['nazwa_uzytkownika', 'haslo']):
        return jsonify({"error": "Brakujące dane"}), 400
    
    session = get_session()
    
    # Sprawdź czy nazwa użytkownika jest już zajęta
    existing_user = session.query(Uzytkownik).filter(
        Uzytkownik.nazwa_uzytkownika == data['nazwa_uzytkownika']
    ).first()
    
    if existing_user:
        session.close()
        return jsonify({"error": "Nazwa użytkownika jest już zajęta"}), 400
    
    # W rzeczywistej aplikacji hasło powinno być hashowane!
    uzytkownik = Uzytkownik(
        nazwa_uzytkownika=data['nazwa_uzytkownika'],
        haslo=data['haslo'],
        ranga_kyu=data.get('ranga_kyu', 6)  # Domyślnie 6 Kyu
    )
    
    session.add(uzytkownik)
    session.commit()
    
    result = {
        "id": uzytkownik.id, 
        "nazwa_uzytkownika": uzytkownik.nazwa_uzytkownika, 
        "ranga_kyu": uzytkownik.ranga_kyu
    }
    
    session.close()
    return jsonify(result), 201

# ===== Endpointy dla ułożeń =====

@app.route('/api/ulozenia', methods=['GET'])
def get_ulozenia():
    """Pobiera wszystkie ułożenia lub ułożenia dla określonego użytkownika"""
    uzytkownik_id = request.args.get('uzytkownik_id', type=int)
    kostka_id = request.args.get('kostka_id', type=int)
    
    session = get_session()
    query = session.query(Ulozenie)
    
    if uzytkownik_id:
        query = query.filter(Ulozenie.uzytkownik_id == uzytkownik_id)
    
    if kostka_id:
        query = query.filter(Ulozenie.kostka_id == kostka_id)
    
    # Sortuj po dacie (najnowsze pierwsze)
    query = query.order_by(desc(Ulozenie.data_ulozenia))
    
    ulozenia = query.all()
    result = [
        {
            "id": u.id, 
            "uzytkownik_id": u.uzytkownik_id, 
            "kostka_id": u.kostka_id,
            "czas": u.czas,
            "scramble": u.scramble,
            "data_ulozenia": u.data_ulozenia.isoformat()
        } 
        for u in ulozenia
    ]
    
    session.close()
    return jsonify(result)

@app.route('/api/ulozenia', methods=['POST'])
def create_ulozenie():
    """Tworzy nowe ułożenie"""
    data = request.json
    
    if not data or not all(key in data for key in ['uzytkownik_id', 'kostka_id', 'czas']):
        return jsonify({"error": "Brakujące dane"}), 400
    
    session = get_session()
    
    # Sprawdź czy użytkownik istnieje
    uzytkownik = session.query(Uzytkownik).filter(Uzytkownik.id == data['uzytkownik_id']).first()
    if not uzytkownik:
        session.close()
        return jsonify({"error": "Użytkownik nie znaleziony"}), 404
    
    # Sprawdź czy kostka istnieje
    kostka = session.query(Kostka).filter(Kostka.id == data['kostka_id']).first()
    if not kostka:
        session.close()
        return jsonify({"error": "Kostka nie znaleziona"}), 404
    
    ulozenie = Ulozenie(
        uzytkownik_id=data['uzytkownik_id'],
        kostka_id=data['kostka_id'],
        czas=data['czas'],
        scramble=data.get('scramble')
    )
    
    session.add(ulozenie)
    session.commit()
    
    result = {
        "id": ulozenie.id, 
        "uzytkownik_id": ulozenie.uzytkownik_id, 
        "kostka_id": ulozenie.kostka_id,
        "czas": ulozenie.czas,
        "scramble": ulozenie.scramble,
        "data_ulozenia": ulozenie.data_ulozenia.isoformat()
    }
    
    session.close()
    return jsonify(result), 201

# Uruchomienie aplikacji
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 