// Funkcja do pobierania algorytmów z API
async function fetchAlgorithms() {
    try {
        // Pobieranie wszystkich kostek
        const kostkiResponse = await fetch('http://localhost:5000/api/kostki');
        const kostki = await kostkiResponse.json();
        
        // Znajdź kostkę 3x3
        const kostka3x3 = kostki.find(kostka => kostka.rozmiar === '3x3x3');
        
        if (!kostka3x3) {
            console.error('Nie znaleziono kostki 3x3');
            return;
        }
        
        // Pobieranie algorytmów dla kostki 3x3
        const algorytmyResponse = await fetch(`http://localhost:5000/api/algorytmy?kostka_id=${kostka3x3.id}`);
        const algorytmy = await algorytmyResponse.json();
        
        // Wyświetlanie algorytmów
        displayAlgorithms(algorytmy);
    } catch (error) {
        console.error('Błąd podczas pobierania algorytmów:', error);
    }
}

// Funkcja do wyświetlania algorytmów w interfejsie
function displayAlgorithms(algorytmy) {
    const algorithmListContainer = document.querySelector('.algorithm-list');
    
    // Czyszczenie listy
    algorithmListContainer.innerHTML = '';
    
    // Tymczasowe mapowanie notacji algorytmów do istniejących nazw plików w katalogu assets/images/algorithms
    const algorithmImageMap = {
        "R U R' U' R' F R2 U' R' U' R U R' F'": "R U R' U' R U' R' F' U' F R U R'",  // PLL-T
        "R U R' U R U2 R'": "R U R' U R U2 R' F R U R' U' F'",                       // Sune
        "U (R U' R')": "R U R2 U' R' F R U R U' F'",                                  // F2L-1
        "R U' R' U' F2 U' R U R' D R2": "R U2 R2 F R F' U2 R' F R F'",               // PBL-1
        "R U R' U R U R'": "F R' F R2 U' R' U' R U R' F2",                           // L3C
        "L' R L R'": "L F' L' U' L U F U' L'"                                         // Top First
    };
    
    // Dodawanie algorytmów
    algorytmy.forEach(alg => {
        const algorithmItem = document.createElement('div');
        algorithmItem.className = 'algorithm-item control-btn';
        
        // Sprawdź, czy mamy mapowanie dla tego algorytmu
        const mappedImage = algorithmImageMap[alg.notacja];
        const imageName = mappedImage || alg.notacja;
        
        // Budowa ścieżki obrazka na podstawie mapowania
        let imgPath;
        imgPath = `assets/images/algorithms/${imageName}.png`;
        
        // wyświetlany src z prefixem ../, bo strona jest w pages/
        const displayPath = `../${imgPath}`;
        algorithmItem.innerHTML = `
            <img src="${displayPath}" alt="${alg.nazwa}" />
            <div class="algorithm-item-description">
                <h3>${alg.nazwa}</h3>
                <p>${alg.notacja}</p>
            </div>
        `;
        
        // Dodanie obsługi kliknięcia
        algorithmItem.addEventListener('click', () => {
            playSequence(alg.notacja);
        });
        
        algorithmListContainer.appendChild(algorithmItem);
    });
}

// Załaduj algorytmy po załadowaniu strony
document.addEventListener('DOMContentLoaded', fetchAlgorithms); 