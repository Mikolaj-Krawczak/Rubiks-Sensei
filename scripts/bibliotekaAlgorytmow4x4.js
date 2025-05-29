// Funkcja do pobierania algorytmów z API
async function fetchAlgorithms() {
    try {
        // Pobieranie wszystkich kostek
        const kostkiResponse = await fetch('http://localhost:2115/api/kostki');
        const kostki = await kostkiResponse.json();
        
        // Znajdź kostkę 4x4
        const kostka4x4 = kostki.find(kostka => kostka.rozmiar === '4x4x4');
        
        if (!kostka4x4) {
            console.error('Nie znaleziono kostki 4x4');
            return;
        }
        
        // Pobieranie algorytmów dla kostki 4x4
        const algorytmyResponse = await fetch(`http://localhost:2115/api/algorytmy?kostka_id=${kostka4x4.id}`);
        const algorytmy = await algorytmyResponse.json();
        
        // Filtruj algorytmy oznaczone jako usunięte lub wpisy oznaczające czyszczenie
        const activeAlgorytmy = algorytmy.filter(alg => 
            !alg.nazwa.includes('(DELETED)') &&
            alg.nazwa !== '___CLEANUP_FLAG___'
        );
        
        console.log("Załadowane algorytmy 4x4:", activeAlgorytmy);
        
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
            imgPath = `../assets/images/algorithms4x4/${alg.notacja}.png`;
        }
        
        algorithmItem.innerHTML = `
            <img src="${imgPath}" alt="${alg.nazwa}" onerror="this.onerror=null; this.style.display='none';" />
            <div class="algorithm-item-description">
                <h3>${alg.nazwa}</h3>
                <p>${alg.notacja}</p>
            </div>
        `;
        
        // Dodanie obsługi kliknięcia - użyj tej samej logiki co w generate4x4Cube.js
        algorithmItem.addEventListener('click', () => {
            if (typeof playSequence === 'function') {
                playSequence(alg.notacja);
            } else {
                console.error('Funkcja playSequence nie jest dostępna');
            }
        });
        
        algorithmListContainer.appendChild(algorithmItem);
    });
}

// Funkcje kontrolne dla przycisków step back/forward
function setupControlButtons() {
    const resetBtn = document.getElementById('reset-btn');
    const stepBackBtn = document.getElementById('step-back-btn');
    const stepForwardBtn = document.getElementById('step-forward-btn');
    
    // Sprawdź czy funkcje są dostępne z generate4x4Cube.js
    if (typeof resetCube === 'function' && resetBtn && !resetBtn.hasAttribute('data-listener-added')) {
        resetBtn.addEventListener('click', resetCube);
        resetBtn.setAttribute('data-listener-added', 'true');
    }
    
    if (typeof stepBackward === 'function' && stepBackBtn && !stepBackBtn.hasAttribute('data-listener-added')) {
        stepBackBtn.addEventListener('click', stepBackward);
        stepBackBtn.setAttribute('data-listener-added', 'true');
    }
    
    if (typeof stepForward === 'function' && stepForwardBtn && !stepForwardBtn.hasAttribute('data-listener-added')) {
        stepForwardBtn.addEventListener('click', stepForward);
        stepForwardBtn.setAttribute('data-listener-added', 'true');
    }
}

// Załaduj algorytmy po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    fetchAlgorithms();
    // Dodaj event listenery dla przycisków kontrolnych
    setupControlButtons();
}); 