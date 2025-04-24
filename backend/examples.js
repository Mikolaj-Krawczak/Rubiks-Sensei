// Przykładowe wywołania API z JavaScript

// Funkcja pomocnicza do wykonywania zapytań
async function fetchApi(endpoint, method = 'GET', data = null) {
  const url = `http://localhost:5000/api/${endpoint}`;
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error(`Błąd podczas wywołania API: ${error}`);
    return null;
  }
}

// Przykłady użycia API

// === Pobieranie danych ===

// Pobieranie wszystkich kostek
async function getKostki() {
  return fetchApi('kostki');
}

// Pobieranie algorytmów dla określonej kostki
async function getAlgorytmy(kostkaId) {
  return fetchApi(`algorytmy?kostka_id=${kostkaId}`);
}

// Pobieranie czasów ułożeń dla określonego użytkownika
async function getUlozeniaUzytkownika(uzytkownikId) {
  return fetchApi(`ulozenia?uzytkownik_id=${uzytkownikId}`);
}

// === Dodawanie danych ===

// Rejestracja nowego użytkownika
async function registerUser(username, password, rangaKyu = 6) {
  return fetchApi('uzytkownicy', 'POST', {
    nazwa_uzytkownika: username,
    haslo: password,
    ranga_kyu: rangaKyu
  });
}

// Dodawanie nowego czasu ułożenia
async function addUlozenie(uzytkownikId, kostkaId, czas, scramble = null) {
  return fetchApi('ulozenia', 'POST', {
    uzytkownik_id: uzytkownikId,
    kostka_id: kostkaId,
    czas: czas,
    scramble: scramble
  });
}

// === Przykłady użycia w aplikacji ===

// Przykład: Wyświetlanie algorytmów dla kostki 3x3
async function wyswietlAlgorytmyDlaKostki3x3() {
  // Najpierw pobierz wszystkie kostki
  const kostki = await getKostki();
  
  // Znajdź kostkę 3x3
  const kostka3x3 = kostki.find(kostka => kostka.rozmiar === '3x3');
  
  if (kostka3x3) {
    // Pobierz algorytmy dla tej kostki
    const algorytmy = await getAlgorytmy(kostka3x3.id);
    
    // Wyświetl algorytmy (tutaj przykładowo w konsoli)
    console.log('Algorytmy dla kostki 3x3:');
    algorytmy.forEach(alg => {
      console.log(`${alg.nazwa}: ${alg.notacja}`);
    });
  }
}

// Przykład: Zapisywanie czasu ułożenia kostki
async function zapiszCzasUlozenia(uzytkownikId, czasWSekundach) {
  // Pobierz kostki
  const kostki = await getKostki();
  
  // Zakładamy, że użytkownik układa kostkę 3x3
  const kostka3x3 = kostki.find(kostka => kostka.rozmiar === '3x3');
  
  if (kostka3x3) {
    // Dodaj nowy czas ułożenia
    const wynik = await addUlozenie(uzytkownikId, kostka3x3.id, czasWSekundach);
    
    if (wynik) {
      console.log(`Zapisano czas ułożenia: ${czasWSekundach} sekund`);
      return true;
    }
  }
  
  return false;
}

// Przykład: Logowanie użytkownika (prosty przykład, w rzeczywistości powinno się używać systemu uwierzytelniania)
async function loginUser(username, password) {
  // Pobierz wszystkich użytkowników
  const users = await fetchApi('uzytkownicy');
  
  // Znajdź użytkownika o podanej nazwie
  const user = users.find(u => u.nazwa_uzytkownika === username);
  
  // UWAGA: W rzeczywistej aplikacji hasła powinny być hashowane i weryfikowane po stronie serwera!
  // To jest tylko uproszczony przykład do demonstracji
  
  if (user) {
    // Tutaj powinna być prawdziwa weryfikacja hasła
    // W rzeczywistej aplikacji hasła nie powinny być przesyłane ani porównywane bezpośrednio w kliencie!
    
    console.log(`Zalogowano użytkownika: ${username}`);
    return user;
  }
  
  return null;
} 