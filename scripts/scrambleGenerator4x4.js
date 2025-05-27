// Generator scramble'a dla kostki 4x4
// Obsługuje ruchy podstawowe, wewnętrzne warstwy i ruchy szerokie

const basicMoves4x4 = ["U", "D", "L", "R", "F", "B"];
const innerMoves4x4 = ["u", "d", "l", "r", "f", "b"];
const wideMoves4x4 = ["Uw", "Dw", "Lw", "Rw", "Fw", "Bw"];
const modifiers4x4 = ["", "'", "2"];

function generateScramble4x4(length = 40, options = {}) {
    const {
        includeBasic = true,
        includeInner = true,
        includeWide = true
    } = options;

    // Stwórz tablicę dostępnych ruchów na podstawie opcji
    let availableMoves = [];
    
    if (includeBasic) {
        availableMoves.push(...basicMoves4x4);
    }
    
    if (includeInner) {
        availableMoves.push(...innerMoves4x4);
    }
    
    if (includeWide) {
        availableMoves.push(...wideMoves4x4);
    }
    
    // Jeśli żadne ruchy nie są wybrane, użyj podstawowych
    if (availableMoves.length === 0) {
        availableMoves = [...basicMoves4x4];
    }

    let scramble = [];
    let lastMove = "";
    let lastAxis = "";

    for (let i = 0; i < length; i++) {
        let move;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            const moveIndex = Math.floor(Math.random() * availableMoves.length);
            move = availableMoves[moveIndex];
            attempts++;
        } while (attempts < maxAttempts && shouldSkipMove(move, lastMove, lastAxis));

        const modifierIndex = Math.floor(Math.random() * modifiers4x4.length);
        const fullMove = move + modifiers4x4[modifierIndex];
        
        scramble.push(fullMove);
        lastMove = move;
        lastAxis = getAxis4x4(move);
    }

    return scramble.join(" ");
}

// Funkcja pomocnicza do określania czy ruch powinien być pominięty
function shouldSkipMove(currentMove, lastMove, lastAxis) {
    if (!lastMove) return false;
    
    const currentAxis = getAxis4x4(currentMove);
    const currentBaseFace = getBaseFace4x4(currentMove);
    const lastBaseFace = getBaseFace4x4(lastMove);
    
    // Nie pozwól na ten sam ruch po sobie
    if (currentMove === lastMove) {
        return true;
    }
    
    // Nie pozwól na przeciwne ruchy na tej samej osi bezpośrednio po sobie
    if (currentAxis === lastAxis && areOppositeFaces4x4(currentBaseFace, lastBaseFace)) {
        return true;
    }
    
    // Unikaj konfliktujących ruchów szerokich i podstawowych
    if (areConflicting4x4(currentMove, lastMove)) {
        return true;
    }
    
    return false;
}

// Funkcja do pobierania osi ruchu
function getAxis4x4(move) {
    const baseFace = getBaseFace4x4(move);
    const axisMap = {
        'U': 'y', 'D': 'y',
        'L': 'x', 'R': 'x',
        'F': 'z', 'B': 'z'
    };
    return axisMap[baseFace] || 'unknown';
}

// Funkcja do pobierania podstawowej ściany z ruchu
function getBaseFace4x4(move) {
    // Usuń modyfikatory (w, ', 2) żeby dostać podstawową ścianę
    return move.replace(/[w'2]/g, '').toUpperCase();
}

// Funkcja sprawdzająca czy dwie ściany są przeciwne
function areOppositeFaces4x4(face1, face2) {
    const opposites = {
        'U': 'D', 'D': 'U',
        'L': 'R', 'R': 'L',
        'F': 'B', 'B': 'F'
    };
    return opposites[face1] === face2;
}

// Funkcja sprawdzająca czy ruchy są konfliktujące
function areConflicting4x4(move1, move2) {
    const base1 = getBaseFace4x4(move1);
    const base2 = getBaseFace4x4(move2);
    
    // Sprawdź konflikty między ruchami szerokimi a podstawowymi na tej samej ścianie
    if (base1 === base2) {
        const isWide1 = move1.includes('w');
        const isWide2 = move2.includes('w');
        const isInner1 = move1[0] === move1[0].toLowerCase();
        const isInner2 = move2[0] === move2[0].toLowerCase();
        
        // Konflikty między różnymi typami ruchów tej samej ściany
        if ((isWide1 && !isWide2) || (!isWide1 && isWide2) || 
            (isInner1 && !isInner2) || (!isInner1 && isInner2)) {
            return true;
        }
    }
    
    return false;
}

// Alternatywny generator z użyciem starszej składni dla kompatybilności
function generateCustomScramble4x4(options = {}) {
    const {
        length = 40,
        includeBasic = true,
        includeInner = true,
        includeWide = true
    } = options;
    
    return generateScramble4x4(length, {
        includeBasic,
        includeInner,
        includeWide
    });
}

// Funkcja sprawdzająca poprawność scramble'a
function validateScramble4x4(scrambleString) {
    if (!scrambleString || typeof scrambleString !== 'string') {
        return false;
    }
    
    const moves = scrambleString.trim().split(/\s+/);
    const validMovePattern = /^([FBLRUDfblrud]w?)(['']?|2)$/;
    
    return moves.every(move => validMovePattern.test(move));
}

// Funkcja do analizy scramble'a
function analyzeScramble4x4(scrambleString) {
    if (!validateScramble4x4(scrambleString)) {
        return null;
    }
    
    const moves = scrambleString.trim().split(/\s+/);
    let basicCount = 0;
    let innerCount = 0;
    let wideCount = 0;
    let doubleCount = 0;
    let primeCount = 0;
    
    moves.forEach(move => {
        if (move.includes('2')) doubleCount++;
        if (move.includes("'") || move.includes("'")) primeCount++;
        
        const baseName = move.replace(/[w'2'']/g, '');
        if (move.includes('w')) {
            wideCount++;
        } else if (baseName === baseName.toLowerCase()) {
            innerCount++;
        } else {
            basicCount++;
        }
    });
    
    return {
        totalMoves: moves.length,
        basicMoves: basicCount,
        innerMoves: innerCount,
        wideMoves: wideCount,
        doubleMoves: doubleCount,
        primeMoves: primeCount
    };
}

// Udostępnij funkcje globalnie
if (typeof window !== 'undefined') {
    window.generateScramble4x4 = generateScramble4x4;
    window.generateCustomScramble4x4 = generateCustomScramble4x4;
    window.validateScramble4x4 = validateScramble4x4;
    window.analyzeScramble4x4 = analyzeScramble4x4;
}

// Eksport dla modułów (jeśli jest używany)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateScramble4x4,
        generateCustomScramble4x4,
        validateScramble4x4,
        analyzeScramble4x4
    };
} 