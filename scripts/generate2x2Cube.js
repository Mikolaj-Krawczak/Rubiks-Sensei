const CUBE_SIZE = 1;
const GAP = 0.05;
const ANIMATION_DURATION = 500; // ms
const cubespace = document.getElementById("cubespace");

// Konfiguracja sceny
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
loader.load(
    '../assets/images/background2.png',
    (texture) => { scene.background = texture; },
    undefined,
    (error) => { console.error('Błąd ładowania tła:', error); scene.background = new THREE.Color(0xff0000); }
);

const camera = new THREE.PerspectiveCamera(
    55,
    cubespace.clientWidth / cubespace.clientHeight,
    0.1,
    1000
);
camera.position.set(4, 4, 6);

const renderer = new THREE.WebGLRenderer({antialias: true});
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

// Utworzenie 8 małych kostek (2x2x2)
const cubes = [];
const totalSize = CUBE_SIZE * 2 + GAP;
const offset = totalSize / 2 - CUBE_SIZE / 2;

for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
            const geometry = new THREE.BoxGeometry(
                CUBE_SIZE,
                CUBE_SIZE,
                CUBE_SIZE
            );
            const materials = [];

            materials.push(
                new THREE.MeshLambertMaterial({
                    color: x === 1 ? colors.right : 0x111111,
                })
            );
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: x === 0 ? colors.left : 0x111111,
                })
            );
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: y === 1 ? colors.up : 0x111111,
                })
            );
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: y === 0 ? colors.down : 0x111111,
                })
            );
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: z === 1 ? colors.front : 0x111111,
                })
            );
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: z === 0 ? colors.back : 0x111111,
                })
            );

            const cube = new THREE.Mesh(geometry, materials);
            cube.position.x = (x - 0.5) * (CUBE_SIZE + GAP);
            cube.position.y = (y - 0.5) * (CUBE_SIZE + GAP);
            cube.position.z = (z - 0.5) * (CUBE_SIZE + GAP);
            cube.userData.originalPosition = cube.position.clone();
            cube.userData.currentPosition = {x, y, z};
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

// Funkcja do pobierania kostek na określonej ściance
function getCubesOnFace(face) {
    const faceCubes = [];
    switch (face) {
        case "F":
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z === 1) faceCubes.push(cube);
            });
            break;
        case "B":
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z === 0) faceCubes.push(cube);
            });
            break;
        case "U":
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y === 1) faceCubes.push(cube);
            });
            break;
        case "D":
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y === 0) faceCubes.push(cube);
            });
            break;
        case "L":
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x === 0) faceCubes.push(cube);
            });
            break;
        case "R":
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x === 1) faceCubes.push(cube);
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

    animationGroup = new THREE.Group();
    scene.add(animationGroup);
    faceCubes.forEach((cube) => {
        const worldPos = new THREE.Vector3();
        cube.getWorldPosition(worldPos);
        const worldRot = new THREE.Quaternion();
        cube.getWorldQuaternion(worldRot);
        cubeGroup.remove(cube);
        animationGroup.add(cube);
        cube.position.copy(worldPos);
        cube.quaternion.copy(worldRot);
    });

    switch (face) {
        case "F":
            animationAxis = new THREE.Vector3(0, 0, 1);
            break;
        case "B":
            animationAxis = new THREE.Vector3(0, 0, -1);
            break;
        case "U":
            animationAxis = new THREE.Vector3(0, 1, 0);
            break;
        case "D":
            animationAxis = new THREE.Vector3(0, -1, 0);
            break;
        case "L":
            animationAxis = new THREE.Vector3(-1, 0, 0);
            break;
        case "R":
            animationAxis = new THREE.Vector3(1, 0, 0);
            break;
    }

    animationAngle = ((direction === "clockwise" ? -1 : 1) * Math.PI) / 2;

    isAnimating = true;
    animationStartTime = Date.now();

    if (!isReplay) {
        // Add to history if not replaying a move
        if (currentMoveIndex < moveHistory.length - 1) {
            moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
        }
        moveHistory.push({face, direction});
        currentMoveIndex = moveHistory.length - 1;
    }
}

// Function to update cube positions after rotation
function updateCubePositions(face, direction) {
    const clockwise = direction === "clockwise";

    cubes.forEach((cube) => {
        const pos = cube.userData.currentPosition;

        switch (face) {
            case "F":
                if (pos.z === 1) {
                    const oldX = pos.x;
                    const oldY = pos.y;
                    pos.x = clockwise ? oldY : 1 - oldY;
                    pos.y = clockwise ? 1 - oldX : oldX;
                }
                break;
            case "B":
                if (pos.z === 0) {
                    const oldX = pos.x;
                    const oldY = pos.y;
                    pos.x = clockwise ? 1 - oldY : oldY;
                    pos.y = clockwise ? oldX : 1 - oldX;
                }
                break;
            case "U":
                if (pos.y === 1) {
                    const oldX = pos.x;
                    const oldZ = pos.z;
                    pos.x = clockwise ? 1 - oldZ : oldZ;
                    pos.z = clockwise ? oldX : 1 - oldX;
                }
                break;
            case "D":
                if (pos.y === 0) {
                    const oldX = pos.x;
                    const oldZ = pos.z;
                    pos.x = clockwise ? oldZ : 1 - oldZ;
                    pos.z = clockwise ? 1 - oldX : oldX;
                }
                break;
            case "L":
                if (pos.x === 0) {
                    const oldY = pos.y;
                    const oldZ = pos.z;
                    pos.y = clockwise ? 1 - oldZ : oldZ;
                    pos.z = clockwise ? oldY : 1 - oldY;
                }
                break;
            case "R":
                if (pos.x === 1) {
                    const oldY = pos.y;
                    const oldZ = pos.z;
                    pos.y = clockwise ? oldZ : 1 - oldZ;
                    pos.z = clockwise ? 1 - oldY : oldY;
                }
                break;
        }
    });
}

