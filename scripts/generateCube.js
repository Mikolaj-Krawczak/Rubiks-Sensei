// Constants
const CUBE_SIZE = 1;
const GAP = 0.05;
const ANIMATION_DURATION = 500; // ms
const cubespace = document.getElementById("cubespace");

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfff);

const camera = new THREE.PerspectiveCamera(
    75,
    cubespace.clientWidth / cubespace.clientHeight,
    0.1,
    1000
);
camera.position.set(5, 5, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(cubespace.clientWidth, cubespace.clientHeight);
cubespace.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// Controls for rotating the entire cube
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Cube pieces
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

// Colors for the cube faces
const colors = {
    front: 0xff0000, // Red
    back: 0xffa500, // Orange
    up: 0xffffff, // White
    down: 0xffff00, // Yellow
    left: 0x00ff00, // Green
    right: 0x0000ff, // Blue
};

// Create the 27 small cubes (3x3x3)
const cubes = [];
const totalSize = CUBE_SIZE * 3 + GAP * 2;
const offset = totalSize / 2 - CUBE_SIZE / 2;

for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
            // Skip the center piece (completely internal)
            if (x === 1 && y === 1 && z === 1) continue;

            const geometry = new THREE.BoxGeometry(
                CUBE_SIZE,
                CUBE_SIZE,
                CUBE_SIZE
            );
            const materials = [];

            // Determine colors for each face
            // Right face (x = 2)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: x === 2 ? colors.right : 0x111111,
                })
            );

            // Left face (x = 0)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: x === 0 ? colors.left : 0x111111,
                })
            );

            // Top face (y = 2)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: y === 2 ? colors.up : 0x111111,
                })
            );

            // Bottom face (y = 0)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: y === 0 ? colors.down : 0x111111,
                })
            );

            // Front face (z = 2)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: z === 2 ? colors.front : 0x111111,
                })
            );

            // Back face (z = 0)
            materials.push(
                new THREE.MeshLambertMaterial({
                    color: z === 0 ? colors.back : 0x111111,
                })
            );

            const cube = new THREE.Mesh(geometry, materials);

            // Position the cube
            cube.position.x = (x - 1) * (CUBE_SIZE + GAP);
            cube.position.y = (y - 1) * (CUBE_SIZE + GAP);
            cube.position.z = (z - 1) * (CUBE_SIZE + GAP);

            // Store the original position and index
            cube.userData.originalPosition = cube.position.clone();
            cube.userData.currentPosition = { x, y, z };

            cubeGroup.add(cube);
            cubes.push(cube);
        }
    }
}

// Animation state
let isAnimating = false;
let animationStartTime = 0;
let animationGroup = null;
let animationAxis = null;
let animationAngle = 0;

// Function to get cubes on a specific face
function getCubesOnFace(face) {
    const faceCubes = [];

    switch (face) {
        case "F": // Front face (z = 2)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z === 2) faceCubes.push(cube);
            });
            break;
        case "B": // Back face (z = 0)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.z === 0) faceCubes.push(cube);
            });
            break;
        case "U": // Up face (y = 2)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y === 2) faceCubes.push(cube);
            });
            break;
        case "D": // Down face (y = 0)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.y === 0) faceCubes.push(cube);
            });
            break;
        case "L": // Left face (x = 0)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x === 0) faceCubes.push(cube);
            });
            break;
        case "R": // Right face (x = 2)
            cubes.forEach((cube) => {
                if (cube.userData.currentPosition.x === 2) faceCubes.push(cube);
            });
            break;
    }

    return faceCubes;
}

// Function to start a face rotation
function rotateFace(face, direction) {
    if (isAnimating) return;

    const faceCubes = getCubesOnFace(face);
    if (faceCubes.length === 0) return;

    // Create a temporary group for rotation
    animationGroup = new THREE.Group();
    scene.add(animationGroup);

    // Add selected cubes to the group
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

    // Set rotation axis based on face
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

    // Set rotation angle based on direction
    animationAngle = ((direction === "clockwise" ? 1 : -1) * Math.PI) / 2;

    // Start animation
    isAnimating = true;
    animationStartTime = Date.now();
}

