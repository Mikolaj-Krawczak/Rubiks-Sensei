const CUBE_SIZE = 1;
const GAP = 0.02;
const ANIMATION_DURATION = 500; // ms
const cubespace = document.getElementById("cubespace");

// Konfiguracja sceny
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
loader.load(
    '../assets/images/background2.png',
    (texture) => { scene.background = texture; },
    undefined,
    (error) => { console.error('Błąd ładowania tła:', error); scene.background = new THREE.Color(0xc2c2c2); }
);

const camera = new THREE.PerspectiveCamera(
    55,
    cubespace.clientWidth / cubespace.clientHeight,
    0.1,
    1000
);
camera.position.set(6, 6, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(cubespace.clientWidth, cubespace.clientHeight);
cubespace.appendChild(renderer.domElement);

// Oświetlenie
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// Kontrolki do obracania całej kostki
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Elementy kostki
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

// Kolory ścianek kostki
const colors = {
    front: 0x00ff00, // Zielony
    back: 0x0000ff, // Niebieski
    up: 0xffffff, // Biały
    down: 0xffff00, // Żółty
    left: 0xffa500, // Pomarańczowy
    right: 0xff0000 // Czerwony
};

// Utworzenie 64 małych kostek (4x4x4 - bez środkowych kostek)
const cubes = [];
const totalSize = CUBE_SIZE * 4 + GAP * 3;
const offset = totalSize / 2 - CUBE_SIZE / 2;

for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
        for (let z = 0; z < 4; z++) {
            // Pomijamy wewnętrzne kostki, które nie są widoczne
            if ((x > 0 && x < 3) && (y > 0 && y < 3) && (z > 0 && z < 3)) continue;

            const geometry = new THREE.BoxGeometry(
                CUBE_SIZE,
                CUBE_SIZE,
                CUBE_SIZE
            );
            const materials = [];

            // Prawa ściana (x === 3)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: x === 3 ? colors.right : 0x111111,
                })
            );
            // Lewa ściana (x === 0)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: x === 0 ? colors.left : 0x111111,
                })
            );
            // Górna ściana (y === 3)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: y === 3 ? colors.up : 0x111111,
                })
            );
            // Dolna ściana (y === 0)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: y === 0 ? colors.down : 0x111111,
                })
            );
            // Przednia ściana (z === 3)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: z === 3 ? colors.front : 0x111111,
                })
            );
            // Tylna ściana (z === 0)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: z === 0 ? colors.back : 0x111111,
                })
            );

            const cube = new THREE.Mesh(geometry, materials);
            cube.position.x = (x - 1.5) * (CUBE_SIZE + GAP);
            cube.position.y = (y - 1.5) * (CUBE_SIZE + GAP);
            cube.position.z = (z - 1.5) * (CUBE_SIZE + GAP);
            cube.userData.originalPosition = cube.position.clone();
            cube.userData.currentPosition = { x, y, z };
            cubeGroup.add(cube);
            cubes.push(cube);
        }
    }
}

// Stan animacji
let isAnimating = false;
let animationStartTime = 0;
let animationGroup = null;
let animationAxis = null;
let animationAngle = 0;
let moveQueue = [];
let moveHistory = [];
let currentMoveIndex = -1;
let currentExecutingMove = null;
let cubesInAnimation = [];

