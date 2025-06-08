// Bazuje na generateCube.js, ale uproszczony dla statycznej wizualizacji
// TERAZ Z DODANĄ (OPCJONALNĄ) ANIMACJĄ

let visualizerScene, visualizerCamera, visualizerRenderer, visualizerControls, visualizerCubeGroup;
let visualizerCubes = []; // Tablica przechowująca elementy kostki dla tego wizualizatora
const VISUALIZER_CUBE_SIZE = 1;
const VISUALIZER_GAP = 0.05;

// --- Ustawienia Animacji --- (Skopiowane z generateCube.js, można dostosować)
let ANIMATION_DURATION = 300; // ms - Domyślna prędkość animacji
let isAnimating = false;
let animationStartTime = 0;
let animationGroup = null;
let animationAxis = null;
let animationAngle = 0;
let moveQueue = [];
let currentAnimatingMove = null; // Przechowuje { face, direction, double }

// Kolory (mogą być ponownie użyte lub dostosowane)
const visualizerColors = {
    front: 0x00ff00, // Zielony
    back: 0x0000ff, // Niebieski
    up: 0xffffff, // Biały
    down: 0xffff00, // Żółty
    left: 0xffa500, // Pomarańczowy
    right: 0xff0000 // Czerwony
};

// --- Funkcja Inicjalizacji ---
function initScrambleVisualizer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Kontener o id '${containerId}' nie został znaleziony dla wizualizatora tasowania.`);
        return null;
    }
    container.innerHTML = ''; // Wyczyść poprzednią zawartość

    // Konfiguracja sceny
    visualizerScene = new THREE.Scene();
    visualizerScene.background = new THREE.Color(0xc2c2c2); // Jednolity szary kolor dla wszystkich wizualizatorów

    // Kamera
    visualizerCamera = new THREE.PerspectiveCamera(
        55,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    visualizerCamera.position.set(4, 4, 6); // Nieco inna pozycja być może

    // Renderer
    visualizerRenderer = new THREE.WebGLRenderer({ antialias: true });
    visualizerRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(visualizerRenderer.domElement);

    // Oświetlenie
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    visualizerScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5);
    visualizerScene.add(directionalLight);

    // Kontrolki
    visualizerControls = new THREE.OrbitControls(visualizerCamera, visualizerRenderer.domElement);
    visualizerControls.enableDamping = true;
    visualizerControls.dampingFactor = 0.1;

    // Grupa elementów kostki
    visualizerCubeGroup = new THREE.Group();
    visualizerScene.add(visualizerCubeGroup);

    // Utwórz 27 małych kostek
    visualizerCubes = []; // Zresetuj tablicę dla tej instancji
    const totalSize = VISUALIZER_CUBE_SIZE * 3 + VISUALIZER_GAP * 2;
    const offset = totalSize / 2 - VISUALIZER_CUBE_SIZE / 2;

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                if (x === 1 && y === 1 && z === 1) continue; // Pomiń środkowy element

                const geometry = new THREE.BoxGeometry(VISUALIZER_CUBE_SIZE, VISUALIZER_CUBE_SIZE, VISUALIZER_CUBE_SIZE);
                const materials = [
                    new THREE.MeshLambertMaterial({ color: x === 2 ? visualizerColors.right : 0x111111 }), // Prawo
                    new THREE.MeshLambertMaterial({ color: x === 0 ? visualizerColors.left : 0x111111 }),  // Lewo
                    new THREE.MeshLambertMaterial({ color: y === 2 ? visualizerColors.up : 0x111111 }),    // Góra
                    new THREE.MeshLambertMaterial({ color: y === 0 ? visualizerColors.down : 0x111111 }),  // Dół
                    new THREE.MeshLambertMaterial({ color: z === 2 ? visualizerColors.front : 0x111111 }), // Przód
                    new THREE.MeshLambertMaterial({ color: z === 0 ? visualizerColors.back : 0x111111 })   // Tył
                ];

                const cube = new THREE.Mesh(geometry, materials);
                cube.position.x = (x - 1) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
                cube.position.y = (y - 1) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
                cube.position.z = (z - 1) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);

                // Zapisz początkową pozycję logiczną (0, 1 lub 2 dla x, y, z)
                const initialPos = { x, y, z };
                cube.userData.initialLogicalPosition = initialPos; // Zapisz początkową
                cube.userData.logicalPosition = { ...initialPos }; // Ustaw aktualną pozycję logiczną
                // Zapisz początkową rotację
                cube.userData.logicalRotation = new THREE.Quaternion();

                visualizerCubeGroup.add(cube);
                visualizerCubes.push(cube);
            }
        }
    }

    // Rozpocznij główną pętlę animacji
    requestAnimationFrame(animateVisualizer);

    // Obsługa zmiany rozmiaru okna
    window.addEventListener('resize', () => {
        visualizerCamera.aspect = container.clientWidth / container.clientHeight;
        visualizerCamera.updateProjectionMatrix();
        visualizerRenderer.setSize(container.clientWidth, container.clientHeight);
    });

    console.log("Inicjalizacja Wizualizatora Tasowania w kontenerze:", containerId);
    return { // Zwróć metody do interakcji z tą instancją
        displayScrambledState: displayScrambledState,
        resetVisualization: resetVisualization,
        setAnimationSpeed: setAnimationSpeed // Nowa funkcja
    };
}

// --- Pętla Animacji (Teraz obsługuje także animację ruchu) ---
function animateVisualizer() {
    requestAnimationFrame(animateVisualizer);

    // Dodaj licznik do śledzenia iteracji pętli (raz na sekundę)
    if (!window.animFrameCounter) {
        window.animFrameCounter = 0;
        window.lastAnimFrameLog = Date.now();
    }
    
    window.animFrameCounter++;
    const now = Date.now();
    if (now - window.lastAnimFrameLog > 1000) {
        console.log(`[DEBUG] Pętla animacji działa (${window.animFrameCounter} klatek w ostatniej sekundzie)`);
        window.animFrameCounter = 0;
        window.lastAnimFrameLog = now;
    }

    if (isAnimating) {
        const elapsed = Date.now() - animationStartTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const rotationAmount = animationAngle * progress;

        if (animationGroup) {
            animationGroup.setRotationFromAxisAngle(animationAxis, rotationAmount);
            if (progress % 0.25 < 0.01) { // Log przy około 0%, 25%, 50%, 75%
                console.log(`[DEBUG] Postęp animacji: ${(progress*100).toFixed(0)}%, kąt: ${rotationAmount.toFixed(2)}`);
            }
        }

        if (progress === 1) {
            console.log(`[Anim] Postęp 1 dla: ${currentAnimatingMove ? JSON.stringify(currentAnimatingMove) : 'null'}`);
            // Animacja zakończona dla tego ruchu
            isAnimating = false;

            // !! WAŻNE: Zaktualizuj stan logicny na podstawie ZAMIERZONEGO ruchu !!
            if (currentAnimatingMove) {
                updateLogicalPositionsAfterRotation(currentAnimatingMove.face, currentAnimatingMove.direction, currentAnimatingMove.double);
            } else {
                console.error("currentAnimatingMove było nullem gdy animacja zakończyła się!");
                // Próba naprawy - aktualizacja na podstawie osi/kąta animacji?
                const face = animationAxis.x !== 0 ? (animationAxis.x > 0 ? "R" : "L")
                          : animationAxis.y !== 0 ? (animationAxis.y > 0 ? "U" : "D")
                          : (animationAxis.z > 0 ? "F" : "B");
                const direction = animationAngle > 0 ? "counter-clockwise" : "clockwise";
                updateLogicalPositionsAfterRotation(face, direction, false); // Załóż pojedynczy
            }

            // Przenieś kostki z powrotem do głównej grupy
            if (animationGroup) {
                // Odłącz dzieci przed potencjalną dalszą manipulacją
                const childrenToMove = [...animationGroup.children];
                childrenToMove.forEach(cube => {
                    animationGroup.remove(cube);
                    visualizerCubeGroup.add(cube);
                    // !! KRYTYCZNE: Zaktualizuj stan wizualny PO przeniesieniu z powrotem !!
                    // Polegaj na updateVisualState, aby ustawić ostateczną pozycję/rotację na podstawie stanu LOGICZNEGO
                });

                visualizerScene.remove(animationGroup);
                animationGroup = null;
            }

            // Zaktualizuj cały stan wizualny na podstawie NOWEGO stanu logicznego
            updateVisualState();

            currentAnimatingMove = null; // Wyczyść ukończony ruch

            console.log(`[Anim] Czyszczenie zakończone. Kolejka: ${moveQueue.length}. Wywołanie processNextMove.`);
            // Przetwórz następny ruch w kolejce
            processNextMove();
        }
    }

    if (visualizerControls) visualizerControls.update();
    if (visualizerRenderer) visualizerRenderer.render(visualizerScene, visualizerCamera);
}

// --- Function to Apply Scramble ---
// --- Funkcja do zastosowania tasowania ---
function displayScrambledState(scrambleString, animate = false) { // Added animate parameter
    if (!visualizerCubes || visualizerCubes.length === 0) {
        console.error("Visualizer not initialized or no cubes found.");
        return;
    }

    // Stop any ongoing animation and clear queue
    // Zatrzymaj trwającą animację i wyczyść kolejkę
    isAnimating = false;
    moveQueue = [];
    currentAnimatingMove = null; // Clear this too
    if (animationGroup) {
        // Cleanup pieces from previous potentially interrupted animation
        // Wyczyść elementy z poprzedniej potencjalnie przerwanej animacji
        const childrenToMove = [...animationGroup.children];
        childrenToMove.forEach(cube => {
            animationGroup.remove(cube);
            visualizerCubeGroup.add(cube);
        });
        visualizerScene.remove(animationGroup);
        animationGroup = null;
    }

    // 1. Reset logical state & update visual state
    // 1. Zresetuj stan logiczny i zaktualizuj stan wizualny
    resetLogicalState();
    updateVisualState();

    // 2. Parse moves
    // 2. Analizuj ruchy
    const moves = parseVisualizerMoves(scrambleString);
    if (!moves || moves.length === 0) {
        console.warn("Empty or invalid scramble string provided for displayScrambledState.");
        return;
    }

    if (animate) {
        // 3a. Add moves to queue and start animation
        // 3a. Dodaj ruchy do kolejki i rozpocznij animację
        console.log("Starting animated scramble:", moves);
        // Store full move info in queue
        // Przechowaj pełne informacje o ruchu w kolejce
        moveQueue = moves.map(m => ({ face: m.face, direction: m.direction, double: m.double }));
        processNextMove();
    } else {
        // 3b. Apply all moves logically at once
        // 3b. Zastosuj wszystkie ruchy logicznie za jednym razem
        console.log("Applying instant scramble:", moves);
        moves.forEach(move => {
            applyLogicalMove(move.face, move.direction, move.double);
        });
        // 4. Update the visual state
        // 4. Zaktualizuj stan wizualny
        updateVisualState();
    }
    // console.log("Displayed scrambled state for:", scrambleString, "Animated:", animate); // Reduce console noise
}

// --- Helper Functions for Logical State and Animation ---
// --- Funkcje pomocnicze dla stanu logicznego i animacji ---

// Function to get cubes on a specific layer (modified from generateCube)
// Funkcja do pobierania kostek na określonej warstwie (zmodyfikowana z generateCube)
function getCubesOnLayer(axis, layerIndex) {
    const layerCubes = [];
    
    // Print debugging information for all cubes' positions
    // Wydrukuj informacje debugowania dla pozycji wszystkich kostek
    console.log("[DEBUG] Looking for cubes on " + axis + "=" + layerIndex);
    console.log("[DEBUG] Cube logical positions:");
    visualizerCubes.forEach((cube, i) => {
        const pos = cube.userData.logicalPosition;
        if (i < 5) { // Only log the first few to avoid console spam
                     // Loguj tylko kilka pierwszych, aby uniknąć spamu konsoli
            console.log(`Cube ${i}: x=${pos.x}, y=${pos.y}, z=${pos.z}`);
        }
    });
    
    // This ensures we explicitly check the right property
    // To zapewnia, że jawnie sprawdzamy właściwą właściwość
    visualizerCubes.forEach(cube => {
        const pos = cube.userData.logicalPosition;
        let isOnLayer = false;
        
        if (axis === 'x' && pos.x === layerIndex) isOnLayer = true;
        else if (axis === 'y' && pos.y === layerIndex) isOnLayer = true;
        else if (axis === 'z' && pos.z === layerIndex) isOnLayer = true;
        
        if (isOnLayer) {
            layerCubes.push(cube);
        }
    });
    
    console.log("[DEBUG] Found " + layerCubes.length + " cubes on " + axis + "=" + layerIndex);
    return layerCubes;
}

// Function to start a face rotation animation
// Funkcja do rozpoczęcia animacji obrotu ściany
function rotateFaceAnimated(move) { // Accepts the full move object
                                    // Przyjmuje pełny obiekt ruchu
    if (isAnimating) {
        console.warn("Animation already in progress, skipping move:", move);
        return;
    }

    currentAnimatingMove = move; // Store the move being animated
                                 // Przechowaj ruch, który jest animowany
    const { face, direction } = move;
    console.log("[DEBUG] Starting rotation animation for face:", face, "direction:", direction);

    let layerAxis = '';
    let layerIndex = -1;
    switch (face) {
        case "F": layerAxis = 'z'; layerIndex = 2; animationAxis = new THREE.Vector3(0, 0, 1); break;
        case "B": layerAxis = 'z'; layerIndex = 0; animationAxis = new THREE.Vector3(0, 0, -1); break;
        case "U": layerAxis = 'y'; layerIndex = 2; animationAxis = new THREE.Vector3(0, 1, 0); break;
        case "D": layerAxis = 'y'; layerIndex = 0; animationAxis = new THREE.Vector3(0, -1, 0); break;
        case "L": layerAxis = 'x'; layerIndex = 0; animationAxis = new THREE.Vector3(-1, 0, 0); break;
        case "R": layerAxis = 'x'; layerIndex = 2; animationAxis = new THREE.Vector3(1, 0, 0); break;
        default: return;
    }

    const faceCubes = getCubesOnLayer(layerAxis, layerIndex);
    console.log("[DEBUG] Found", faceCubes.length, "cubes for face", face, "on axis", layerAxis, "at index", layerIndex);
    
    if (faceCubes.length === 0) {
        console.error("[DEBUG] No cubes found for this face rotation!");
        currentAnimatingMove = null; // Abort if no cubes
                                     // Przerwij, jeśli nie znaleziono kostek
        return;
    }

    // Create a temporary group for the animation
    // Stwórz tymczasową grupę dla animacji
    animationGroup = new THREE.Group();
    visualizerScene.add(animationGroup);
    faceCubes.forEach((cube) => {
        visualizerCubeGroup.remove(cube);
        animationGroup.add(cube);
    });
    console.log("[DEBUG] Created animation group with", animationGroup.children.length, "cubes");

    // Determine rotation angle (always 90 degrees for one animation step)
    // Określ kąt obrotu (zawsze 90 stopni dla jednego kroku animacji)
    animationAngle = ((direction === "clockwise" ? -1 : 1) * Math.PI) / 2;

    // Start animation timer
    // Uruchom timer animacji
    isAnimating = true;
    animationStartTime = Date.now();
    console.log("[DEBUG] Animation started at", animationStartTime, "with angle", animationAngle);
}

// Function to process the next move in the queue
// Funkcja do przetwarzania następnego ruchu w kolejce
function processNextMove() {
    if (moveQueue.length === 0 || isAnimating) {
        // Optional log if needed: console.log(`[Proc] Skip. Queue: ${moveQueue.length}, Animating: ${isAnimating}`);
        // Opcjonalny log, jeśli potrzebny: console.log(`[Proc] Pomiń. Kolejka: ${moveQueue.length}, Animacja: ${isAnimating}`);
        return;
    }

    const move = moveQueue.shift(); // Get the full move object
                                   // Pobierz pełny obiekt ruchu
    console.log(`[Proc] Processing move: ${JSON.stringify(move)}. Queue left: ${moveQueue.length}`);

    // !! Proper Double Move Handling !!
    // !! Właściwa obsługa podwójnego ruchu !!
    // Queue two separate 90-degree turns for double moves
    // Ustaw w kolejce dwa osobne obroty 90-stopniowe dla podwójnych ruchów
    if (move.double) {
        const singleMove1 = { ...move, double: false };
        const singleMove2 = { ...move, double: false };
        // Put the second turn back at the front of the queue
        // Umieść drugi obrót z powrotem na początku kolejki
        moveQueue.unshift(singleMove2);
        // Start the first turn
        // Rozpocznij pierwszy obrót
        rotateFaceAnimated(singleMove1);
    } else {
        // Start the single turn
        // Rozpocznij pojedynczy obrót
        rotateFaceAnimated(move);
    }
}

// Updates LOGICAL positions after an animated turn completes
// Aktualizuje LOGICZNE pozycje po zakończeniu animowanego obrotu
function updateLogicalPositionsAfterRotation(face, direction, double) {
    // Now calls applyLogicalMove with the correct double flag
    // Teraz wywołuje applyLogicalMove z poprawną flagą double
    applyLogicalMove(face, direction, double);
}

// Reset logical position and rotation data for all cubes
// Resetuj dane pozycji logicznej i rotacji dla wszystkich kostek
function resetLogicalState() {
    visualizerCubes.forEach(cube => {
        // Reset logical position TO THE STORED INITIAL position
        // Resetuj pozycję logiczną DO ZAPISANEJ POCZĄTKOWEJ pozycji
        if (cube.userData.initialLogicalPosition) {
            cube.userData.logicalPosition = { ...cube.userData.initialLogicalPosition };
        } else {
            // Fallback in case initial wasn't stored (should not happen)
            // Alternatywa w przypadku, gdy początkowa nie została zapisana (nie powinno się zdarzyć)
            const x = Math.round((cube.position.x / (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP)) + 1);
            const y = Math.round((cube.position.y / (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP)) + 1);
            const z = Math.round((cube.position.z / (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP)) + 1);
            cube.userData.logicalPosition = { x, y, z };
        }
        cube.userData.logicalRotation = new THREE.Quaternion(); // Reset rotation to identity
                                                               // Resetuj rotację do tożsamości
    });
}

// Parse scramble string into face, direction, double
// Analizuj ciąg tasowania na ścianę, kierunek, podwójny
function parseVisualizerMoves(scrambleString) {
    return scrambleString.trim().split(/\s+/).map(moveStr => {
        if (!moveStr) return null;
        const face = moveStr[0].toUpperCase();
        let direction = 'clockwise'; // Default R, U, F, L, B, D
        let double = false;
        if (moveStr.length > 1) {
            if (moveStr[1] === '\'') {
                direction = 'counter-clockwise';
            } else if (moveStr[1] === '2') {
                double = true;
            }
        }
        // Basic validation
        if (!['F', 'B', 'U', 'D', 'L', 'R'].includes(face)) return null;
        return { face, direction, double };
    }).filter(move => move !== null); // Filter out any invalid parts
}

// Apply a single move to the logical state (position and rotation)
// Zastosuj pojedynczy ruch do stanu logicznego (pozycja i rotacja)
function applyLogicalMove(face, direction, double) {
    const angle = (direction === 'clockwise' ? -1 : 1) * (Math.PI / 2);
    const turns = double ? 2 : 1;

    for (let i = 0; i < turns; i++) {
        const rotationAxis = new THREE.Vector3();
        const rotationAngle = angle;
        let layerIndex = -1; // For identifying which cubes to move

        switch (face) {
            case 'F': rotationAxis.set(0, 0, 1); layerIndex = 2; break;
            case 'B': rotationAxis.set(0, 0, -1); layerIndex = 0; break;
            case 'U': rotationAxis.set(0, 1, 0); layerIndex = 2; break;
            case 'D': rotationAxis.set(0, -1, 0); layerIndex = 0; break;
            case 'L': rotationAxis.set(-1, 0, 0); layerIndex = 0; break;
            case 'R': rotationAxis.set(1, 0, 0); layerIndex = 2; break;
            default: return; // Invalid face
        }

        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis.normalize(), rotationAngle);
        const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(rotationQuaternion);

        visualizerCubes.forEach(cube => {
            const pos = cube.userData.logicalPosition;
            let isOnLayer = false;

            // Check if the cube is on the layer being turned
            if ((face === 'F' || face === 'B') && pos.z === layerIndex) isOnLayer = true;
            else if ((face === 'U' || face === 'D') && pos.y === layerIndex) isOnLayer = true;
            else if ((face === 'L' || face === 'R') && pos.x === layerIndex) isOnLayer = true;

            if (isOnLayer) {
                // Update logical position
                // Convert logical {0,1,2} position to centered Vector3 for rotation math
                let tempPos = new THREE.Vector3(pos.x - 1, pos.y - 1, pos.z - 1);
                tempPos.applyMatrix4(rotationMatrix);
                // Convert back to {0,1,2} logical position
                pos.x = Math.round(tempPos.x + 1);
                pos.y = Math.round(tempPos.y + 1);
                pos.z = Math.round(tempPos.z + 1);

                // Update logical rotation
                cube.userData.logicalRotation.premultiply(rotationQuaternion);
            }
        });
    }
}

// Update the actual THREE.Mesh positions and rotations based on logical state
// Aktualizuj rzeczywiste pozycje i rotacje THREE.Mesh na podstawie stanu logicznego
function updateVisualState() {
    visualizerCubes.forEach(cube => {
        const logicalPos = cube.userData.logicalPosition;
        // Calculate visual position based on logical position
        cube.position.x = (logicalPos.x - 1) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        cube.position.y = (logicalPos.y - 1) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        cube.position.z = (logicalPos.z - 1) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        // Apply logical rotation
        cube.quaternion.copy(cube.userData.logicalRotation);
    });
    if (visualizerRenderer) {
        visualizerRenderer.render(visualizerScene, visualizerCamera);
    }
}

// --- New function to reset the visualizer externally ---
// --- Nowa funkcja do resetowania wizualizatora zewnętrznie ---
function resetVisualization() {
    resetLogicalState();
    updateVisualState();
    console.log("Visualizer reset to solved state.");
}

// --- New function to set animation speed ---
// --- Nowa funkcja do ustawienia prędkości animacji ---
function setAnimationSpeed(durationMs) {
    if (typeof durationMs === 'number' && durationMs > 0) {
        ANIMATION_DURATION = durationMs;
        console.log("Animation duration set to:", durationMs);
    } else {
        console.warn("Invalid animation duration provided:", durationMs);
    }
}

// Expose the init function globally or via a module system if needed
// Udostępnij funkcję inicjalizacji globalnie lub poprzez system modułów, jeśli potrzeba
window.ScrambleVisualizer = {
    init: initScrambleVisualizer
}; 