// Function to update cube positions after rotation
function updateCubePositions(face, direction) {
    const clockwise = direction === "clockwise";

    cubes.forEach((cube) => {
        const pos = cube.userData.currentPosition;

        switch (face) {
            case "F": // Front face (z = 2)
                if (pos.z === 2) {
                    const oldX = pos.x;
                    const oldY = pos.y;
                    pos.x = clockwise ? 2 - oldY : oldY;
                    pos.y = clockwise ? oldX : 2 - oldX;
                }
                break;
            case "B": // Back face (z = 0)
                if (pos.z === 0) {
                    const oldX = pos.x;
                    const oldY = pos.y;
                    pos.x = clockwise ? oldY : 2 - oldY;
                    pos.y = clockwise ? 2 - oldX : oldX;
                }
                break;
            case "U": // Up face (y = 2)
                if (pos.y === 2) {
                    const oldX = pos.x;
                    const oldZ = pos.z;
                    pos.x = clockwise ? oldZ : 2 - oldZ;
                    pos.z = clockwise ? 2 - oldX : oldX;
                }
                break;
            case "D": // Down face (y = 0)
                if (pos.y === 0) {
                    const oldX = pos.x;
                    const oldZ = pos.z;
                    pos.x = clockwise ? 2 - oldZ : oldZ;
                    pos.z = clockwise ? oldX : 2 - oldX;
                }
                break;
            case "L": // Left face (x = 0)
                if (pos.x === 0) {
                    const oldY = pos.y;
                    const oldZ = pos.z;
                    pos.y = clockwise ? oldZ : 2 - oldZ; // Swap Y and Z correctly
                    pos.z = clockwise ? 2 - oldY : oldY;
                }
                break;
            case "R": // Right face (x = 2)
                if (pos.x === 2) {
                    const oldY = pos.y;
                    const oldZ = pos.z;
                    pos.y = clockwise ? 2 - oldZ : oldZ; // Swap Y and Z correctly
                    pos.z = clockwise ? oldY : 2 - oldY;
                }
                break;
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Handle ongoing animation
    if (isAnimating) {
        const elapsed = Date.now() - animationStartTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        // Apply rotation based on progress
        const rotationAmount = animationAngle * progress;
        animationGroup.setRotationFromAxisAngle(
            animationAxis,
            rotationAmount
        );

        // Animation complete
        if (progress === 1) {
            isAnimating = false;

            // Determine the face and direction from the animation
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
                animationAngle > 0 ? "clockwise" : "counterclockwise";

            // Update logical positions
            updateCubePositions(face, direction);

            // Apply the final rotation to individual cubes
            const finalRotation = new THREE.Quaternion().setFromAxisAngle(
                animationAxis,
                animationAngle
            );

            // Move cubes back to the main group
            while (animationGroup.children.length > 0) {
                const cube = animationGroup.children[0];

                // Apply the rotation to the cube's orientation
                cube.quaternion.multiplyQuaternions(
                    finalRotation,
                    cube.quaternion
                );

                // Ensure cube face materials remain consistent by updating position
                const pos = cube.userData.currentPosition;
                cube.position.set(
                    (pos.x - 1) * (CUBE_SIZE + GAP),
                    (pos.y - 1) * (CUBE_SIZE + GAP),
                    (pos.z - 1) * (CUBE_SIZE + GAP)
                );

                // Remove from animation group and add to main group
                animationGroup.remove(cube);
                cubeGroup.add(cube);
            }

            // Remove the temporary group
            scene.remove(animationGroup);
            animationGroup = null;
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

// Button event listeners
document.querySelectorAll(".control-btn").forEach((button) => {
    if (button.id === "reset-btn") {
        button.addEventListener("click", resetCube);
    } else {
        button.addEventListener("click", () => {
            const face = button.getAttribute("data-face");
            const direction = button.getAttribute("data-dir");
            rotateFace(face, direction);
        });
    }
});

// Reset cube function
function resetCube() {
    if (isAnimating) return;

    // Reset cube positions and orientations
    cubes.forEach((cube) => {
        const originalX =
            Math.round(cube.userData.originalPosition.x / (CUBE_SIZE + GAP)) +
            1;
        const originalY =
            Math.round(cube.userData.originalPosition.y / (CUBE_SIZE + GAP)) +
            1;
        const originalZ =
            Math.round(cube.userData.originalPosition.z / (CUBE_SIZE + GAP)) +
            1;

        cube.userData.currentPosition = {
            x: originalX,
            y: originalY,
            z: originalZ,
        };
        cube.position.copy(cube.userData.originalPosition);
        cube.quaternion.set(0, 0, 0, 1); // Reset rotation
    });
}

// Start animation loop
animate();