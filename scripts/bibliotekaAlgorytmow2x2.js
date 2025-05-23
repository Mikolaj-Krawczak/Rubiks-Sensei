// Funkcja do pobierania algorytmów z API
async function fetchAlgorithms() {
    try {
        // Pobieranie wszystkich kostek
        const kostkiResponse = await fetch('http://localhost:5000/api/kostki');
        const kostki = await kostkiResponse.json();
        
        // Znajdź kostkę 2x2
        const kostka2x2 = kostki.find(kostka => kostka.rozmiar === '2x2x2');
        
        if (!kostka2x2) {
            console.error('Nie znaleziono kostki 2x2');
            return;
        }
        
        // Pobieranie algorytmów dla kostki 2x2
        const algorytmyResponse = await fetch(`http://localhost:5000/api/algorytmy?kostka_id=${kostka2x2.id}`);
        const algorytmy = await algorytmyResponse.json();
        
        // Filtruj algorytmy oznaczone jako usunięte lub wpisy oznaczające czyszczenie
        const activeAlgorytmy = algorytmy.filter(alg => 
            !alg.nazwa.includes('(DELETED)') &&
            alg.nazwa !== '___CLEANUP_FLAG___'
        );
        
        console.log("Załadowane algorytmy 2x2:", activeAlgorytmy);
        
        // Wyświetlanie algorytmów
        displayAlgorithms(activeAlgorytmy);
    } catch (error) {
        console.error('Błąd podczas pobierania algorytmów:', error);
    }
}

// Funkcja do wyświetlania algorytmów w interfejsie
function displayAlgorithms(algorytmy) {
    const algorithmListContainer = document.querySelector('.algorithm-list');
    
    // Czyszczenie listy
    algorithmListContainer.innerHTML = '';
    
    // Dodawanie algorytmów
    algorytmy.forEach(alg => {
        const algorithmItem = document.createElement('div');
        algorithmItem.className = 'algorithm-item control-btn';
        
        // Użyj tej samej obsługi obrazów jak w admin-algorithms.js
        let imgPath;
        
        if (alg.sciezka_obrazu) {
            // Jeśli algorytm ma zapisaną ścieżkę, użyj jej
            imgPath = `../${alg.sciezka_obrazu}`;
        } else {
            // W przeciwnym razie użyj notacji jako nazwy pliku
            imgPath = `../assets/images/algorithms2x2/${alg.notacja}.png`;
        }
        
        algorithmItem.innerHTML = `
            <img src="${imgPath}" alt="${alg.nazwa}" onerror="this.onerror=null; this.style.display='none';" />
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