// Funkcja do pobierania kostek na określonej ściance/warstwie
function getCubesOnFace(face) {
    const faceCubes = [];
    switch (face) {
        case "F": // Front face
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z === 3) faceCubes.push(cube);
            });
            break;
        case "B": // Back face
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z === 0) faceCubes.push(cube);
            });
            break;
        case "U": // Upper face
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y === 3) faceCubes.push(cube);
            });
            break;
        case "D": // Down face
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y === 0) faceCubes.push(cube);
            });
            break;
        case "L": // Left face
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x === 0) faceCubes.push(cube);
            });
            break;
        case "R": // Right face
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x === 3) faceCubes.push(cube);
            });
            break;
        // Ruchy wewnętrznych warstw (slice moves) - tylko jedna warstwa wewnętrzna
        case "r": // druga warstwa od prawej (wyłączając R)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x === 2) faceCubes.push(cube);
            });
            break;
        case "l": // druga warstwa od lewej (wyłączając L)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x === 1) faceCubes.push(cube);
            });
            break;
        case "u": // druga warstwa od góry (wyłączając U)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y === 2) faceCubes.push(cube);
            });
            break;
        case "d": // druga warstwa od dołu (wyłączając D)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y === 1) faceCubes.push(cube);
            });
            break;
        case "f": // druga warstwa od przodu (wyłączając F)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z === 2) faceCubes.push(cube);
            });
            break;
        case "b": // druga warstwa od tyłu (wyłączając B)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z === 1) faceCubes.push(cube);
            });
            break;
        // Ruchy dwóch warstw (wide moves)
        case "Rw": // dwie warstwy od prawej
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x >= 2) faceCubes.push(cube);
            });
            break;
        case "Lw": // dwie warstwy od lewej
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x <= 1) faceCubes.push(cube);
            });
            break;
        case "Uw": // dwie warstwy od góry
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y >= 2) faceCubes.push(cube);
            });
            break;
        case "Dw": // dwie warstwy od dołu
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y <= 1) faceCubes.push(cube);
            });
            break;
        case "Fw": // dwie warstwy od przodu
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z >= 2) faceCubes.push(cube);
            });
            break;
        case "Bw": // dwie warstwy od tyłu
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z <= 1) faceCubes.push(cube);
            });
            break;
    }
    return faceCubes;
}

// Funkcja do rozpoczęcia obrotu ścianki
function rotateFace(face, direction, isReplay = false) {
    if (isAnimating) return;
    const faceCubes = getCubesOnFace(face);
    if (faceCubes.length === 0) return;

    // Zapisz kostki biorące udział w animacji
    cubesInAnimation = [...faceCubes];

    animationGroup = new THREE.Group();
    scene.add(animationGroup);
    faceCubes.forEach((cube) => {
        cubeGroup.remove(cube);
        animationGroup.add(cube);
        // Nie zmieniamy pozycji ani rotacji - pozostawiamy relatywne do grupy animacji
    });

    // Określenie osi obrotu na podstawie rodzaju ruchu - wracamy do oryginalnej logiki 3x3
    const baseFace = face.replace(/[wW']/, '').replace(/[2']/, '');
    switch (baseFace) {
        case "F":
        case "f":
            animationAxis = new THREE.Vector3(0, 0, 1);
            break;
        case "B":
        case "b":
            animationAxis = new THREE.Vector3(0, 0, -1); // Przywracamy pierwotny kierunek
            break;
        case "U":
        case "u":
            animationAxis = new THREE.Vector3(0, 1, 0);
            break;
        case "D":
        case "d":
            animationAxis = new THREE.Vector3(0, -1, 0); // Przywracamy pierwotny kierunek
            break;
        case "L":
        case "l":
            animationAxis = new THREE.Vector3(-1, 0, 0); // Przywracamy pierwotny kierunek
            break;
        case "R":
        case "r":
            animationAxis = new THREE.Vector3(1, 0, 0);
            break;
    }

    // Prosty wzór rotacji jak w kostce 3x3
    animationAngle = direction === "clockwise" ? -Math.PI / 2 : Math.PI / 2;
    if (face.includes("2")) {
        animationAngle *= 2;
    }

    isAnimating = true;
    animationStartTime = Date.now();
    currentExecutingMove = { face, direction };

    if (!isReplay) {
        moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
        moveHistory.push({ face, direction });
        currentMoveIndex = moveHistory.length - 1;
    }
}

