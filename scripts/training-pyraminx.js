document.addEventListener('DOMContentLoaded', () => {
    // Elementy UI
    const scrambleDisplay = document.getElementById('scramble-display');
    const timerDisplay = document.getElementById('timer-display');
    const hintDisplay = document.getElementById('hint-display');
    const regenScrambleBtn = document.getElementById('regen-scramble-btn');
    const singleSolveBtn = document.getElementById('single-solve-btn');
    const seriesSolveBtn = document.getElementById('series-solve-btn');
    const seriesCountInput = document.getElementById('series-count');
    const scrambleLengthInput = document.getElementById('scramble-length');
    const visualizeScrambleBtn = document.getElementById('visualize-scramble-btn');
    const resetVisualizerBtn = document.getElementById('reset-visualizer-btn');
    const visualizerContainerId = 'scramble-visualizer-space';
    const seriesTimesDisplay = document.getElementById('series-times-display');
    const speedControlRadios = document.querySelectorAll('input[name="scramble-speed"]');
    const animationSpeedSlider = document.getElementById('animation-speed');
    const speedValueDisplay = document.getElementById('speed-value');
    const includeFaceMovesCheckbox = document.getElementById('include-face-moves');
    const includeTipMovesCheckbox = document.getElementById('include-tip-moves');

    // Zmienne stanu
    let timerInterval = null;
    let startTime = 0;
    let timerRunning = false;
    let currentScramble = '';
    let currentSolveIndex = 0;
    let totalSolvesInSeries = 0;
    let isSeriesMode = false;
    let pyraminxVisualizerInstance = null;
    let seriesTimes = [];
    let scrambles = [];
    const MAX_SERIES_LENGTH = 10;

    // Zmienne globalne dla wizualizacji pyraminxa
    let aspecto, frustum, cena, camera, renderer, orbita, pyraminx, grupo;
    let eventos = [];
    let isAnimating = false;
    let rotacao;

    // Kolory pyraminxa
    let vermelho = 0x00ff00; // Czerwony - góra
    let verde = 0x0000ff;    // Zielony - przód  
    let azul = 0xff0000;     // Niebieski - prawo
    let amarelo = 0xffff00;  // Żółty - dół/tył
    let preto = 0x777777;    // Szary

    // --- Inicjalizacja wizualizatora pyraminxa ---
    function initPyraminxVisualizer() {
        const container = document.getElementById(visualizerContainerId);
        if (!container) {
            console.error(`Kontener o id '${visualizerContainerId}' nie został znaleziony.`);
            return null;
        }
        
        // Konfiguracja podstawowych obiektów Three.js
        aspecto = container.clientWidth / container.clientHeight;
        frustum = 10;
        
        cena = new THREE.Scene();
        camera = new THREE.OrthographicCamera(
            -frustum * aspecto / 2, 
            frustum * aspecto / 2, 
            frustum / 2, 
            -frustum / 2, 
            1, 
            2000
        );
        
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0xffffff, 1);
        renderer.setSize(container.clientWidth, container.clientHeight);
        
        // Dodanie kontrolek orbity
        orbita = new THREE.OrbitControls(camera, renderer.domElement);
        orbita.enableKeys = false;
        orbita.enablePan = false;
        
        // Dodanie canvasu do kontenera
        container.appendChild(renderer.domElement);
        
        // Aktualizacja kamery
        updatePyraminxCamera();
        
        // Stworzenie modelu pyraminxa
        let tetraedroMath = TetraedroMath(2);
        pyraminx = Pyraminx(tetraedroMath, vermelho, verde, azul, amarelo, preto);
        grupo = Grupo(pyraminx);
        
        // Dodanie do sceny
        cena.add(pyraminx);
        cena.add(grupo);
        
        // Ustawienie obsługi zdarzeń
        setupPyraminxEventListeners();
        
        // Rozpoczęcie animacji
        animatePyraminx();
        
        return {
            displayScrambledState: displayPyraminxScrambledState,
            resetVisualization: resetPyraminxVisualization,
            setAnimationSpeed: setPyraminxAnimationSpeed
        };
    }

    // Aktualizacja kamery pyraminxa
    function updatePyraminxCamera() {
        const container = document.getElementById(visualizerContainerId);
        aspecto = container.clientWidth / container.clientHeight;
        camera.left = -frustum * aspecto / 2;
        camera.right = frustum * aspecto / 2;
        camera.position.set(0, 0, 10);
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Renderowanie sceny pyraminxa
    function renderPyraminx() {
        renderer.render(cena, camera);
    }

    // Ustawienie event listenerów dla pyraminxa
    function setupPyraminxEventListeners() {
        window.addEventListener('resize', function() {
            updatePyraminxCamera();
            renderPyraminx();
        });
        
        orbita.addEventListener('change', function() {
            renderPyraminx();
        });
    }

    // Funkcja animacji pyraminxa
    function animatePyraminx() {
        requestAnimationFrame(animatePyraminx);
        
        if (grupo && grupo.estaVazio()) {
            tratarEventosPyraminx();
        } else {
            if (rotacao) {
                rotacao();
            }
        }
        
        renderPyraminx();
    }

    // Funkcja obsługi zdarzeń pyraminxa
    function tratarEventosPyraminx() {
        if (eventos.length != 0) {
            let eventData = eventos.shift();
            
            if (eventData.reverse) {
                rotacao = grupo.rotacionarReverse(eventData.moveType);
            } else {
                rotacao = grupo.rotacionar(eventData.moveType);
            }
        }
    }

    // Mapowanie notacji pyraminxa do ruchów
    const moveMapping = {
        'U': 'OctaedroA',  // Górna ścianka (czerwony)
        'L': 'OctaedroB',  // Lewa ścianka (zielony)  
        'R': 'OctaedroC',  // Prawa ścianka (niebieski)
        'B': 'OctaedroD',  // Tylna ścianka (żółty)
        'u': 'TetraedroA', // Górny wierzchołek
        'l': 'TetraedroB', // Lewy wierzchołek
        'r': 'TetraedroC', // Prawy wierzchołek 
        'b': 'TetraedroD'  // Tylny wierzchołek
    };

    // Parsowanie algorytmu na ruchy
    function parseAlgorithm(notation) {
        const moves = [];
        const tokens = notation.match(/[ULRBulrb]['2]?/g) || [];
        
        tokens.forEach(token => {
            const move = token[0];
            const modifier = token.slice(1);
            
            if (moveMapping[move]) {
                const moveType = moveMapping[move];
                
                if (modifier === "'") {
                    moves.push({ moveType: moveType, reverse: true });
                } else if (modifier === "2") {
                    moves.push({ moveType: moveType, reverse: false });
                    moves.push({ moveType: moveType, reverse: false });
                } else {
                    moves.push({ moveType: moveType, reverse: false });
                }
            }
        });
        
        return moves;
    }

    // Wyświetlenie potasowanego stanu pyraminxa
    function displayPyraminxScrambledState(scrambleString, animated = false) {
        if (!scrambleString) {
            resetPyraminxVisualization();
            return;
        }

        // Reset pyraminxa przed wykonaniem scramble
        resetPyraminxVisualization();
        
        // Poczekaj krótko na reset, potem wykonaj scramble
        setTimeout(() => {
            const moves = parseAlgorithm(scrambleString);
            
            if (moves.length === 0) {
                console.warn('Nie znaleziono prawidłowych ruchów w scramble:', scrambleString);
                return;
            }
            
            if (animated) {
                // Dodaj ruchy do kolejki zdarzeń dla animacji
                moves.forEach(move => {
                    eventos.push(move);
                });
            } else {
                // Wykonaj ruchy natychmiastowo
                moves.forEach(move => {
                    if (move.reverse) {
                        let rotation = grupo.rotacionarReverse(move.moveType);
                        // Wykonaj obrót do końca
                        while (rotation && !grupo.estaVazio()) {
                            rotation();
                        }
                    } else {
                        let rotation = grupo.rotacionar(move.moveType);
                        // Wykonaj obrót do końca
                        while (rotation && !grupo.estaVazio()) {
                            rotation();
                        }
                    }
                });
                renderPyraminx();
            }
        }, 100);
    }

    // Reset wizualizacji pyraminxa
    function resetPyraminxVisualization() {
        // Wyczyść kolejkę zdarzeń
        eventos = [];
        isAnimating = false;
        rotacao = null;
        
        // Usuń obecny pyraminx i stwórz nowy
        if (pyraminx) {
            cena.remove(pyraminx);
            cena.remove(grupo);
        }
        
        let tetraedroMath = TetraedroMath(2);
        pyraminx = Pyraminx(tetraedroMath, vermelho, verde, azul, amarelo, preto);
        grupo = Grupo(pyraminx);
        
        cena.add(pyraminx);
        cena.add(grupo);
        
        renderPyraminx();
    }

    // Ustawienie prędkości animacji
    function setPyraminxAnimationSpeed(speed) {
        // Ta funkcja może być rozszerzona w przyszłości
        console.log('Ustawiono prędkość animacji pyraminxa:', speed);
    }

    // Inicjalizacja wizualizatora
    pyraminxVisualizerInstance = initPyraminxVisualizer();
    if (!pyraminxVisualizerInstance) {
        console.error("Nie udało się zainicjalizować wizualizatora pyraminxa.");
        const container = document.getElementById(visualizerContainerId);
        if(container) container.innerHTML = "Błąd ładowania wizualizacji pyraminxa.";
    }

    // --- Generowanie tasowania ---
    function generateAndDisplayScramble() {
        // Zresetuj wizualizator NAJPIERW
        if (pyraminxVisualizerInstance && typeof pyraminxVisualizerInstance.resetVisualization === 'function') {
            try {
                pyraminxVisualizerInstance.resetVisualization();
            } catch (error) {
                console.error("Błąd resetowania wizualizatora przed generowaniem tasowania:", error);
            }
        } else {
            console.warn("Nie można zresetować wizualizatora - instancja lub funkcja niedostępna.");
        }

        // Wyczyść poprzednie czasy serii, jeśli rozpoczynasz nową serię
        if (isSeriesMode && currentSolveIndex === 0) {
            seriesTimes = [];
            scrambles = [];
            seriesTimesDisplay.innerHTML = '';
        }
        if (!isSeriesMode) {
             seriesTimesDisplay.innerHTML = '';
        }

        const length = parseInt(scrambleLengthInput.value, 10) || 15;
        const includeFaceMoves = includeFaceMovesCheckbox.checked;
        const includeTipMoves = includeTipMovesCheckbox.checked;

        if (typeof generatePyraminxScramble === 'function') {
            currentScramble = generatePyraminxScramble(length, {
                includeFaceMoves,
                includeTipMoves
            });
            
            // Zapisz tasowanie do późniejszego użycia
            scrambles[currentSolveIndex] = currentScramble;
            
            // Dodaj postęp serii do tekstu tasowania, jeśli jesteś w trybie serii
            const seriesPrefix = isSeriesMode ? `(${currentSolveIndex + 1}/${totalSolvesInSeries}) ` : '';
            scrambleDisplay.textContent = `Tasowanie ${seriesPrefix}: ${currentScramble}`;
        } else {
            currentScramble = '';
            scrambleDisplay.textContent = 'Tasowanie: Błąd generowania tasowania.';
            console.error("Funkcja generatePyraminxScramble nie została znaleziona.");
        }

        // Zresetuj timer i podpowiedź
        resetTimer();
        const startHint = isSeriesMode ? `Rozpocznij ułożenie ${currentSolveIndex + 1}` : 'Naciśnij Spację, aby rozpocząć';
        hintDisplay.textContent = startHint;
    }

     // --- Wizualizacja tasowania ---
    function visualizeCurrentScramble() {
        if (pyraminxVisualizerInstance && typeof pyraminxVisualizerInstance.displayScrambledState === 'function') {
            if (currentScramble) {
                // Sprawdź wybraną prędkość
                let animateScramble = false;
                let selectedSpeed = 'instant';
                try {
                    selectedSpeed = document.querySelector('input[name="scramble-speed"]:checked').value;
                } catch (e) {
                    console.warn("Nie można odczytać wartości kontroli prędkości, domyślnie ustawiono natychmiastową.");
                }
                animateScramble = (selectedSpeed === 'animated');
                
                // Pokaż/ukryj kontrolki prędkości animacji
                const speedControlContainer = document.querySelector('.animation-speed-control');
                if (speedControlContainer) {
                    speedControlContainer.style.display = animateScramble ? 'flex' : 'none';
                }
                
                // Ustaw prędkość animacji, jeśli animujemy
                if (animateScramble && animationSpeedSlider && pyraminxVisualizerInstance.setAnimationSpeed) {
                    const speedValue = parseInt(animationSpeedSlider.value, 10);
                    pyraminxVisualizerInstance.setAnimationSpeed(speedValue);
                }

                try {
                    pyraminxVisualizerInstance.displayScrambledState(currentScramble, animateScramble);
                } catch (error) {
                     console.error("Błąd wywołania displayScrambledState():", error);
                }
            } else {
                console.warn("Brak wygenerowanego tasowania do wizualizacji.");
                try {
                    pyraminxVisualizerInstance.displayScrambledState("", false);
                } catch (error) {
                     console.error("Błąd resetowania stanu wizualizatora:", error);
                }
            }
        } else {
            console.error("Instancja wizualizatora pyraminxa lub funkcja displayScrambledState niedostępna.");
        }
    }

    // --- Logika timera ---
    function startTimer() {
        if (!timerRunning) {
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 10);
            timerRunning = true;
            const stopHint = isSeriesMode ? `Zatrzymaj czas ułożenia ${currentSolveIndex + 1}` : 'Naciśnij Spację, aby zatrzymać';
            hintDisplay.textContent = stopHint;
        }
    }

    function stopTimer() {
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
            timerDisplay.textContent = finalTime;

            let nextHint = 'Naciśnij Spację, aby rozpocząć kolejny';

            // Obsługa logiki serii
            if (isSeriesMode) {
                seriesTimes[currentSolveIndex] = parseFloat(finalTime);
                
                // Aktualizuj wyświetlacz
                renderSeriesTimes();

                currentSolveIndex++;

                if (currentSolveIndex < totalSolvesInSeries) {
                    nextHint = `Naciśnij Spację, aby rozpocząć ułożenie ${currentSolveIndex + 1}`;
                } else {
                    // Seria zakończona
                    nextHint = 'Seria zakończona! Wygeneruj nowy scramble lub zmień ustawienia.';
                    displaySeriesStatistics();
                }
            }

            hintDisplay.textContent = nextHint;
        }
    }

    // Wyświetlanie statystyk serii
    function displaySeriesStatistics() {
        if (seriesTimes.length === 0) return;
        
        const avg = seriesTimes.reduce((a, b) => a + b, 0) / seriesTimes.length;
        const best = Math.min(...seriesTimes);
        const worst = Math.max(...seriesTimes);
        
        const statsElement = document.createElement('div');
        statsElement.classList.add('series-stats');
        statsElement.innerHTML = `
            <h3>Statystyki serii</h3>
            <p>Średnia: ${avg.toFixed(2)}s</p>
            <p>Najlepszy: ${best.toFixed(2)}s</p>
            <p>Najgorszy: ${worst.toFixed(2)}s</p>
        `;
        
        seriesTimesDisplay.appendChild(statsElement);
    }

    // Renderowanie czasów serii
    function renderSeriesTimes() {
        if (seriesTimes.length === 0) {
            seriesTimesDisplay.innerHTML = '';
            return;
        }
        
        const timesContainer = document.createElement('div');
        timesContainer.classList.add('series-times');
        timesContainer.innerHTML = '<h3>Czasy w serii</h3>';
        
        seriesTimes.forEach((time, index) => {
            const timeEntry = document.createElement('div');
            timeEntry.classList.add('time-entry');
            timeEntry.innerHTML = `
                <span class="time-number">${index + 1}.</span>
                <span class="time-value">${time.toFixed(2)}s</span>
            `;
            timesContainer.appendChild(timeEntry);
        });
        
        seriesTimesDisplay.innerHTML = '';
        seriesTimesDisplay.appendChild(timesContainer);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerDisplay.textContent = '0.00';
    }

    function updateTimer() {
        if (timerRunning) {
            const elapsed = (Date.now() - startTime) / 1000;
            timerDisplay.textContent = elapsed.toFixed(2);
        }
    }

    // --- Event Listeners ---
    
    // Obsługa klawiatury (spacja)
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            
            if (isSeriesMode && currentSolveIndex >= totalSolvesInSeries) {
                return; // Seria zakończona
            }
            
            if (timerRunning) {
                stopTimer();
                
                // Automatycznie wygeneruj nowy scramble jeśli w trybie serii
                if (isSeriesMode && currentSolveIndex < totalSolvesInSeries) {
                    setTimeout(() => {
                        generateAndDisplayScramble();
                    }, 500);
                }
            } else {
                startTimer();
            }
        }
    });

    // Przycisk regeneracji scramble
    regenScrambleBtn.addEventListener('click', () => {
        if (isSeriesMode) {
            // Reset serii
            currentSolveIndex = 0;
            seriesTimes = [];
            scrambles = [];
        }
        generateAndDisplayScramble();
    });

    // Przełączanie trybów
    singleSolveBtn.addEventListener('click', () => {
        isSeriesMode = false;
        currentSolveIndex = 0;
        seriesTimes = [];
        scrambles = [];
        
        singleSolveBtn.classList.add('active');
        seriesSolveBtn.classList.remove('active');
        seriesCountInput.disabled = true;
        seriesTimesDisplay.innerHTML = '';
        
        generateAndDisplayScramble();
    });

    seriesSolveBtn.addEventListener('click', () => {
        isSeriesMode = true;
        currentSolveIndex = 0;
        totalSolvesInSeries = Math.min(parseInt(seriesCountInput.value, 10) || 5, MAX_SERIES_LENGTH);
        seriesTimes = [];
        scrambles = [];
        
        seriesSolveBtn.classList.add('active');
        singleSolveBtn.classList.remove('active');
        seriesCountInput.disabled = false;
        
        generateAndDisplayScramble();
    });

    // Aktualizacja liczby ułożeń w serii
    seriesCountInput.addEventListener('change', () => {
        if (isSeriesMode) {
            totalSolvesInSeries = Math.min(parseInt(seriesCountInput.value, 10) || 5, MAX_SERIES_LENGTH);
            currentSolveIndex = 0;
            seriesTimes = [];
            scrambles = [];
            generateAndDisplayScramble();
        }
    });

    // Kontrolki wizualizatora
    visualizeScrambleBtn.addEventListener('click', visualizeCurrentScramble);
    resetVisualizerBtn.addEventListener('click', () => {
        if (pyraminxVisualizerInstance && pyraminxVisualizerInstance.resetVisualization) {
            pyraminxVisualizerInstance.resetVisualization();
        }
    });

    // Kontrolki prędkości animacji
    speedControlRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const speedControlContainer = document.querySelector('.animation-speed-control');
            if (speedControlContainer) {
                speedControlContainer.style.display = radio.value === 'animated' ? 'flex' : 'none';
            }
        });
    });

    // Suwak prędkości animacji
    if (animationSpeedSlider && speedValueDisplay) {
        animationSpeedSlider.addEventListener('input', () => {
            speedValueDisplay.textContent = animationSpeedSlider.value + 'ms';
        });
    }

    // Checkboxy typów ruchów
    [includeFaceMovesCheckbox, includeTipMovesCheckbox].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Sprawdź czy przynajmniej jeden typ jest zaznaczony
            if (!includeFaceMovesCheckbox.checked && !includeTipMovesCheckbox.checked) {
                // Przywróć poprzedni stan
                checkbox.checked = true;
                alert('Przynajmniej jeden typ ruchów musi być zaznaczony!');
                return;
            }
            
            // Wygeneruj nowy scramble z nowymi ustawieniami
            if (isSeriesMode) {
                currentSolveIndex = 0;
                seriesTimes = [];
                scrambles = [];
            }
            generateAndDisplayScramble();
        });
    });

    // Inicjalne wygenerowanie scramble
    generateAndDisplayScramble();
}); 