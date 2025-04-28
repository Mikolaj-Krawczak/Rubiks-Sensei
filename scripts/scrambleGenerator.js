const moves = ["U", "D", "L", "R", "F", "B"];
const modifiers = ["", "'", "2"];

function generateScramble(length = 20) {
    let scramble = [];
    let lastMove = -1;

    for (let i = 0; i < length; i++) {
        let moveIndex;
        do {
            moveIndex = Math.floor(Math.random() * moves.length);
        } while (moveIndex === lastMove || (i > 0 && isOppositeAxis(moves[moveIndex], moves[lastMove])) );

        const modifierIndex = Math.floor(Math.random() * modifiers.length);
        scramble.push(moves[moveIndex] + modifiers[modifierIndex]);
        lastMove = moveIndex;
    }

    return scramble.join(" ");
}

// Funkcja pomocnicza do zapobiegania redundantnym ruchom, jak R L R lub U D U
function isOppositeAxis(move1, move2) {
    if (!move1 || !move2) return false;
    const axisMap = {
        'U': 'y', 'D': 'y',
        'L': 'x', 'R': 'x',
        'F': 'z', 'B': 'z'
    };
    return axisMap[move1] === axisMap[move2];
}

// Udostępnij funkcję, jeśli używasz modułów lub globalnie w oknie
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateScramble };
} else {
    window.generateScramble = generateScramble;
} 