// Funkcja do aktualizacji pozycji kostek po obrocie
function updateCubePositions(face, direction) {
    const baseFace = face.replace(/[wW']/, '').replace(/[2']/, '');
    
    cubesInAnimation.forEach((cube) => {
        const pos = cube.userData.currentPosition;
        let newX = pos.x, newY = pos.y, newZ = pos.z;

        const clockwise = direction === "clockwise";
        const double = face.includes("2");

        switch (baseFace) {
            case "F":
            case "f":
                // Rotacja wokół osi Z (płaszczyzna XY) - jak w kostce 3x3
                if (clockwise) {
                    [newX, newY] = [pos.y, 3 - pos.x];
                } else {
                    [newX, newY] = [3 - pos.y, pos.x];
                }
                if (double) {
                    [newX, newY] = [3 - pos.x, 3 - pos.y];
                }
                break;
            case "B":
            case "b":
                // Rotacja wokół osi Z (płaszczyzna XY) - odwrotnie niż F
                if (clockwise) {
                    [newX, newY] = [3 - pos.y, pos.x];
                } else {
                    [newX, newY] = [pos.y, 3 - pos.x];
                }
                if (double) {
                    [newX, newY] = [3 - pos.x, 3 - pos.y];
                }
                break;
            case "U":
            case "u":
                // Rotacja wokół osi Y (płaszczyzna XZ) - działa dobrze
                if (clockwise) {
                    [newX, newZ] = [3 - pos.z, pos.x];
                } else {
                    [newX, newZ] = [pos.z, 3 - pos.x];
                }
                if (double) {
                    [newX, newZ] = [3 - pos.x, 3 - pos.z];
                }
                break;
            case "D":
            case "d":
                // Rotacja wokół osi Y (płaszczyzna XZ) - odwrotnie niż U
                if (clockwise) {
                    [newX, newZ] = [pos.z, 3 - pos.x];
                } else {
                    [newX, newZ] = [3 - pos.z, pos.x];
                }
                if (double) {
                    [newX, newZ] = [3 - pos.x, 3 - pos.z];
                }
                break;
            case "L":
            case "l":
                // Rotacja wokół osi X (płaszczyzna YZ) - odwrotnie niż R
                if (clockwise) {
                    [newY, newZ] = [3 - pos.z, pos.y];
                } else {
                    [newY, newZ] = [pos.z, 3 - pos.y];
                }
                if (double) {
                    [newY, newZ] = [3 - pos.y, 3 - pos.z];
                }
                break;
            case "R":
            case "r":
                // Rotacja wokół osi X (płaszczyzna YZ) - przeciwnie do L
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

        cube.userData.currentPosition = { x: newX, y: newY, z: newZ };
        
        // Aktualizuj też fizyczną pozycję kostki
        cube.position.x = (newX - 1.5) * (CUBE_SIZE + GAP);
        cube.position.y = (newY - 1.5) * (CUBE_SIZE + GAP);
        cube.position.z = (newZ - 1.5) * (CUBE_SIZE + GAP);
    });
}

// Funkcja do parsowania i odtwarzania sekwencji ruchów
function playSequence(sequence) {
    console.log('playSequence called with:', sequence);
    if (isAnimating || moveQueue.length > 0) return;

    // Clear history for a new sequence
    moveHistory = [];
    currentMoveIndex = -1;

    // Remove brackets and split into moves
    const cleanedSequence = sequence.replace(/[()]/g, '').trim();
    const moves = cleanedSequence.split(/\s+/);
    moveQueue = [];

    for (const move of moves) {
        // Match patterns like R, R', R2, Rw, Rw', Rw2, r, r', r2
        const match = move.match(/^([FBLRUDfblrud]w?)(['']?|2)$/);
        if (!match) {
            console.warn(`Invalid move: ${move}`);
            continue;
        }

        const face = match[1];
        const modifier = match[2];
        const isCounterclockwise = modifier === "'" || modifier === "'";
        const isDoubleMove = modifier === "2";

        // Add move(s) to queue
        const moveObj = {
            face,
            direction: isCounterclockwise ? "counterclockwise" : "clockwise"
        };
        moveQueue.push(moveObj);
        if (isDoubleMove) {
            moveQueue.push(moveObj); // Add the same move again for double move
        }
    }
    
    console.log('moveQueue created:', moveQueue);
    if (moveQueue.length > 0) {
        processNextMove();
    }
}

// Funkcja do przetwarzania następnego ruchu z kolejki
function processNextMove() {
    console.log('processNextMove called, queue length:', moveQueue.length, 'isAnimating:', isAnimating);
    if (moveQueue.length > 0 && !isAnimating) {
        const move = moveQueue.shift();
        console.log('Processing move:', move);
        rotateFace(move.face, move.direction, false); // Zmienione na false, aby ruchy były dodawane do historii
    }
}

// Funkcje kontrolne
function stepForward() {
    if (currentMoveIndex < moveHistory.length - 1 && !isAnimating) {
        currentMoveIndex++;
        const move = moveHistory[currentMoveIndex];
        rotateFace(move.face, move.direction, true);
    }
}

function stepBackward() {
    if (currentMoveIndex >= 0 && !isAnimating) {
        const move = moveHistory[currentMoveIndex];
        const reverseDirection = move.direction === "clockwise" ? "counterclockwise" : "clockwise";
        rotateFace(move.face, reverseDirection, true);
        currentMoveIndex--;
    }
}

// Główna pętla animacji
function animate() {
    requestAnimationFrame(animate);
    controls.update();

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
            if (currentExecutingMove) {
                updateCubePositions(currentExecutingMove.face, currentExecutingMove.direction);
            }
            
            animatedCubes.forEach((cube) => {
                // Zastosuj skumulowaną rotację
                cube.quaternion.multiplyQuaternions(finalRotation, cube.quaternion);
                
                // Przenieś kostkę z powrotem do głównej grupy
                animationGroup.remove(cube);
                cubeGroup.add(cube);
            });

            scene.remove(animationGroup);
            animationGroup = null;
            currentExecutingMove = null;
            cubesInAnimation = [];

            // Kontynuuj z następnym ruchem z kolejki
            processNextMove();
        }
    }

    renderer.render(scene, camera);
}