// Function to parse a sequence string and play it
function playSequence(sequence) {
    if (isAnimating || moveQueue.length > 0) return;

    // Clear history for a new sequence
    moveHistory = [];
    currentMoveIndex = -1;

    // Remove brackets and split into moves
    const cleanedSequence = sequence.replace(/[()]/g, '').trim();
    const moves = cleanedSequence.split(/\s+/);
    moveQueue = [];

    for (const move of moves) {
        const match = move.match(/^([FBLRUD])(['']?|2)$/);
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

    if (moveQueue.length > 0) {
        processNextMove();
    }
}

// Function to process the next move in the queue
function processNextMove() {
    if (moveQueue.length === 0 || isAnimating) return;
    const move = moveQueue.shift();
    rotateFace(move.face, move.direction);
}

// Function to step forward in the move history
function stepForward() {
    if (isAnimating || currentMoveIndex >= moveHistory.length - 1) return;
    const nextMove = moveHistory[currentMoveIndex + 1];
    currentMoveIndex++;
    rotateFace(nextMove.face, nextMove.direction, true);
}

// Function to step backward in the move history
function stepBackward() {
    if (isAnimating || currentMoveIndex < 0) return;
    const currentMove = moveHistory[currentMoveIndex];
    currentMoveIndex--;
    // Reverse the move
    const reverseDirection = currentMove.direction === "clockwise" ? "counterclockwise" : "clockwise";
    rotateFace(currentMove.face, reverseDirection, true);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (isAnimating) {
        const elapsed = Date.now() - animationStartTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const rotationAmount = animationAngle * progress;
        animationGroup.setRotationFromAxisAngle(
            animationAxis,
            rotationAmount
        );

        if (progress === 1) {
            isAnimating = false;
            const face =
                animationAxis.x !== 0
                    ? animationAxis.x > 0
                        ? "R"
                        : "L"
                    : animationAxis.y !== 0
                        ? animationAxis.y > 0
                            ? "U"
                            : "D"
                        : animationAxis.z > 0
                            ? "F"
                            : "B";
            const direction =
                animationAngle > 0 ? "counterclockwise" : "clockwise";

            updateCubePositions(face, direction);

            const finalRotation = new THREE.Quaternion().setFromAxisAngle(
                animationAxis,
                animationAngle
            );

            while (animationGroup.children.length > 0) {
                const cube = animationGroup.children[0];
                cube.quaternion.multiplyQuaternions(
                    finalRotation,
                    cube.quaternion
                );
                const pos = cube.userData.currentPosition;
                cube.position.set(
                    (pos.x - 0.5) * (CUBE_SIZE + GAP),
                    (pos.y - 0.5) * (CUBE_SIZE + GAP),
                    (pos.z - 0.5) * (CUBE_SIZE + GAP)
                );
                animationGroup.remove(cube);
                cubeGroup.add(cube);
            }
            scene.remove(animationGroup);
            animationGroup = null;

            // Process the next move in the queue
            processNextMove();
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
    camera.aspect = cubespace.clientWidth / cubespace.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(cubespace.clientWidth, cubespace.clientHeight);
});

// Event listeners for control elements
document.querySelectorAll(".control-btn").forEach((element) => {
    if (element.id === "reset-btn") {
        element.addEventListener("click", resetCube);
    } else if (element.id === "step-back-btn") {
        element.addEventListener("click", stepBackward);
    } else if (element.id === "step-forward-btn") {
        element.addEventListener("click", stepForward);
    } else {
        element.addEventListener("click", () => {
            const pElement = element.querySelector("p");
            const sequence = pElement ? pElement.textContent : "";
            if (sequence) {
                playSequence(sequence);
            }
        });
    }
});

// Reset cube function
function resetCube() {
    if (isAnimating) return;
    moveQueue = []; // Clear the move queue
    moveHistory = []; // Clear the move history
    currentMoveIndex = -1;
    cubes.forEach((cube) => {
        // Calculate the original position indices (0 or 1) for a 2x2 cube
        const originalX = Math.round((cube.userData.originalPosition.x / (CUBE_SIZE + GAP)) + 0.5);
        const originalY = Math.round((cube.userData.originalPosition.y / (CUBE_SIZE + GAP)) + 0.5);
        const originalZ = Math.round((cube.userData.originalPosition.z / (CUBE_SIZE + GAP)) + 0.5);

        // Update the current position to the original indices (0 or 1)
        cube.userData.currentPosition = {
            x: originalX,
            y: originalY,
            z: originalZ
        };

        // Reset the cube's position to its original position
        cube.position.copy(cube.userData.originalPosition);
        // Reset the cube's rotation
        cube.quaternion.set(0, 0, 0, 1);
    });
}

// Start animation loop
try {
    animate();
} catch (error) {
    console.error("Animation loop failed:", error);
} 
