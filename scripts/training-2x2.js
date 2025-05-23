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

    // Zmienne stanu
    let timerInterval = null;
    let startTime = 0;
    let timerRunning = false;
    let currentScramble = '';
    let currentSolveIndex = 0;
    let totalSolvesInSeries = 0;
    let isSeriesMode = false;
    let scrambleVisualizerInstance = null;
    let seriesTimes = [];
    let scrambles = [];
    const MAX_SERIES_LENGTH = 10;

    // --- Inicjalizacja wizualizatora tasowania ---
    if (typeof ScrambleVisualizer !== 'undefined' && typeof ScrambleVisualizer.init === 'function') {
        scrambleVisualizerInstance = ScrambleVisualizer.init(visualizerContainerId);
        if (!scrambleVisualizerInstance) {
             console.error("Nie udało się zainicjalizować instancji wizualizatora tasowania.");
             const container = document.getElementById(visualizerContainerId);
             if(container) container.innerHTML = "Błąd ładowania wizualizacji kostki.";
        }
    } else {
        console.error("Skrypt wizualizatora tasowania nie został poprawnie załadowany.");
        const container = document.getElementById(visualizerContainerId);
        if(container) container.innerHTML = "Błąd ładowania skryptu wizualizacji kostki.";
    }

    // --- Generowanie tasowania ---
    function generateAndDisplayScramble() {
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.resetVisualization === 'function') {
            try {
                scrambleVisualizerInstance.resetVisualization();
            } catch (error) {
                console.error("Błąd resetowania wizualizatora przed generowaniem tasowania:", error);
            }
        } else {
             console.warn("Nie można zresetować wizualizatora - instancja lub funkcja niedostępna.");
        }

        if (isSeriesMode && currentSolveIndex === 0) {
            seriesTimes = [];
            scrambles = [];
            seriesTimesDisplay.innerHTML = '';
        }
        if (!isSeriesMode) {
             seriesTimesDisplay.innerHTML = '';
        }

        const length = parseInt(scrambleLengthInput.value, 10) || 12; // Domyślnie 12 dla 2x2

        if (typeof generateScramble === 'function') {
            currentScramble = generateScramble(length);
            scrambles[currentSolveIndex] = currentScramble;
            
            const seriesPrefix = isSeriesMode ? `(${currentSolveIndex + 1}/${totalSolvesInSeries}) ` : '';
            scrambleDisplay.textContent = `Tasowanie ${seriesPrefix}: ${currentScramble}`;
        } else {
            currentScramble = '';
            scrambleDisplay.textContent = 'Tasowanie: Błąd generowania tasowania.';
            console.error("Funkcja generateScramble nie została znaleziona.");
        }

        resetTimer();
        const startHint = isSeriesMode ? `Rozpocznij ułożenie ${currentSolveIndex + 1}` : 'Naciśnij Spację, aby rozpocząć';
        hintDisplay.textContent = startHint;
    }

    function visualizeCurrentScramble() {
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.displayScrambledState === 'function') {
            if (currentScramble) {
                let animateScramble = false;
                let selectedSpeed = 'instant';
                try {
                    selectedSpeed = document.querySelector('input[name="scramble-speed"]:checked').value;
                } catch (e) {
                    console.warn("Nie można odczytać wartości kontroli prędkości, domyślnie ustawiono natychmiastową.");
                }
                animateScramble = (selectedSpeed === 'animated');
                
                const speedControlContainer = document.querySelector('.animation-speed-control');
                if (speedControlContainer) {
                    speedControlContainer.style.display = animateScramble ? 'flex' : 'none';
                }
                
                if (animateScramble && animationSpeedSlider && scrambleVisualizerInstance.setAnimationSpeed) {
                    const speedValue = parseInt(animationSpeedSlider.value, 10);
                    scrambleVisualizerInstance.setAnimationSpeed(speedValue);
                }

                try {
                    scrambleVisualizerInstance.displayScrambledState(currentScramble, animateScramble);
                } catch (error) {
                     console.error("Błąd wywołania displayScrambledState():", error);
                }
            } else {
                console.warn("Brak wygenerowanego tasowania do wizualizacji.");
                 try {
                    scrambleVisualizerInstance.displayScrambledState("", false);
                 } catch (error) {
                     console.error("Błąd resetowania stanu wizualizatora:", error);
                 }
            }
        } else {
            console.error("Instancja wizualizatora tasowania lub funkcja displayScrambledState niedostępna.");
        }
    }

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

            if (isSeriesMode) {
                seriesTimes[currentSolveIndex] = parseFloat(finalTime);
                renderSeriesTimes();
                currentSolveIndex++;

                if (currentSolveIndex < totalSolvesInSeries) {
                    nextHint = `Naciśnij Spację, aby rozpocząć ułożenie ${currentSolveIndex + 1}`;
                } else {
                    nextHint = 'Seria zakończona! Wygeneruj nowy scramble lub zmień ustawienia.';
                    displaySeriesStatistics();
                }
            }

            hintDisplay.textContent = nextHint;
        }
    }

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

    function renderSeriesTimes() {
        seriesTimesDisplay.innerHTML = '';
        
        const gridContainer = document.createElement('div');
        gridContainer.classList.add('solve-grid');
        
        seriesTimes.forEach((time, index) => {
            const tile = document.createElement('div');
            tile.classList.add('solve-tile');
            tile.classList.add(isSeriesMode ? 'series' : 'single');
            tile.dataset.index = index;
            tile.textContent = time.toFixed(2);
            
            tile.title = scrambles[index] || '';
            
            tile.addEventListener('mouseenter', () => {
                const tooltipDiv = document.createElement('div');
                tooltipDiv.classList.add('scramble-tooltip');
                tooltipDiv.textContent = scrambles[index] || '';
                tile.appendChild(tooltipDiv);
            });
            
            tile.addEventListener('mouseleave', () => {
                const tooltip = tile.querySelector('.scramble-tooltip');
                if (tooltip) {
                    tile.removeChild(tooltip);
                }
            });
            
            gridContainer.appendChild(tile);
        });
        
        seriesTimesDisplay.appendChild(gridContainer);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerDisplay.textContent = '0.00';
        startTime = 0;
    }

    function updateTimer() {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        timerDisplay.textContent = elapsedTime;
    }

    // Event Listeners
    document.body.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
             event.preventDefault();
            if (!timerRunning && startTime === 0) {
                 if (isSeriesMode && currentSolveIndex >= totalSolvesInSeries) {
                     console.log("Series already complete. Generate new scramble or change mode.");
                     return;
                 }
                startTimer();
            } else if (timerRunning) {
                stopTimer();
            } else if (!timerRunning && startTime !== 0) {
                 if (!isSeriesMode || currentSolveIndex < totalSolvesInSeries) {
                     generateAndDisplayScramble();
                 } else {
                     console.log("Series complete. Press 'New Scramble' or change mode.");
                 }
            }
        }
    });

    regenScrambleBtn.addEventListener('click', () => {
        currentSolveIndex = 0;
        seriesTimes = [];
        scrambles = [];
        seriesTimesDisplay.innerHTML = '';
        generateAndDisplayScramble();
    });
    
    scrambleLengthInput.addEventListener('change', generateAndDisplayScramble);
    visualizeScrambleBtn.addEventListener('click', visualizeCurrentScramble);

    resetVisualizerBtn.addEventListener('click', () => {
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.resetVisualization === 'function') {
             try {
                scrambleVisualizerInstance.resetVisualization();
             } catch (error) {
                console.error("Error calling resetVisualization():", error);
             }
        } else {
            console.error("Scramble visualizer instance or resetVisualization function not available.");
        }
    });

    singleSolveBtn.addEventListener('click', () => {
        isSeriesMode = false;
        seriesTimesDisplay.innerHTML = '';
        singleSolveBtn.classList.add('active');
        seriesSolveBtn.classList.remove('active');
        seriesCountInput.disabled = true;
        currentSolveIndex = 0;
        
        document.body.classList.remove('series-mode-active');
        document.body.classList.add('single-mode-active');
        
        const seriesTiles = document.querySelectorAll('.solve-tile.series');
        seriesTiles.forEach(tile => {
            tile.classList.add('disabled');
        });
        
        generateAndDisplayScramble();
    });

    seriesSolveBtn.addEventListener('click', () => {
        isSeriesMode = true;
        seriesTimesDisplay.innerHTML = '';
        seriesSolveBtn.classList.add('active');
        singleSolveBtn.classList.remove('active');
        seriesCountInput.disabled = false;
        currentSolveIndex = 0;
        totalSolvesInSeries = Math.min(parseInt(seriesCountInput.value, 10) || 5, MAX_SERIES_LENGTH);
        seriesCountInput.value = totalSolvesInSeries;
        
        document.body.classList.remove('single-mode-active');
        document.body.classList.add('series-mode-active');
        
        const singleTiles = document.querySelectorAll('.solve-tile.single');
        singleTiles.forEach(tile => {
            tile.classList.add('disabled');
        });
        
        generateAndDisplayScramble();
    });

    seriesCountInput.addEventListener('change', () => {
        if (isSeriesMode) {
             totalSolvesInSeries = Math.min(parseInt(seriesCountInput.value, 10) || 5, MAX_SERIES_LENGTH);
             seriesCountInput.value = totalSolvesInSeries;
             currentSolveIndex = 0;
             seriesTimes = [];
             scrambles = [];
             seriesTimesDisplay.innerHTML = '';
             generateAndDisplayScramble();
        }
    });

    // Obsługa kontrolek prędkości animacji
    speedControlRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const speedControlContainer = document.querySelector('.animation-speed-control');
            if (speedControlContainer) {
                speedControlContainer.style.display = (radio.value === 'animated') ? 'flex' : 'none';
            }
        });
    });

    if (animationSpeedSlider && speedValueDisplay) {
        animationSpeedSlider.addEventListener('input', () => {
            speedValueDisplay.textContent = `${animationSpeedSlider.value}ms`;
        });
    }

    // Ukryj kontrolki prędkości animacji domyślnie
    const speedControlContainer = document.querySelector('.animation-speed-control');
    if (speedControlContainer) {
        speedControlContainer.style.display = 'none';
    }

    document.body.classList.add('single-mode-active');

    // Wygeneruj pierwsze tasowanie
    generateAndDisplayScramble();
}); 