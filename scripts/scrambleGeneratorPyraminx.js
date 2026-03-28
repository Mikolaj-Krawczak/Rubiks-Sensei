// Generator scramble'a dla Pyraminxa
// Obsługuje ruchy ścianek: U, L, R, B
// Oraz ruchy wierzchołków: u, l, r, b

const pyraminxFaceMoves = ["U", "L", "R", "B"];
const pyraminxTipMoves = ["u", "l", "r", "b"];
const pyraminxModifiers = ["", "'", "2"];

function generatePyraminxScramble(length = 15, options = {}) {
    const {
        includeFaceMoves = true,
        includeTipMoves = true
    } = options;

    // Stwórz tablicę dostępnych ruchów na podstawie opcji
    let availableMoves = [];
    
    if (includeFaceMoves) {
        availableMoves.push(...pyraminxFaceMoves);
    }
    
    if (includeTipMoves) {
        availableMoves.push(...pyraminxTipMoves);
    }
    
    // Jeśli żadne ruchy nie są wybrane, użyj wszystkich
    if (availableMoves.length === 0) {
        availableMoves = [...pyraminxFaceMoves, ...pyraminxTipMoves];
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
        } while (attempts < maxAttempts && shouldSkipPyraminxMove(move, lastMove, lastAxis));

        const modifierIndex = Math.floor(Math.random() * pyraminxModifiers.length);
        const fullMove = move + pyraminxModifiers[modifierIndex];
        
        scramble.push(fullMove);
        lastMove = move;
        lastAxis = getPyraminxAxis(move);
    }

    return scramble.join(" ");
}

// Funkcja pomocnicza do określania czy ruch powinien być pominięty
function shouldSkipPyraminxMove(currentMove, lastMove, lastAxis) {
    if (!lastMove) return false;
    
    // Nie pozwól na ten sam ruch po sobie
    if (currentMove === lastMove) {
        return true;
    }
    
    // Nie pozwól na odpowiadające sobie ruchy ścianek i wierzchołków bezpośrednio po sobie
    // U z u, L z l, etc.
    if (currentMove.toLowerCase() === lastMove.toLowerCase()) {
        return true;
    }
    
    return false;
}

// Funkcja do pobierania osi ruchu (dla pyraminxa każda ścianka ma swoją oś)
function getPyraminxAxis(move) {
    // Dla pyraminxa każda ścianka/wierzchołek ma unikalną oś
    return move.toLowerCase();
}

// Funkcja kompatybilna z istniejącym systemem - używana w training-pyraminx.js
function generateScramble(length = 15) {
    return generatePyraminxScramble(length);
}

// Funkcja sprawdzająca poprawność scramble'a pyraminxa
function validatePyraminxScramble(scrambleString) {
    if (!scrambleString || typeof scrambleString !== 'string') {
        return false;
    }
    
    const moves = scrambleString.trim().split(/\s+/);
    const validMovePattern = /^[ULRBulrb]['2]?$/;
    
    return moves.every(move => validMovePattern.test(move));
}

// Funkcja do analizy scramble'a pyraminxa
function analyzePyraminxScramble(scrambleString) {
    if (!validatePyraminxScramble(scrambleString)) {
        return null;
    }
    
    const moves = scrambleString.trim().split(/\s+/);
    let faceMoveCount = 0;
    let tipMoveCount = 0;
    let doubleCount = 0;
    let primeCount = 0;
    
    moves.forEach(move => {
        if (move.includes('2')) doubleCount++;
        if (move.includes("'")) primeCount++;
        
        const baseName = move.replace(/['2]/g, '');
        if (pyraminxFaceMoves.includes(baseName)) {
            faceMoveCount++;
        } else if (pyraminxTipMoves.includes(baseName)) {
            tipMoveCount++;
        }
    });
    
    return {
        totalMoves: moves.length,
        faceMoves: faceMoveCount,
        tipMoves: tipMoveCount,
        doubleMoves: doubleCount,
        primeMoves: primeCount
    };
}

// Generator scramble'a tylko dla wierzchołków (przydatne dla niektórych metod)
function generateTipsOnlyScramble(length = 8) {
    return generatePyraminxScramble(length, {
        includeFaceMoves: false,
        includeTipMoves: true
    });
}

// Generator scramble'a tylko dla ścianek (przydatne dla niektórych metod)
function generateFacesOnlyScramble(length = 12) {
    return generatePyraminxScramble(length, {
        includeFaceMoves: true,
        includeTipMoves: false
    });
} 
