// Wizualizator scramble'a dla kostki 4x4
// Bazuje na scrambleVisualizer.js, ale dostosowany dla kostki 4x4

let visualizerScene, visualizerCamera, visualizerRenderer, visualizerControls, visualizerCubeGroup;
let visualizerCubes = []; // Tablica przechowująca elementy kostki dla tego wizualizatora
const VISUALIZER_CUBE_SIZE = 1;
const VISUALIZER_GAP = 0.02; // Mniejszy gap dla kostki 4x4

// --- Ustawienia Animacji ---
let ANIMATION_DURATION = 300; // ms - Domyślna prędkość animacji
let isAnimating = false;
let animationStartTime = 0;
let animationGroup = null;
let animationAxis = null;
let animationAngle = 0;
let moveQueue = [];
let currentAnimatingMove = null; // Przechowuje { face, direction, double }

// Kolory kostki 4x4
const visualizerColors = {
    front: 0x00ff00, // Zielony
    back: 0x0000ff, // Niebieski
    up: 0xffffff, // Biały
    down: 0xffff00, // Żółty
    left: 0xffa500, // Pomarańczowy
    right: 0xff0000 // Czerwony
};

// --- Funkcja Inicjalizacji ---
function initScrambleVisualizer4x4(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Kontener o id '${containerId}' nie został znaleziony dla wizualizatora tasowania 4x4.`);
        return null;
    }
    container.innerHTML = ''; // Wyczyść poprzednią zawartość

    // Konfiguracja sceny
    visualizerScene = new THREE.Scene();
    
    // Próba załadowania tła
    const loader = new THREE.TextureLoader();
    loader.load(
        '../assets/images/background2.png',
        (texture) => { visualizerScene.background = texture; },
        undefined,
        (error) => { 
            console.warn('Nie można załadować tła dla wizualizatora 4x4, używam prostego tła');
            visualizerScene.background = new THREE.Color(0xc2c2c2);
        }
    );

    // Kamera
    visualizerCamera = new THREE.PerspectiveCamera(
        55,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    visualizerCamera.position.set(6, 6, 8); // Pozycja dostosowana dla kostki 4x4

    // Renderer
    visualizerRenderer = new THREE.WebGLRenderer({ antialias: true });
    visualizerRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(visualizerRenderer.domElement);

    // Oświetlenie
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    visualizerScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 15);
    visualizerScene.add(directionalLight);

    // Kontrolki
    visualizerControls = new THREE.OrbitControls(visualizerCamera, visualizerRenderer.domElement);
    visualizerControls.enableDamping = true;
    visualizerControls.dampingFactor = 0.1;

    // Grupa elementów kostki
    visualizerCubeGroup = new THREE.Group();
    visualizerScene.add(visualizerCubeGroup);

    // Utwórz kostki 4x4 (bez środkowych kostek)
    visualizerCubes = [];
    const totalSize = VISUALIZER_CUBE_SIZE * 4 + VISUALIZER_GAP * 3;
    const offset = totalSize / 2 - VISUALIZER_CUBE_SIZE / 2;

    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
            for (let z = 0; z < 4; z++) {
                // Pomijamy wewnętrzne kostki, które nie są widoczne
                if ((x > 0 && x < 3) && (y > 0 && y < 3) && (z > 0 && z < 3)) continue;

                const geometry = new THREE.BoxGeometry(VISUALIZER_CUBE_SIZE, VISUALIZER_CUBE_SIZE, VISUALIZER_CUBE_SIZE);
                const materials = [
                    new THREE.MeshLambertMaterial({ color: x === 3 ? visualizerColors.right : 0x111111 }), // Prawo
                    new THREE.MeshLambertMaterial({ color: x === 0 ? visualizerColors.left : 0x111111 }),  // Lewo
                    new THREE.MeshLambertMaterial({ color: y === 3 ? visualizerColors.up : 0x111111 }),    // Góra
                    new THREE.MeshLambertMaterial({ color: y === 0 ? visualizerColors.down : 0x111111 }),  // Dół
                    new THREE.MeshLambertMaterial({ color: z === 3 ? visualizerColors.front : 0x111111 }), // Przód
                    new THREE.MeshLambertMaterial({ color: z === 0 ? visualizerColors.back : 0x111111 })   // Tył
                ];

                const cube = new THREE.Mesh(geometry, materials);
                cube.position.x = (x - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
                cube.position.y = (y - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
                cube.position.z = (z - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);

                // Zapisz początkową pozycję logiczną
                const initialPos = { x, y, z };
                cube.userData.initialLogicalPosition = initialPos;
                cube.userData.logicalPosition = { ...initialPos };
                cube.userData.logicalRotation = new THREE.Quaternion();

                visualizerCubeGroup.add(cube);
                visualizerCubes.push(cube);
            }
        }
    }

    // Rozpocznij główną pętlę animacji
    requestAnimationFrame(animateVisualizer4x4);

    // Obsługa zmiany rozmiaru okna
    window.addEventListener('resize', () => {
        visualizerCamera.aspect = container.clientWidth / container.clientHeight;
        visualizerCamera.updateProjectionMatrix();
        visualizerRenderer.setSize(container.clientWidth, container.clientHeight);
    });

    console.log("Inicjalizacja Wizualizatora Tasowania 4x4 w kontenerze:", containerId);
    return {
        displayScrambledState: displayScrambledState4x4,
        resetVisualization: resetVisualization4x4,
        setAnimationSpeed: setAnimationSpeed4x4
    };
}

// --- Pętla Animacji ---
function animateVisualizer4x4() {
    requestAnimationFrame(animateVisualizer4x4);

    if (isAnimating && animationGroup) {
        const elapsed = Date.now() - animationStartTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        
        // Funkcja easingu
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentAngle = animationAngle * easedProgress;
        
        animationGroup.setRotationFromAxisAngle(animationAxis, currentAngle);

        if (progress >= 1) {
            // Animacja zakończona
            isAnimating = false;
            
            // Zastosuj finalną rotację i przenieś kostki z powrotem do głównej grupy
            const finalRotation = new THREE.Quaternion().setFromAxisAngle(animationAxis, animationAngle);
            const animatedCubes = [...animationGroup.children];
            
            // Aktualizuj pozycje kostek na podstawie właśnie zakończonego ruchu
            if (currentAnimatingMove) {
                updateLogicalPositionsAfterRotation4x4(currentAnimatingMove.face, currentAnimatingMove.direction, currentAnimatingMove.double);
            }
            
            animatedCubes.forEach(cube => {
                // Zastosuj skumulowaną rotację
                cube.quaternion.multiplyQuaternions(finalRotation, cube.quaternion);
                
                // Przenieś kostkę z powrotem do głównej grupy
                animationGroup.remove(cube);
                visualizerCubeGroup.add(cube);
            });

            visualizerScene.remove(animationGroup);
            animationGroup = null;
            currentAnimatingMove = null;

            // Zaktualizuj pozycje wizualne
            updateVisualState4x4();

            // Kontynuuj z następnym ruchem z kolejki
            processNextMove4x4();
        }
    }

    visualizerControls.update();
    visualizerRenderer.render(visualizerScene, visualizerCamera);
}

// --- Funkcja wyświetlania zamieszczanego stanu ---
function displayScrambledState4x4(scrambleString, animate = false) {
    console.log(`[Scramble4x4] displayScrambledState wywołane z: "${scrambleString}", animate: ${animate}`);
    
    if (!scrambleString || scrambleString.trim() === "") {
        console.log("[Scramble4x4] Pusty scramble, resetowanie do stanu ułożonego");
        resetVisualization4x4();
        return;
    }

    // Zresetuj do stanu ułożonego
    resetVisualization4x4();

    // Parsuj ruchy
    const moves = parseVisualizerMoves4x4(scrambleString.trim());
    console.log(`[Scramble4x4] Sparsowane ruchy:`, moves);

    if (animate) {
        // Animowana wizualizacja
        moveQueue = [...moves];
        processNextMove4x4();
    } else {
        // Natychmiastowa wizualizacja
        moves.forEach(move => {
            applyLogicalMove4x4(move.face, move.direction, move.double);
        });
        updateVisualState4x4();
        console.log(`[Scramble4x4] Zastosowano ${moves.length} ruchów natychmiastowo`);
    }
}

// --- Funkcja pobierania kostek na warstwie ---
function getCubesOnLayer4x4(face, layer = null) {
    const faceCubes = [];
    
    visualizerCubes.forEach(cube => {
        const pos = cube.userData.logicalPosition;
        let shouldInclude = false;
        
        switch (face) {
            case "F": case "f":
                if (face === "F") shouldInclude = (pos.z === 3);
                else shouldInclude = (pos.z === 2); // f - druga warstwa od przodu
                break;
            case "B": case "b":
                if (face === "B") shouldInclude = (pos.z === 0);
                else shouldInclude = (pos.z === 1); // b - druga warstwa od tyłu
                break;
            case "U": case "u":
                if (face === "U") shouldInclude = (pos.y === 3);
                else shouldInclude = (pos.y === 2); // u - druga warstwa od góry
                break;
            case "D": case "d":
                if (face === "D") shouldInclude = (pos.y === 0);
                else shouldInclude = (pos.y === 1); // d - druga warstwa od dołu
                break;
            case "L": case "l":
                if (face === "L") shouldInclude = (pos.x === 0);
                else shouldInclude = (pos.x === 1); // l - druga warstwa od lewej
                break;
            case "R": case "r":
                if (face === "R") shouldInclude = (pos.x === 3);
                else shouldInclude = (pos.x === 2); // r - druga warstwa od prawej
                break;
            // Ruchy szerokie (wide moves)
            case "Fw":
                shouldInclude = (pos.z >= 2);
                break;
            case "Bw":
                shouldInclude = (pos.z <= 1);
                break;
            case "Uw":
                shouldInclude = (pos.y >= 2);
                break;
            case "Dw":
                shouldInclude = (pos.y <= 1);
                break;
            case "Lw":
                shouldInclude = (pos.x <= 1);
                break;
            case "Rw":
                shouldInclude = (pos.x >= 2);
                break;
        }
        
        if (shouldInclude) {
            faceCubes.push(cube);
        }
    });
    
    return faceCubes;
}

// --- Funkcja rotacji animowanej ---
function rotateFaceAnimated4x4(move) {
    if (isAnimating) {
        console.warn("[Scramble4x4] Już animuję, pomijam ruch:", move);
        return;
    }

    const faceCubes = getCubesOnLayer4x4(move.face);
    if (faceCubes.length === 0) {
        console.warn(`[Scramble4x4] Brak kostek do rotacji dla ruchu: ${move.face}`);
        processNextMove4x4();
        return;
    }

    console.log(`[Scramble4x4] Rozpoczynam animację ruchu: ${move.face}${move.double ? "2" : ""}${move.direction === "counter-clockwise" ? "'" : ""}`);

    // Utwórz grupę animacji
    animationGroup = new THREE.Group();
    visualizerScene.add(animationGroup);
    
    faceCubes.forEach(cube => {
        visualizerCubeGroup.remove(cube);
        animationGroup.add(cube);
    });

    // Określ oś rotacji
    const baseFace = move.face.replace(/[wW]/, '').toLowerCase();
    switch (baseFace) {
        case "f":
            animationAxis = new THREE.Vector3(0, 0, 1);
            break;
        case "b":
            animationAxis = new THREE.Vector3(0, 0, -1);
            break;
        case "u":
            animationAxis = new THREE.Vector3(0, 1, 0);
            break;
        case "d":
            animationAxis = new THREE.Vector3(0, -1, 0);
            break;
        case "l":
            animationAxis = new THREE.Vector3(-1, 0, 0);
            break;
        case "r":
            animationAxis = new THREE.Vector3(1, 0, 0);
            break;
    }

    // Określ kąt rotacji
    animationAngle = move.direction === "clockwise" ? -Math.PI / 2 : Math.PI / 2;
    if (move.double) {
        animationAngle *= 2;
    }

    isAnimating = true;
    animationStartTime = Date.now();
    currentAnimatingMove = move;
}

// --- Funkcja przetwarzania następnego ruchu ---
function processNextMove4x4() {
    if (moveQueue.length > 0 && !isAnimating) {
        const move = moveQueue.shift();
        rotateFaceAnimated4x4(move);
    }
}

// --- Funkcja aktualizacji pozycji logicznych po rotacji ---
function updateLogicalPositionsAfterRotation4x4(face, direction, double) {
    const baseFace = face.replace(/[wW]/, '').toLowerCase();
    const clockwise = direction === "clockwise";
    
    visualizerCubes.forEach(cube => {
        const pos = cube.userData.logicalPosition;
        let newX = pos.x, newY = pos.y, newZ = pos.z;
        let shouldRotate = false;

        // Określ które kostki należy obrócić na podstawie typu ruchu
        switch (face) {
            case "F": case "f":
                shouldRotate = (face === "F" ? pos.z === 3 : pos.z === 2);
                break;
            case "B": case "b":
                shouldRotate = (face === "B" ? pos.z === 0 : pos.z === 1);
                break;
            case "U": case "u":
                shouldRotate = (face === "U" ? pos.y === 3 : pos.y === 2);
                break;
            case "D": case "d":
                shouldRotate = (face === "D" ? pos.y === 0 : pos.y === 1);
                break;
            case "L": case "l":
                shouldRotate = (face === "L" ? pos.x === 0 : pos.x === 1);
                break;
            case "R": case "r":
                shouldRotate = (face === "R" ? pos.x === 3 : pos.x === 2);
                break;
            case "Fw":
                shouldRotate = (pos.z >= 2);
                break;
            case "Bw":
                shouldRotate = (pos.z <= 1);
                break;
            case "Uw":
                shouldRotate = (pos.y >= 2);
                break;
            case "Dw":
                shouldRotate = (pos.y <= 1);
                break;
            case "Lw":
                shouldRotate = (pos.x <= 1);
                break;
            case "Rw":
                shouldRotate = (pos.x >= 2);
                break;
        }

        if (shouldRotate) {
            // Zastosuj transformację pozycji zgodnie z logiką z generate4x4Cube.js
            switch (baseFace) {
                case "f":
                    if (clockwise) {
                        [newX, newY] = [pos.y, 3 - pos.x];
                    } else {
                        [newX, newY] = [3 - pos.y, pos.x];
                    }
                    if (double) {
                        [newX, newY] = [3 - pos.x, 3 - pos.y];
                    }
                    break;
                case "b":
                    if (clockwise) {
                        [newX, newY] = [3 - pos.y, pos.x];
                    } else {
                        [newX, newY] = [pos.y, 3 - pos.x];
                    }
                    if (double) {
                        [newX, newY] = [3 - pos.x, 3 - pos.y];
                    }
                    break;
                case "u":
                    if (clockwise) {
                        [newX, newZ] = [3 - pos.z, pos.x];
                    } else {
                        [newX, newZ] = [pos.z, 3 - pos.x];
                    }
                    if (double) {
                        [newX, newZ] = [3 - pos.x, 3 - pos.z];
                    }
                    break;
                case "d":
                    if (clockwise) {
                        [newX, newZ] = [pos.z, 3 - pos.x];
                    } else {
                        [newX, newZ] = [3 - pos.z, pos.x];
                    }
                    if (double) {
                        [newX, newZ] = [3 - pos.x, 3 - pos.z];
                    }
                    break;
                case "l":
                    if (clockwise) {
                        [newY, newZ] = [3 - pos.z, pos.y];
                    } else {
                        [newY, newZ] = [pos.z, 3 - pos.y];
                    }
                    if (double) {
                        [newY, newZ] = [3 - pos.y, 3 - pos.z];
                    }
                    break;
                case "r":
                    if (clockwise) {
                        [newY, newZ] = [pos.z, 3 - pos.y];
                    } else {
                        [newY, newZ] = [3 - pos.z, pos.y];
                    }
                    if (double) {
                        [newY, newZ] = [3 - pos.y, 3 - pos.z];
                    }
                    break;
            }

            cube.userData.logicalPosition = { x: newX, y: newY, z: newZ };
        }
    });
}

// --- Funkcja parsowania ruchów ---
function parseVisualizerMoves4x4(scrambleString) {
    const moves = [];
    const cleanedSequence = scrambleString.replace(/[()]/g, '').trim();
    const moveTokens = cleanedSequence.split(/\s+/);

    for (const move of moveTokens) {
        const match = move.match(/^([FBLRUDfblrud]w?)(['']?|2)$/);
        if (!match) {
            console.warn(`[Scramble4x4] Nieprawidłowy ruch: ${move}`);
            continue;
        }

        const face = match[1];
        const modifier = match[2];
        const isCounterclockwise = modifier === "'" || modifier === "'";
        const isDoubleMove = modifier === "2";

        moves.push({
            face,
            direction: isCounterclockwise ? "counter-clockwise" : "clockwise",
            double: isDoubleMove
        });

        if (isDoubleMove) {
            // Dla ruchu podwójnego dodaj drugi taki sam ruch
            moves.push({
                face,
                direction: isCounterclockwise ? "counter-clockwise" : "clockwise",
                double: false // Drugi ruch nie jest podwójny
            });
        }
    }

    return moves;
}

// --- Funkcja stosowania logicznego ruchu ---
function applyLogicalMove4x4(face, direction, double) {
    updateLogicalPositionsAfterRotation4x4(face, direction, double);
}

// --- Funkcja aktualizacji stanu wizualnego ---
function updateVisualState4x4() {
    visualizerCubes.forEach(cube => {
        const pos = cube.userData.logicalPosition;
        cube.position.x = (pos.x - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        cube.position.y = (pos.y - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        cube.position.z = (pos.z - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
    });
}

// --- Funkcja resetowania wizualizacji ---
function resetVisualization4x4() {
    console.log("[Scramble4x4] Resetowanie wizualizacji");
    
    // Zatrzymaj wszelkie animacje
    isAnimating = false;
    moveQueue = [];
    
    if (animationGroup) {
        const childrenToMove = [...animationGroup.children];
        childrenToMove.forEach(cube => {
            animationGroup.remove(cube);
            visualizerCubeGroup.add(cube);
        });
        visualizerScene.remove(animationGroup);
        animationGroup = null;
    }
    
    currentAnimatingMove = null;

    // Zresetuj pozycje logiczne i rotacje wszystkich kostek
    visualizerCubes.forEach(cube => {
        cube.userData.logicalPosition = { ...cube.userData.initialLogicalPosition };
        cube.quaternion.copy(cube.userData.logicalRotation);
        
        const pos = cube.userData.logicalPosition;
        cube.position.x = (pos.x - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        cube.position.y = (pos.y - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        cube.position.z = (pos.z - 1.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
    });
}

// --- Funkcja ustawiania prędkości animacji ---
function setAnimationSpeed4x4(durationMs) {
    ANIMATION_DURATION = Math.max(50, Math.min(durationMs, 2000)); // Ograniczenie między 50ms a 2s
    console.log(`[Scramble4x4] Prędkość animacji ustawiona na: ${ANIMATION_DURATION}ms`);
}

// --- Obiekt globalny dla kompatybilności ---
if (typeof window !== 'undefined') {
    window.ScrambleVisualizer4x4 = {
        init: initScrambleVisualizer4x4
    };
}

// Eksport dla modułów (jeśli jest używany)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrambleVisualizer4x4;
} 