// Funkcja resetowania kostki
function resetCube() {
    if (isAnimating) return;
    
    // Wyczyść kolejkę ruchów
    moveQueue = [];
    
    cubes.forEach((cube) => {
        cube.position.copy(cube.userData.originalPosition);
        cube.quaternion.set(0, 0, 0, 1); // Resetuj rotację używając quaterniona
        cube.userData.currentPosition = {
            x: Math.round((cube.userData.originalPosition.x / (CUBE_SIZE + GAP)) + 1.5),
            y: Math.round((cube.userData.originalPosition.y / (CUBE_SIZE + GAP)) + 1.5),
            z: Math.round((cube.userData.originalPosition.z / (CUBE_SIZE + GAP)) + 1.5)
        };
    });
    
    moveHistory = [];
    currentMoveIndex = -1;
    currentExecutingMove = null;
    cubesInAnimation = [];
}

// Event listenery dla przycisków kontrolnych i algorytmów
document.querySelectorAll(".control-btn").forEach((element) => {
    if (element.id === "reset-btn") {
        element.addEventListener("click", resetCube);
    } else if (element.id === "step-back-btn") {
        element.addEventListener("click", stepBackward);
    } else if (element.id === "step-forward-btn") {
        element.addEventListener("click", stepForward);
    } else {
        // Dla algorytmów w bibliotece
        element.addEventListener("click", () => {
            const pElement = element.querySelector("p");
            const sequence = pElement ? pElement.textContent : "";
            if (sequence) {
                playSequence(sequence);
            }
        });
    }
});

// Uruchomienie animacji
animate();

// Obsługa zmiany rozmiaru okna
window.addEventListener('resize', () => {
    camera.aspect = cubespace.clientWidth / cubespace.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(cubespace.clientWidth, cubespace.clientHeight);
}); 