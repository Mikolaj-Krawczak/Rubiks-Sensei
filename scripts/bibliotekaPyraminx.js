// Zmienne globalne dla sceny pyraminxa
let aspecto, frustum, cena, camera, renderer, orbita, pyraminx, grupo;
let eventos = [];
let isAnimating = false;
let algorithmQueue = [];
let currentStepIndex = 0;
let currentAlgorithm = null;
let rotacao; // Funkcja aktualnej rotacji

// Kolory pyraminxa - standardowa orientacja speedcubingowa
let vermelho = 0xff0000; // Czerwony - góra
let verde    = 0x00ff00; // Zielony - przód  
let azul     = 0x0000ff; // Niebieski - prawo
let amarelo  = 0xffff00; // Żółty - dół/tył
let preto    = 0x777777; // Szary (kolory wewnętrzne)

// Funkcja inicjalizacji sceny pyraminxa
function initPyraminxScene() {
    const container = document.getElementById('pyraminxspace');
    
    // Konfiguracja podstawowych obiektów Three.js
    aspecto = container.clientWidth / container.clientHeight;
    frustum = 10;
    
    cena = new THREE.Scene();
    camera = new THREE.OrthographicCamera(
        -frustum * aspecto / 2, 
        frustum * aspecto / 2, 
        frustum / 2, 
        -frustum / 2, 
        1, 
        2000
    );
    
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    
    // Dodanie kontrolek orbity
    orbita = new THREE.OrbitControls(camera, renderer.domElement);
    orbita.enableKeys = false;
    orbita.enablePan = false;
    
    // Dodanie canvasu do kontenera
    container.appendChild(renderer.domElement);
    
    // Aktualizacja kamery
    updateCamera();
    
    // Stworzenie modelu pyraminxa ze standardową orientacją:
    // faceA = czerwony (góra), faceB = zielony (przód), faceC = niebieski (prawo), faceD = żółty (tył/dół)
    let tetraedroMath = TetraedroMath(2);
    pyraminx = Pyraminx(tetraedroMath, vermelho, verde, azul, amarelo, preto);
    grupo = Grupo(pyraminx);
    
    // Dodanie do sceny
    cena.add(pyraminx);
    cena.add(grupo);
    
    // Ustawienie obsługi zdarzeń
    setupEventListeners();
    
    // Rozpoczęcie animacji
    animate();
}

// Aktualizacja kamery
function updateCamera() {
    aspecto = document.getElementById('pyraminxspace').clientWidth / 
              document.getElementById('pyraminxspace').clientHeight;
    camera.left = -frustum * aspecto / 2;
    camera.right = frustum * aspecto / 2;
    camera.position.set(0, 0, 10);
    camera.updateProjectionMatrix();
    renderer.setSize(
        document.getElementById('pyraminxspace').clientWidth,
        document.getElementById('pyraminxspace').clientHeight
    );
}

// Renderowanie sceny
function render() {
    renderer.render(cena, camera);
}

// Ustawienie event listenerów
function setupEventListeners() {
    // Zmiana rozmiaru okna
    window.addEventListener('resize', function() {
        updateCamera();
        render();
    });
    
    // Zmiana orbity
    orbita.addEventListener('change', function() {
        render();
    });
    
    // Obsługa przycisków kontrolnych
    document.getElementById('reset-btn').addEventListener('click', resetPyraminx);
    document.getElementById('step-back-btn').addEventListener('click', stepBack);
    document.getElementById('step-forward-btn').addEventListener('click', stepForward);
}

// Funkcja animacji - bazowana na oryginalnej z app.js
function animate() {
    requestAnimationFrame(animate);
    
    // Sprawdź czy grupa jest gotowa do wykonania następnego ruchu
    if (grupo.estaVazio()) {
        tratarEventos();
    } else {
        // Jeśli grupa nie jest pusta, wykonaj aktualną rotację
        if (rotacao) {
            rotacao();
        }
    }
    
    render();
}

// Funkcja obsługi zdarzeń - bazowana na oryginalnej z app.js
function tratarEventos() {
    if (eventos.length != 0) {
        let eventData = eventos.shift();
        rotacao = grupo.rotacionar(eventData.moveType);
    }
}

