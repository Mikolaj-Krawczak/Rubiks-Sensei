from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
import os
from sqlalchemy import desc
import json
from werkzeug.utils import secure_filename
from db import init_db, get_session
from models import Kostka, Algorytm, Uzytkownik, Ulozenie
import logging

# Konfiguracja logowania
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicjalizacja aplikacji Flask
app = Flask(__name__)
CORS(app)  # Umożliwia żądania CORS (Cross-Origin Resource Sharing)

# Upewnij się, że baza danych istnieje i zawiera przykładowe dane
init_db()

# Katalog docelowy dla zdjęć algorytmów (frontend/assets/images/algorithms)
UPLOAD_FOLDER = os.path.abspath(
    os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        '..', 'assets', 'images', 'algorithms'
    )
)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Obsługa ścieżek głównych dla lepszej integracji z aplikacją Electron
@app.route('/')
@app.route('/home')
def serve_home():
    """
    Przekierowanie do endpointu API dla głównej strony.
    """
    return jsonify({'message': 'Backend API Rubik Sensei. Use /api endpoints for API access.'}), 200

@app.route('/favicon.ico')
def favicon():
    """
    Obsługa żądania favicon.ico
    """
    # Możemy albo zwrócić plik favicon, albo pusty odpowiedź 204
    return '', 204

# =========================================================
# ===================== API KOSTEK =======================
# =========================================================

@app.route('/api')
def index():
    """
    Endpoint główny aplikacji, zwraca prostą informację o API.
    
    Returns:
        dict: Informacja o API
    """
    return jsonify({
        'message': 'Witaj w API Rubik Sensei!',
        'endpoints': [
            '/api/kostki',
            '/api/algorytmy',
            '/api/uzytkownicy',
            '/api/ulozenia'
        ]
    })

