// Zmienne globalne dla sceny pyraminxa
let aspecto, frustum, cena, camera, renderer, orbita, pyraminx, grupo;
let eventos = [];
let isAnimating = false;
let algorithmQueue = [];
let currentStepIndex = 0;
let currentAlgorithm = null;
let rotacao; // Funkcja aktualnej rotacji
let moveHistory = []; // Historia wykonanych ruchów
let currentMoveIndex = -1; // Aktualny indeks w historii

// Kolory pyraminxa - standardowa orientacja speedcubingowa
let vermelho =  0x00ff00; // Czerwony - góra
let verde    =  0x0000ff;  // Zielony - przód  
let azul     =  0xff0000;  // Niebieski - prawo
let amarelo  = 0xffff00; // Żółty - dół/tył
let preto    = 0x777777; // Szary (kolory wewnętrzne)

// Funkcja inicjalizacji sceny pyraminxa
function initPyraminxScene() {
    const container = document.getElementById('pyraminxspace');
    
    // Konfiguracja podstawowych obiektów Three.js
    aspecto = container.clientWidth / container.clientHeight;
    frustum = 10;
    
    cena = new THREE.Scene();
    
    // Ładowanie tła z obrazkiem (jak w innych bibliotekach)
    const loader = new THREE.TextureLoader();
    loader.load(
        '../assets/images/background2.png',
        (texture) => { cena.background = texture; },
        undefined,
        (error) => { 
            console.error('Błąd ładowania tła dla pyraminxa:', error); 
            cena.background = new THREE.Color(0xc2c2c2); 
        }
    );
    
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

// Funkcja obsługi zdarzeń - obsługuje zarówno normalne jak i odwrotne rotacje
function tratarEventos() {
    if (eventos.length != 0) {
        let eventData = eventos.shift();
        
        // Dodaj do historii jeśli nie jest to replay
        if (!eventData.isReplay) {
            // Jeśli nie jesteśmy na końcu historii, obetnij ją
            if (currentMoveIndex < moveHistory.length - 1) {
                moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
            }
            // Dodaj nowy ruch do historii
            moveHistory.push({
                moveType: eventData.moveType,
                reverse: eventData.reverse
            });
            currentMoveIndex = moveHistory.length - 1;
        }
        
        if (eventData.reverse) {
            // Dla ruchów z apostrofem - użyj rotacionarReverse
            rotacao = grupo.rotacionarReverse(eventData.moveType);
        } else {
            // Dla normalnych ruchów - użyj zwykłego rotacionar
            rotacao = grupo.rotacionar(eventData.moveType);
        }
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
                // Ruch z apostrofem (prim) - używa rotacionarReverse dla pojedynczego obrotu w przeciwnym kierunku
                moves.push({ moveType: moveType, reverse: true });
            } else if (modifier === "2") {
                // Podwójny ruch - 2 obroty w tym samym kierunku normalnym  
                moves.push({ moveType: moveType, reverse: false });
                moves.push({ moveType: moveType, reverse: false });
            } else {
                // Normalny ruch bez apostrofu - 1 obrót w kierunku normalnym
                moves.push({ moveType: moveType, reverse: false });
            }
        }
    });
    
    return moves;
}

// Wykonanie sekwencji ruchów
function playSequence(notation) {
    if (isAnimating || !grupo.estaVazio()) return;
    
    // AUTOMATYCZNY RESET przed każdym algorytmem
    resetPyraminx();
    
    // Czekaj krótko aż reset się zakończy
    setTimeout(() => {
        currentAlgorithm = notation;
        const moves = parseAlgorithm(notation);
        
        if (moves.length === 0) {
            console.warn('Nie znaleziono prawidłowych ruchów w notacji:', notation);
            return;
        }
        
        // Wyczyść historię dla nowej sekwencji
        moveHistory = [];
        currentMoveIndex = -1;
        
        // Dodaj ruchy do kolejki zdarzeń
        moves.forEach(move => {
            eventos.push(move);
        });
        
        isAnimating = true;
        
        console.log(`Wykonywanie algorytmu: ${notation}`);
        console.log(`Ruchy:`, moves);
        
        // Ustaw timeout aby oznaczyć koniec animacji
        setTimeout(() => {
            isAnimating = false;
        }, moves.length * 1000); // Około 1 sekunda na ruch
    }, 100); // Krótkie opóźnienie po resecie
}

// Reset pyraminxa
function resetPyraminx() {
    // Zatrzymaj wszystkie animacje
    isAnimating = false;
    eventos = [];
    rotacao = null;
    currentStepIndex = 0;
    currentAlgorithm = null;
    moveHistory = [];
    currentMoveIndex = -1;
    
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

// Krok wstecz - cofnij ostatni ruch
function stepBack() {
    if (isAnimating || !grupo.estaVazio() || currentMoveIndex < 0) {
        console.log('Nie można cofnąć ruchu - animacja w toku lub brak historii');
        return;
    }
    
    const currentMove = moveHistory[currentMoveIndex];
    currentMoveIndex--;
    
    // Wykonaj odwrotny ruch
    const reverseMove = {
        moveType: currentMove.moveType,
        reverse: !currentMove.reverse, // Odwróć kierunek
        isReplay: true // Oznacz jako replay żeby nie dodawać do historii
    };
    
    eventos.push(reverseMove);
    console.log('Cofam ruch:', currentMove, 'Wykonuję odwrotny:', reverseMove);
}

// Krok do przodu - powtórz następny ruch z historii
function stepForward() {
    if (isAnimating || !grupo.estaVazio() || currentMoveIndex >= moveHistory.length - 1) {
        console.log('Nie można powtórzyć ruchu - animacja w toku lub brak dalszej historii');
        return;
    }
    
    const nextMove = moveHistory[currentMoveIndex + 1];
    currentMoveIndex++;
    
    // Wykonaj ruch z historii
    const replayMove = {
        moveType: nextMove.moveType,
        reverse: nextMove.reverse,
        isReplay: true // Oznacz jako replay żeby nie dodawać do historii ponownie
    };
    
    eventos.push(replayMove);
    console.log('Powtarzam ruch:', nextMove);
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