// Mapowanie notacji pyraminxa do ruchów w kodzie
// Standardowa orientacja: czerwony góra, zielony przód, niebieski prawo, żółty tył/dół
// A = Top (czerwony), B = Front (zielony), C = Right (niebieski), D = Back (żółty)
// U/L/R/B = OctaedroA/B/C/D (obracają ściankami)
// u/l/r/b = TetraedroA/B/C/D (obracają tylko wierzchołkami)
const moveMapping = {
    'U': 'OctaedroA',  // Górna ścianka (A = Top, czerwony)
    'L': 'OctaedroB',  // Lewa ścianka (B = Front/Left, zielony)  
    'R': 'OctaedroC',  // Prawa ścianka (C = Right, niebieski)
    'B': 'OctaedroD',  // Tylna ścianka (D = Back, żółty)
    'u': 'TetraedroA', // Górny wierzchołek
    'l': 'TetraedroB', // Lewy/przedni wierzchołek
    'r': 'TetraedroC', // Prawy wierzchołek 
    'b': 'TetraedroD'  // Tylny wierzchołek
};

// Parsowanie algorytmu na ruchy
function parseAlgorithm(notation) {
    const moves = [];
    const tokens = notation.match(/[ULRBulrb]['2]?/g) || [];
    
    tokens.forEach(token => {
        const move = token[0];
        const modifier = token.slice(1);
        
        if (moveMapping[move]) {
            const moveType = moveMapping[move];
            
            if (modifier === "'") {
                // Ruch przeciwny - tylko 1 obrót w przeciwnym kierunku
                // (oryginalnie było 2 obroty, ale to dawało odwrócony kierunek)
                moves.push(moveType, moveType, moveType); // 3 obroty = 1 obrót przeciwny
            } else if (modifier === "2") {
                // Podwójny ruch - 2 obroty w tym samym kierunku  
                moves.push(moveType, moveType);
            } else {
                // Normalny ruch - 1 obrót
                moves.push(moveType);
            }
        }
    });
    
    return moves;
}

// Wykonanie sekwencji ruchów
function playSequence(notation) {
    if (isAnimating || !grupo.estaVazio()) return;
    
    currentAlgorithm = notation;
    const moves = parseAlgorithm(notation);
    
    // Dodaj ruchy do kolejki zdarzeń
    moves.forEach(moveType => {
        eventos.push({ moveType: moveType });
    });
    
    isAnimating = true;
    
    console.log(`Wykonywanie algorytmu: ${notation}`);
    console.log(`Ruchy: ${moves}`);
    
    // Ustaw timeout aby oznaczyć koniec animacji
    setTimeout(() => {
        isAnimating = false;
    }, moves.length * 1000); // Około 1 sekunda na ruch
}

// Reset pyraminxa
function resetPyraminx() {
    // Zatrzymaj wszystkie animacje
    isAnimating = false;
    eventos = [];
    rotacao = null;
    currentStepIndex = 0;
    currentAlgorithm = null;
    
    // Usuń obecny pyraminx z sceny
    cena.remove(pyraminx);
    cena.remove(grupo);
    
    // Stwórz nowy pyraminx ze standardową orientacją
    let tetraedroMath = TetraedroMath(2);
    pyraminx = Pyraminx(tetraedroMath, vermelho, verde, azul, amarelo, preto);
    grupo = Grupo(pyraminx);
    
    // Dodaj do sceny
    cena.add(pyraminx);
    cena.add(grupo);
    
    render();
    console.log('Pyraminx zresetowany');
}

// Krok wstecz (TODO: implementacja)
function stepBack() {
    console.log('Krok wstecz - do implementacji');
    // Tutaj można dodać logikę cofania ruchów
}

// Krok do przodu (TODO: implementacja) 
function stepForward() {
    console.log('Krok do przodu - do implementacji');
    // Tutaj można dodać logikę powtarzania ruchów
}

// Funkcja do pobierania algorytmów pyraminxa z API
async function fetchPyraminxAlgorithms() {
    try {
        // Pobieranie wszystkich kostek
        const kostkiResponse = await fetch('http://localhost:5000/api/kostki');
        const kostki = await kostkiResponse.json();
        
        // Znajdź kostkę pyraminx
        const pyraminxKostka = kostki.find(kostka => 
            kostka.nazwa && kostka.nazwa.toLowerCase().includes('pyraminx')
        );
        
        if (!pyraminxKostka) {
            console.error('Nie znaleziono kostki pyraminx');
            // Utwórz przykładowe algorytmy pyraminxa
            const sampleAlgorithms = [
                {
                    id: 1,
                    nazwa: 'Basic Turn - U',
                    notacja: 'U',
                    opis: 'Podstawowy obrót górnej warstwy'
                },
                {
                    id: 2,
                    nazwa: 'Basic Turn - L',
                    notacja: 'L',
                    opis: 'Podstawowy obrót lewej warstwy'
                },
                {
                    id: 3,
                    nazwa: 'Basic Turn - R', 
                    notacja: 'R',
                    opis: 'Podstawowy obrót prawej warstwy'
                },
                {
                    id: 4,
                    nazwa: 'Basic Turn - B',
                    notacja: 'B',
                    opis: 'Podstawowy obrót tylnej warstwy'
                },
                {
                    id: 5,
                    nazwa: 'Tip Turn - u',
                    notacja: 'u',
                    opis: 'Obrót górnego wierzchołka'
                },
                {
                    id: 6,
                    nazwa: 'Tip Turn - l',
                    notacja: 'l',
                    opis: 'Obrót lewego wierzchołka'
                },
                {
                    id: 7,
                    nazwa: 'Tip Turn - r',
                    notacja: 'r',
                    opis: 'Obrót prawego wierzchołka'
                },
                {
                    id: 8,
                    nazwa: 'Tip Turn - b',
                    notacja: 'b',
                    opis: 'Obrót tylnego wierzchołka'
                },
                {
                    id: 9,
                    nazwa: 'Simple Algorithm',
                    notacja: 'U R U\' R\'',
                    opis: 'Prosty algorytm pyraminxa'
                },
                {
                    id: 10,
                    nazwa: 'Edge Flip',
                    notacja: 'R U R\' U R U\' R\'',
                    opis: 'Algorytm do odwracania krawędzi'
                }
            ];
            displayPyraminxAlgorithms(sampleAlgorithms);
            return;
        }
        
        // Pobieranie algorytmów dla pyraminxa
        const algorytmyResponse = await fetch(`http://localhost:5000/api/algorytmy?kostka_id=${pyraminxKostka.id}`);
        const algorytmy = await algorytmyResponse.json();
        
        // Filtruj aktywne algorytmy
        const activeAlgorytmy = algorytmy.filter(alg => 
            !alg.nazwa.includes('(DELETED)') &&
            alg.nazwa !== '___CLEANUP_FLAG___'
        );
        
        console.log("Załadowane algorytmy pyraminxa:", activeAlgorytmy);
        displayPyraminxAlgorithms(activeAlgorytmy);
        
    } catch (error) {
        console.error('Błąd podczas pobierania algorytmów pyraminxa:', error);
        // Pokaż przykładowe algorytmy w przypadku błędu
        const sampleAlgorithms = [
            {
                id: 1,
                nazwa: 'Basic Turn - U',
                notacja: 'U',
                opis: 'Podstawowy obrót górnej warstwy'
            },
            {
                id: 2,
                nazwa: 'Basic Turn - L',
                notacja: 'L',
                opis: 'Podstawowy obrót lewej warstwy'
            },
            {
                id: 3,
                nazwa: 'Simple Algorithm',
                notacja: 'U R U\' R\'',
                opis: 'Prosty algorytm pyraminxa'
            }
        ];
        displayPyraminxAlgorithms(sampleAlgorithms);
    }
}

// Funkcja do wyświetlania algorytmów pyraminxa
function displayPyraminxAlgorithms(algorytmy) {
    const algorithmListContainer = document.querySelector('.algorithm-list');
    
    // Czyszczenie listy
    algorithmListContainer.innerHTML = '';
    
    // Dodawanie algorytmów
    algorytmy.forEach(alg => {
        const algorithmItem = document.createElement('div');
        algorithmItem.className = 'algorithm-item control-btn';
        
        algorithmItem.innerHTML = `
            <div class="algorithm-item-description">
                <h3>${alg.nazwa}</h3>
                <p>${alg.notacja}</p>
                ${alg.opis ? `<p style="font-size: 1.5rem; color: #666;">${alg.opis}</p>` : ''}
            </div>
        `;
        
        // Dodanie obsługi kliknięcia
        algorithmItem.addEventListener('click', () => {
            playSequence(alg.notacja);
        });
        
        algorithmListContainer.appendChild(algorithmItem);
    });
}

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    initPyraminxScene();
    fetchPyraminxAlgorithms();
}); 