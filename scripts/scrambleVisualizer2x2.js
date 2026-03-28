// Wizualizator tasowania dla kostki 2x2 - bazuje na scrambleVisualizer.js

let visualizerScene, visualizerCamera, visualizerRenderer, visualizerControls, visualizerCubeGroup;
let visualizerCubes = [];
const VISUALIZER_CUBE_SIZE = 1;
const VISUALIZER_GAP = 0.05;

let ANIMATION_DURATION = 300;
let isAnimating = false;
let animationStartTime = 0;
let animationGroup = null;
let animationAxis = null;
let animationAngle = 0;
let moveQueue = [];
let currentAnimatingMove = null;

const visualizerColors = {
    front: 0x00ff00,  // Zielony
    back: 0x0000ff,   // Niebieski
    up: 0xffffff,     // Biały
    down: 0xffff00,   // Żółty
    left: 0xffa500,   // Pomarańczowy
    right: 0xff0000   // Czerwony
};

function initScrambleVisualizer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Kontener o id '${containerId}' nie został znaleziony dla wizualizatora tasowania.`);
        return null;
    }
    container.innerHTML = '';

    visualizerScene = new THREE.Scene();
    const loader = new THREE.TextureLoader();
    loader.load(
        '../assets/images/background2.png',
        (texture) => {
            visualizerScene.background = texture;
        },
        undefined,
        (error) => {
            console.error('Błąd ładowania tła:', error);
            visualizerScene.background = new THREE.Color(0xc2c2c2);
        }
    );
    visualizerCamera = new THREE.PerspectiveCamera(
        55,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    visualizerCamera.position.set(4, 4, 6);

    visualizerRenderer = new THREE.WebGLRenderer({antialias: true});
    visualizerRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(visualizerRenderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    visualizerScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5);
    visualizerScene.add(directionalLight);

    visualizerControls = new THREE.OrbitControls(visualizerCamera, visualizerRenderer.domElement);
    visualizerControls.enableDamping = true;
    visualizerControls.dampingFactor = 0.1;

    visualizerCubeGroup = new THREE.Group();
    visualizerScene.add(visualizerCubeGroup);

    // Utwórz 8 małych kostek dla 2x2
    visualizerCubes = [];

    for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
            for (let z = 0; z < 2; z++) {
                const geometry = new THREE.BoxGeometry(VISUALIZER_CUBE_SIZE, VISUALIZER_CUBE_SIZE, VISUALIZER_CUBE_SIZE);
                const materials = [
                    new THREE.MeshLambertMaterial({color: x === 1 ? visualizerColors.right : 0x111111}), // Prawo
                    new THREE.MeshLambertMaterial({color: x === 0 ? visualizerColors.left : 0x111111}),  // Lewo
                    new THREE.MeshLambertMaterial({color: y === 1 ? visualizerColors.up : 0x111111}),    // Góra
                    new THREE.MeshLambertMaterial({color: y === 0 ? visualizerColors.down : 0x111111}),  // Dół
                    new THREE.MeshLambertMaterial({color: z === 1 ? visualizerColors.front : 0x111111}), // Przód
                    new THREE.MeshLambertMaterial({color: z === 0 ? visualizerColors.back : 0x111111})   // Tył
                ];

                const cube = new THREE.Mesh(geometry, materials);
                cube.position.x = (x - 0.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
                cube.position.y = (y - 0.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
                cube.position.z = (z - 0.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);

                const initialPos = {x, y, z};
                cube.userData.initialLogicalPosition = initialPos;
                cube.userData.logicalPosition = {...initialPos};
                cube.userData.logicalRotation = new THREE.Quaternion();

                visualizerCubeGroup.add(cube);
                visualizerCubes.push(cube);
            }
        }
    }

    requestAnimationFrame(animateVisualizer);

    window.addEventListener('resize', () => {
        visualizerCamera.aspect = container.clientWidth / container.clientHeight;
        visualizerCamera.updateProjectionMatrix();
        visualizerRenderer.setSize(container.clientWidth, container.clientHeight);
    });

    console.log("Inicjalizacja Wizualizatora Tasowania 2x2 w kontenerze:", containerId);
    return {
        displayScrambledState: displayScrambledState,
        resetVisualization: resetVisualization,
        setAnimationSpeed: setAnimationSpeed
    };
}

function animateVisualizer() {
    requestAnimationFrame(animateVisualizer);

    if (isAnimating) {
        const elapsed = Date.now() - animationStartTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const rotationAmount = animationAngle * progress;

        if (animationGroup) {
            animationGroup.setRotationFromAxisAngle(animationAxis, rotationAmount);
        }

        if (progress === 1) {
            isAnimating = false;

            if (currentAnimatingMove) {
                updateLogicalPositionsAfterRotation(currentAnimatingMove.face, currentAnimatingMove.direction, currentAnimatingMove.double);
            }

            if (animationGroup) {
                const childrenToMove = [...animationGroup.children];
                childrenToMove.forEach(cube => {
                    animationGroup.remove(cube);
                    visualizerCubeGroup.add(cube);
                });

                visualizerScene.remove(animationGroup);
                animationGroup = null;
            }

            updateVisualState();
            currentAnimatingMove = null;
            processNextMove();
        }
    }

    if (visualizerControls) {
        visualizerControls.update();
    }

    if (visualizerRenderer && visualizerScene && visualizerCamera) {
        visualizerRenderer.render(visualizerScene, visualizerCamera);
    }
}

function displayScrambledState(scrambleString, animate = false) {
    if (!visualizerCubes || visualizerCubes.length === 0) {
        console.error("Visualizer not initialized or no cubes found.");
        return;
    }

    isAnimating = false;
    moveQueue = [];
    currentAnimatingMove = null;
    if (animationGroup) {
        const childrenToMove = [...animationGroup.children];
        childrenToMove.forEach(cube => {
            animationGroup.remove(cube);
            visualizerCubeGroup.add(cube);
        });
        visualizerScene.remove(animationGroup);
        animationGroup = null;
    }

    resetLogicalState();
    updateVisualState();

    const moves = parseVisualizerMoves(scrambleString);
    if (!moves || moves.length === 0) {
        console.warn("Empty or invalid scramble string provided for displayScrambledState.");
        return;
    }

    if (animate) {
        moveQueue = [...moves];
        processNextMove();
    } else {
        moves.forEach(move => {
            applyLogicalMove(move.face, move.direction, move.double);
        });
        updateVisualState();
    }
}

function getCubesOnLayer(axis, layerIndex) {
    return visualizerCubes.filter(cube => {
        const pos = cube.userData.logicalPosition;
        switch (axis) {
            case 'x':
                return pos.x === layerIndex;
            case 'y':
                return pos.y === layerIndex;
            case 'z':
                return pos.z === layerIndex;
            default:
                return false;
        }
    });
}

function rotateFaceAnimated(move) {
    if (isAnimating) {
        console.warn("Próba rozpoczęcia animacji podczas gdy już trwa animacja.");
        return;
    }

    const {face, direction, double} = move;
    let axis, layerIndex;

    switch (face) {
        case 'F':
            axis = 'z';
            layerIndex = 1;
            animationAxis = new THREE.Vector3(0, 0, 1);
            break;
        case 'B':
            axis = 'z';
            layerIndex = 0;
            animationAxis = new THREE.Vector3(0, 0, -1);
            break;
        case 'U':
            axis = 'y';
            layerIndex = 1;
            animationAxis = new THREE.Vector3(0, 1, 0);
            break;
        case 'D':
            axis = 'y';
            layerIndex = 0;
            animationAxis = new THREE.Vector3(0, -1, 0);
            break;
        case 'L':
            axis = 'x';
            layerIndex = 0;
            animationAxis = new THREE.Vector3(-1, 0, 0);
            break;
        case 'R':
            axis = 'x';
            layerIndex = 1;
            animationAxis = new THREE.Vector3(1, 0, 0);
            break;
        default:
            console.error(`Nieznana ściana: ${face}`);
            return;
    }

    const cubesToRotate = getCubesOnLayer(axis, layerIndex);
    if (cubesToRotate.length === 0) {
        console.warn(`Brak kostek do obrócenia dla ściany ${face}`);
        return;
    }

    animationGroup = new THREE.Group();
    visualizerScene.add(animationGroup);

    cubesToRotate.forEach(cube => {
        const worldPos = new THREE.Vector3();
        cube.getWorldPosition(worldPos);
        const worldRot = new THREE.Quaternion();
        cube.getWorldQuaternion(worldRot);

        visualizerCubeGroup.remove(cube);
        animationGroup.add(cube);
        cube.position.copy(worldPos);
        cube.quaternion.copy(worldRot);
    });

    const clockwiseAngle = -Math.PI / 2;
    const counterClockwiseAngle = Math.PI / 2;
    animationAngle = (direction === 'clockwise') ? clockwiseAngle : counterClockwiseAngle;
    if (double) {
        animationAngle *= 2;
    }

    isAnimating = true;
    animationStartTime = Date.now();
    currentAnimatingMove = move;
}

function processNextMove() {
    if (moveQueue.length === 0 || isAnimating) return;
    const move = moveQueue.shift();
    rotateFaceAnimated(move);
}

function updateLogicalPositionsAfterRotation(face, direction, double) {
    const turns = double ? 2 : 1;

    for (let turn = 0; turn < turns; turn++) {
        applyLogicalMove(face, direction, false);
    }
}

function resetLogicalState() {
    visualizerCubes.forEach(cube => {
        cube.userData.logicalPosition = {...cube.userData.initialLogicalPosition};
        cube.userData.logicalRotation = new THREE.Quaternion();
    });
}

function parseVisualizerMoves(scrambleString) {
    return scrambleString.trim().split(/\s+/).map(moveStr => {
        if (!moveStr) return null;
        const face = moveStr[0].toUpperCase();
        let direction = 'clockwise';
        let double = false;
        if (moveStr.length > 1) {
            if (moveStr[1] === '\'') {
                direction = 'counter-clockwise';
            } else if (moveStr[1] === '2') {
                double = true;
            }
        }
        if (!['F', 'B', 'U', 'D', 'L', 'R'].includes(face)) return null;
        return {face, direction, double};
    }).filter(move => move !== null);
}

function applyLogicalMove(face, direction, double) {
    const angle = (direction === 'clockwise' ? -1 : 1) * (Math.PI / 2);
    const turns = double ? 2 : 1;

    for (let i = 0; i < turns; i++) {
        const rotationAxis = new THREE.Vector3();
        let layerIndex = -1;

        switch (face) {
            case 'F':
                rotationAxis.set(0, 0, 1);
                layerIndex = 1;
                break;
            case 'B':
                rotationAxis.set(0, 0, -1);
                layerIndex = 0;
                break;
            case 'U':
                rotationAxis.set(0, 1, 0);
                layerIndex = 1;
                break;
            case 'D':
                rotationAxis.set(0, -1, 0);
                layerIndex = 0;
                break;
            case 'L':
                rotationAxis.set(-1, 0, 0);
                layerIndex = 0;
                break;
            case 'R':
                rotationAxis.set(1, 0, 0);
                layerIndex = 1;
                break;
            default:
                return;
        }

        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis.normalize(), angle);
        const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(rotationQuaternion);

        visualizerCubes.forEach(cube => {
            const pos = cube.userData.logicalPosition;
            let isOnLayer = false;

            if ((face === 'F' || face === 'B') && pos.z === layerIndex) isOnLayer = true;
            else if ((face === 'U' || face === 'D') && pos.y === layerIndex) isOnLayer = true;
            else if ((face === 'L' || face === 'R') && pos.x === layerIndex) isOnLayer = true;

            if (isOnLayer) {
                let tempPos = new THREE.Vector3(pos.x - 0.5, pos.y - 0.5, pos.z - 0.5);
                tempPos.applyMatrix4(rotationMatrix);
                pos.x = Math.round(tempPos.x + 0.5);
                pos.y = Math.round(tempPos.y + 0.5);
                pos.z = Math.round(tempPos.z + 0.5);

                cube.userData.logicalRotation.premultiply(rotationQuaternion);
            }
        });
    }
}

function updateVisualState() {
    visualizerCubes.forEach(cube => {
        const pos = cube.userData.logicalPosition;
        cube.position.x = (pos.x - 0.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        cube.position.y = (pos.y - 0.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);
        cube.position.z = (pos.z - 0.5) * (VISUALIZER_CUBE_SIZE + VISUALIZER_GAP);

        cube.quaternion.copy(cube.userData.logicalRotation);
    });
}

function resetVisualization() {
    console.log("Resetowanie wizualizacji 2x2...");
    resetLogicalState();
    updateVisualState();
}

function setAnimationSpeed(durationMs) {
    ANIMATION_DURATION = Math.max(50, Math.min(2000, durationMs));
    console.log(`Prędkość animacji ustawiona na: ${ANIMATION_DURATION}ms`);
}

// Globalne udostępnienie obiektu ScrambleVisualizer
if (typeof window !== 'undefined') {
    window.ScrambleVisualizer = {
        init: initScrambleVisualizer
    };
} 
