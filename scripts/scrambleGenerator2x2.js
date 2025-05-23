const moves2x2 = ["U", "D", "L", "R", "F", "B"];
const modifiers2x2 = ["", "'", "2"];

function generateScramble2x2(length = 12) {
    let scramble = [];
    let lastMove = -1;

    for (let i = 0; i < length; i++) {
        let moveIndex;
        do {
            moveIndex = Math.floor(Math.random() * moves2x2.length);
        } while (moveIndex === lastMove || (i > 0 && isOppositeAxis2x2(moves2x2[moveIndex], moves2x2[lastMove])) );

        const modifierIndex = Math.floor(Math.random() * modifiers2x2.length);
        scramble.push(moves2x2[moveIndex] + modifiers2x2[modifierIndex]);
        lastMove = moveIndex;
    }

    return scramble.join(" ");
}

function isOppositeAxis2x2(move1, move2) {
    if (!move1 || !move2) return false;
    const axisMap = {
        'U': 'y', 'D': 'y',
        'L': 'x', 'R': 'x',
        'F': 'z', 'B': 'z'
    };
    return axisMap[move1] === axisMap[move2];
}

// Funkcja kompatybilna z istniejącą nazwą używaną w training-2x2.js
function generateScramble(length = 12) {
    return generateScramble2x2(length);
} 