@app.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint do sprawdzania czy backend jest gotowy.
    
    Returns:
        dict: Status backendu
    """
    return jsonify({'status': 'ok', 'message': 'Backend is ready'}), 200

@app.route('/api/kostki', methods=['GET'])
def get_kostki():
    """
    Pobiera listę wszystkich dostępnych kostek Rubika.
    
    Returns:
        list: Lista kostek w formacie JSON
    """
    try:
        session = get_session()
        kostki = session.query(Kostka).all()
        
        # Konwertujemy obiekty Kostka na słowniki
        kostki_json = [
            {
                'id': k.id,
                'nazwa': k.nazwa,
                'rozmiar': k.rozmiar
            } for k in kostki
        ]
        
        session.close()
        return jsonify(kostki_json)
    except Exception as e:
        logger.error(f"Błąd podczas pobierania kostek: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/kostki/<int:kostka_id>', methods=['GET'])
def get_kostka(kostka_id):
    """
    Endpoint do pobierania pojedynczej kostki po ID.
    
    GET /api/kostki/{kostka_id}
    
    Args:
        kostka_id (int): ID kostki do pobrania
        
    Returns:
        JSON z danymi kostki lub komunikat błędu 404 jeśli nie znaleziono.
    """
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
    """
    Endpoint do tworzenia nowej kostki.
    
    POST /api/kostki
    Przykładowy JSON w request:
    {
        "nazwa": "Megaminx",
        "rozmiar": "Megaminx"
    }
    
    Returns:
        JSON z danymi utworzonej kostki i status 201 (Created),
        lub komunikat błędu 400 jeśli dane są nieprawidłowe.
    """
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

# Endpoint do usuwania kostki po ID
@app.route('/api/kostki/<int:kostka_id>', methods=['DELETE'])
def delete_kostka(kostka_id):
    """
    Usuwa kostkę o podanym ID.
    DELETE /api/kostki/{kostka_id}
    """
    session = get_session()
    kostka = session.query(Kostka).filter(Kostka.id == kostka_id).first()
    if not kostka:
        session.close()
        return jsonify({"error": "Kostka nie znaleziona"}), 404

    session.delete(kostka)
    session.commit()
    session.close()
    return jsonify({"message": "Kostka została usunięta", "id": kostka_id})

# =========================================================
# ==================== API ALGORYTMÓW ====================
# =========================================================

@app.route('/api/algorytmy', methods=['GET'])
def get_algorytmy():
    """
    Pobiera listę algorytmów, opcjonalnie filtrowanych według ID kostki.
    
    Query Parameters:
        kostka_id (int, optional): ID kostki, dla której chcemy pobrać algorytmy
    
    Returns:
        list: Lista algorytmów w formacie JSON
    """
    try:
        session = get_session()
        
        # Sprawdzamy, czy został podany parametr kostka_id
        kostka_id = request.args.get('kostka_id')
        
        if kostka_id:
            # Jeśli podano ID kostki, filtrujemy algorytmy dla tej kostki
            algorytmy = session.query(Algorytm).filter(Algorytm.kostka_id == kostka_id).all()
        else:
            # W przeciwnym razie pobieramy wszystkie algorytmy
            algorytmy = session.query(Algorytm).all()
        
        # Konwertujemy obiekty Algorytm na słowniki
        algorytmy_json = [
            {
                'id': a.id,
                'kostka_id': a.kostka_id,
                'nazwa': a.nazwa,
                'notacja': a.notacja,
                'sciezka_obrazu': a.sciezka_obrazu
            } for a in algorytmy
        ]
        
        session.close()
        return jsonify(algorytmy_json)
    except Exception as e:
        logger.error(f"Błąd podczas pobierania algorytmów: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/algorytmy/<int:algorytm_id>', methods=['GET'])
def get_algorytm(algorytm_id):
    """
    Endpoint do pobierania pojedynczego algorytmu po ID.
    
    GET /api/algorytmy/{algorytm_id}
    
    Args:
        algorytm_id (int): ID algorytmu do pobrania
        
    Returns:
        JSON z danymi algorytmu lub komunikat błędu 404 jeśli nie znaleziono.
    """
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
    """
    Endpoint do tworzenia nowego algorytmu.
    Obsługuje zarówno format multipart/form-data (z plikiem obrazu)
    jak i czysty JSON.
    
    POST /api/algorytmy
    
    Przykładowy JSON w request:
    {
        "kostka_id": 2,
        "nazwa": "Sexy Move",
        "notacja": "R U R' U'",
        "sciezka_obrazu": "assets/images/algorithms/SexyMove.png"
    }
    
    Returns:
        JSON z danymi utworzonego algorytmu i status 201 (Created),
        lub komunikat błędu 400/404 jeśli dane są nieprawidłowe.
    """
    sciezka_obrazu = None
    # Jeśli przesłano multipart/form-data (np. z plikiem)
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        if 'obraz' in request.files:
            file = request.files['obraz']
            if file.filename:
                # Bezpieczna nazwa pliku (usuwa niebezpieczne znaki)
                filename = secure_filename(file.filename)
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                file.save(save_path)
                # zapisujemy ścieżkę względną do katalogu assets/images/algorithms
                sciezka_obrazu = f"assets/images/algorithms/{filename}"
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

@app.route('/api/algorytmy/<int:algorytm_id>', methods=['PUT'])
def update_algorytm(algorytm_id):
    """
    Endpoint do aktualizacji istniejącego algorytmu.
    Obsługuje zarówno format multipart/form-data (z plikiem obrazu)
    jak i czysty JSON.
    
    PUT /api/algorytmy/{algorytm_id}
    
    Returns:
        JSON z danymi zaktualizowanego algorytmu lub komunikat błędu.
    """
    session = get_session()
    algorytm = session.query(Algorytm).filter(Algorytm.id == algorytm_id).first()
    
    if not algorytm:
        session.close()
        return jsonify({"error": "Algorytm nie znaleziony"}), 404
    
    sciezka_obrazu = algorytm.sciezka_obrazu  # zachowaj obecną ścieżkę
    
    # Jeśli przesłano multipart/form-data (np. z plikiem)
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        if 'obraz' in request.files:
            file = request.files['obraz']
            if file.filename:
                # Bezpieczna nazwa pliku (usuwa niebezpieczne znaki)
                filename = secure_filename(file.filename)
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                file.save(save_path)
                # zapisujemy ścieżkę względną do katalogu assets/images/algorithms
                sciezka_obrazu = f"assets/images/algorithms/{filename}"
        # Dane z formularza
        kostka_id = request.form.get('kostka_id', type=int, default=algorytm.kostka_id)
        nazwa = request.form.get('nazwa', default=algorytm.nazwa)
        notacja = request.form.get('notacja', default=algorytm.notacja)
    else:
        # Obsługa czystego JSON
        data = request.get_json() or {}
        kostka_id = data.get('kostka_id', algorytm.kostka_id)
        nazwa = data.get('nazwa', algorytm.nazwa)
        notacja = data.get('notacja', algorytm.notacja)
        if 'sciezka_obrazu' in data:
            sciezka_obrazu = data.get('sciezka_obrazu')

    # Sprawdź czy kostka istnieje
    kostka = session.query(Kostka).filter(Kostka.id == kostka_id).first()
    if not kostka:
        session.close()
        return jsonify({"error": "Kostka nie znaleziona"}), 404

    # Aktualizacja danych
    algorytm.kostka_id = kostka_id
    algorytm.nazwa = nazwa
    algorytm.notacja = notacja
    algorytm.sciezka_obrazu = sciezka_obrazu
    
    session.commit()
    
    result = {
        "id": algorytm.id, 
        "kostka_id": algorytm.kostka_id, 
        "nazwa": algorytm.nazwa, 
        "notacja": algorytm.notacja,
        "sciezka_obrazu": algorytm.sciezka_obrazu
    }
    
    session.close()
    return jsonify(result)

@app.route('/api/algorytmy/<int:algorytm_id>', methods=['DELETE'])
def delete_algorytm(algorytm_id):
    """
    Endpoint do usuwania algorytmu.
    
    DELETE /api/algorytmy/{algorytm_id}
    
    Returns:
        JSON z potwierdzeniem usunięcia lub komunikat błędu.
    """
    session = get_session()
    algorytm = session.query(Algorytm).filter(Algorytm.id == algorytm_id).first()
    
    if not algorytm:
        session.close()
        return jsonify({"error": "Algorytm nie znaleziony"}), 404
    
    # Zapisz informacje o usuniętym algorytmie
    deleted_info = {
        "id": algorytm.id,
        "nazwa": algorytm.nazwa,
        "message": "Algorytm został usunięty"
    }
    
    # Usuń algorytm z bazy danych
    session.delete(algorytm)
    session.commit()
    session.close()
    
    return jsonify(deleted_info)

# =========================================================
# =================== API UŻYTKOWNIKÓW ==================
# =========================================================

@app.route('/api/uzytkownicy', methods=['GET', 'POST'])
def handle_uzytkownicy():
    """
    Obsługuje operacje na użytkownikach - pobieranie listy lub tworzenie nowego.
    
    GET: Pobiera listę wszystkich użytkowników
    POST: Tworzy nowego użytkownika na podstawie danych z formularza
    
    Returns:
        dict/list: Informacja o wyniku operacji lub lista użytkowników
    """
    session = get_session()
    
    if request.method == 'GET':
        try:
            uzytkownicy = session.query(Uzytkownik).all()
            
            uzytkownicy_json = [
                {
                    'id': u.id,
                    'nazwa_uzytkownika': u.nazwa_uzytkownika,
                    'ranga_kyu': u.ranga_kyu
                } for u in uzytkownicy
            ]
            
            session.close()
            return jsonify(uzytkownicy_json)
        except Exception as e:
            logger.error(f"Błąd podczas pobierania użytkowników: {str(e)}")
            session.close()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            # Pobieramy dane z żądania JSON
            data = request.json
            
            # Sprawdzamy, czy nazwa użytkownika już istnieje
            istniejacy_uzytkownik = session.query(Uzytkownik).filter_by(
                nazwa_uzytkownika=data['nazwa_uzytkownika']
            ).first()
            
            if istniejacy_uzytkownik:
                session.close()
                return jsonify({'error': 'Użytkownik o tej nazwie już istnieje'}), 400
            
            # Tworzymy nowego użytkownika
            nowy_uzytkownik = Uzytkownik(
                nazwa_uzytkownika=data['nazwa_uzytkownika'],
                haslo=data['haslo'],  # W produkcji należy zahashować hasło!
                ranga_kyu=data.get('ranga_kyu', 6)  # Domyślnie najniższa ranga (6 Kyu)
            )
            
            session.add(nowy_uzytkownik)
            session.commit()
            
            # Zwracamy informacje o nowym użytkowniku (bez hasła)
            response = {
                'id': nowy_uzytkownik.id,
                'nazwa_uzytkownika': nowy_uzytkownik.nazwa_uzytkownika,
                'ranga_kyu': nowy_uzytkownik.ranga_kyu,
                'message': 'Użytkownik został utworzony pomyślnie'
            }
            
            session.close()
            return jsonify(response), 201
        
        except KeyError as e:
            session.rollback()
            session.close()
            return jsonify({'error': f'Brak wymaganego pola: {str(e)}'}), 400
        
        except Exception as e:
            session.rollback()
            session.close()
            logger.error(f"Błąd podczas tworzenia użytkownika: {str(e)}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/uzytkownicy/<int:uzytkownik_id>', methods=['GET', 'PUT', 'DELETE'])
@cross_origin(methods=['GET', 'PUT', 'DELETE'])
def handle_uzytkownik(uzytkownik_id):
    """
    Endpoint do pobierania, aktualizacji lub usuwania pojedynczego użytkownika po ID.
    
    GET /api/uzytkownicy/{uzytkownik_id}: Pobiera dane użytkownika
    PUT /api/uzytkownicy/{uzytkownik_id}: Aktualizuje dane użytkownika
    DELETE /api/uzytkownicy/{uzytkownik_id}: Usuwa użytkownika
    
    Args:
        uzytkownik_id (int): ID użytkownika
        
    Returns:
        JSON z danymi użytkownika, komunikatem sukcesu lub błędu.
    """
    session = get_session()
    uzytkownik = session.query(Uzytkownik).filter(Uzytkownik.id == uzytkownik_id).first()
    
    if not uzytkownik:
        session.close()
        return jsonify({"error": "Użytkownik nie znaleziony"}), 404

    if request.method == 'GET':
        result = {
            "id": uzytkownik.id, 
            "nazwa_uzytkownika": uzytkownik.nazwa_uzytkownika, 
            "ranga_kyu": uzytkownik.ranga_kyu
        }
        session.close()
        return jsonify(result)

    elif request.method == 'PUT':
        try:
            data = request.json
            
            # Sprawdź, czy nowa nazwa użytkownika już istnieje (jeśli jest zmieniana)
            if 'nazwa_uzytkownika' in data and data['nazwa_uzytkownika'] != uzytkownik.nazwa_uzytkownika:
                istniejacy = session.query(Uzytkownik).filter_by(nazwa_uzytkownika=data['nazwa_uzytkownika']).first()
                if istniejacy:
                    session.close()
                    return jsonify({'error': 'Użytkownik o tej nazwie już istnieje'}), 400

            # Aktualizuj pola (ignoruj hasło, jeśli jest przesłane)
            uzytkownik.nazwa_uzytkownika = data.get('nazwa_uzytkownika', uzytkownik.nazwa_uzytkownika)
            uzytkownik.ranga_kyu = data.get('ranga_kyu', uzytkownik.ranga_kyu)
            # UWAGA: Nie aktualizujemy hasła przez ten endpoint dla bezpieczeństwa.
            # Wymagałoby to osobnego mechanizmu resetowania/zmiany hasła.
            
            session.commit()
            
            # Zwróć zaktualizowane dane (bez hasła)
            response = {
                'id': uzytkownik.id,
                'nazwa_uzytkownika': uzytkownik.nazwa_uzytkownika,
                'ranga_kyu': uzytkownik.ranga_kyu,
                'message': 'Użytkownik został zaktualizowany pomyślnie'
            }
            session.close()
            return jsonify(response)
            
        except Exception as e:
            session.rollback()
            session.close()
            logger.error(f"Błąd podczas aktualizacji użytkownika {uzytkownik_id}: {str(e)}")
            return jsonify({'error': str(e)}), 500

    elif request.method == 'DELETE':
        try:
            session.delete(uzytkownik)
            session.commit()
            session.close()
            return jsonify({'message': f'Użytkownik o ID {uzytkownik_id} został usunięty'}), 200
            
        except Exception as e:
            session.rollback()
            session.close()
            logger.error(f"Błąd podczas usuwania użytkownika {uzytkownik_id}: {str(e)}")
            return jsonify({'error': str(e)}), 500

# =========================================================
# ===================== API UŁOŻEŃ =======================
# =========================================================

@app.route('/api/ulozenia', methods=['GET', 'POST'])
def handle_ulozenia():
    """
    Obsługuje operacje na ułożeniach - pobieranie listy lub dodawanie nowego.
    
    GET: Pobiera listę ułożeń, opcjonalnie filtrowanych według ID użytkownika
    POST: Dodaje nowe ułożenie na podstawie danych z formularza
    
    Query Parameters (GET):
        uzytkownik_id (int, optional): ID użytkownika, którego ułożenia chcemy pobrać
        kostka_id (int, optional): ID kostki, dla której chcemy pobrać ułożenia
    
    Returns:
        dict/list: Informacja o wyniku operacji lub lista ułożeń
    """
    session = get_session()
    
    if request.method == 'GET':
        try:
            # Sprawdzamy, czy został podany parametr uzytkownik_id
            uzytkownik_id = request.args.get('uzytkownik_id')
            kostka_id = request.args.get('kostka_id')
            
            if uzytkownik_id:
                # Jeśli podano ID użytkownika, filtrujemy ułożenia dla tego użytkownika
                ulozenia = session.query(Ulozenie).filter(Ulozenie.uzytkownik_id == uzytkownik_id).all()
            elif kostka_id:
                # Jeśli podano ID kostki, filtrujemy ułożenia dla tej kostki
                ulozenia = session.query(Ulozenie).filter(Ulozenie.kostka_id == kostka_id).all()
            else:
                # W przeciwnym razie pobieramy wszystkie ułożenia
                ulozenia = session.query(Ulozenie).all()
            
            # Konwertujemy obiekty Ulozenie na słowniki
            ulozenia_json = []
            for u in ulozenia:
                kostka = session.query(Kostka).get(u.kostka_id)
                uzytkownik = session.query(Uzytkownik).get(u.uzytkownik_id)
                
                ulozenie_dict = {
                    'id': u.id,
                    'uzytkownik_id': u.uzytkownik_id,
                    'uzytkownik_nazwa': uzytkownik.nazwa_uzytkownika if uzytkownik else None,
                    'kostka_id': u.kostka_id,
                    'kostka_nazwa': kostka.nazwa if kostka else None,
                    'czas': u.czas,
                    'scramble': u.scramble,
                    'data': u.data.isoformat() if u.data else None
                }
                
                ulozenia_json.append(ulozenie_dict)
            
            session.close()
            return jsonify(ulozenia_json)
        
        except Exception as e:
            logger.error(f"Błąd podczas pobierania ułożeń: {str(e)}")
            session.close()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            # Pobieramy dane z żądania JSON
            data = request.json
            
            # Sprawdzamy, czy użytkownik i kostka istnieją
            uzytkownik = session.query(Uzytkownik).get(data['uzytkownik_id'])
            kostka = session.query(Kostka).get(data['kostka_id'])
            
            if not uzytkownik:
                session.close()
                return jsonify({'error': 'Użytkownik o podanym ID nie istnieje'}), 400
            
            if not kostka:
                session.close()
                return jsonify({'error': 'Kostka o podanym ID nie istnieje'}), 400
            
            # Tworzymy nowe ułożenie
            nowe_ulozenie = Ulozenie(
                uzytkownik_id=data['uzytkownik_id'],
                kostka_id=data['kostka_id'],
                czas=data['czas'],
                scramble=data.get('scramble', '')  # Opcjonalne pole
            )
            
            session.add(nowe_ulozenie)
            session.commit()
            
            # Zwracamy informacje o nowym ułożeniu
            response = {
                'id': nowe_ulozenie.id,
                'uzytkownik_id': nowe_ulozenie.uzytkownik_id,
                'kostka_id': nowe_ulozenie.kostka_id,
                'czas': nowe_ulozenie.czas,
                'scramble': nowe_ulozenie.scramble,
                'data': nowe_ulozenie.data.isoformat() if nowe_ulozenie.data else None,
                'message': 'Ułożenie zostało dodane pomyślnie'
            }
            
            session.close()
            return jsonify(response), 201
        
        except KeyError as e:
            session.rollback()
            session.close()
            return jsonify({'error': f'Brak wymaganego pola: {str(e)}'}), 400
        
        except Exception as e:
            session.rollback()
            session.close()
            logger.error(f"Błąd podczas dodawania ułożenia: {str(e)}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """
    Endpoint do logowania użytkowników.
    
    Weryfikuje nazwę użytkownika i hasło. W produkcji należy używać
    bezpieczniejszych metod uwierzytelniania oraz zabezpieczeń jak session token.
    
    Returns:
        dict: Informacja o wyniku logowania i dane użytkownika w przypadku sukcesu
    """
    try:
        session = get_session()
        data = request.json
        
        if not data or 'nazwa_uzytkownika' not in data or 'haslo' not in data:
            return jsonify({'error': 'Brak wymaganych pól (nazwa_uzytkownika, haslo)'}), 400
        
        # Wyszukujemy użytkownika po nazwie
        uzytkownik = session.query(Uzytkownik).filter_by(
            nazwa_uzytkownika=data['nazwa_uzytkownika']
        ).first()
        
        if not uzytkownik:
            return jsonify({'error': 'Użytkownik o podanej nazwie nie istnieje'}), 404
        
        # Sprawdzamy hasło (w produkcji należy używać haszowania!)
        if uzytkownik.haslo != data['haslo']:
            return jsonify({'error': 'Niepoprawne hasło'}), 401
        
        # Zwracamy informacje o zalogowanym użytkowniku (bez hasła)
        response = {
            'id': uzytkownik.id,
            'nazwa_uzytkownika': uzytkownik.nazwa_uzytkownika,
            'ranga_kyu': uzytkownik.ranga_kyu,
            'message': 'Zalogowano pomyślnie'
        }
        
        session.close()
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Błąd podczas logowania: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==========================================================
# ===================== OBSŁUGA BŁĘDÓW =====================
# ==========================================================

@app.errorhandler(400)
def bad_request(error):
    return jsonify(error=str(error)), 400

@app.errorhandler(404)
def not_found(error):
    # Sprawdź, czy żądanie dotyczy API
    if request.path.startswith('/api/'):
        return jsonify(error="Resource not found", message=str(error)), 404
    # Dla innych ścieżek (np. frontendowych) możesz zwrócić stronę 404 HTML lub przekierowanie
    # return render_template('404.html'), 404 # Jeśli masz szablon
    return str(error), 404 # Domyślna strona błędu HTML Flaska

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify(error="Method Not Allowed", message=str(error)), 405

@app.errorhandler(500)
def internal_server_error(error):
    logger.error(f"Internal Server Error: {error}") # Logowanie błędu 500
    return jsonify(error="Internal Server Error", message="Wystąpił nieoczekiwany błąd serwera."), 500

# Uruchomienie aplikacji
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=2115) 
