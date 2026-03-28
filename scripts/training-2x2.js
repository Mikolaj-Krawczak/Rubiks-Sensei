document.addEventListener('DOMContentLoaded', () => {
    // Elementy UI
    const timerDisplay = document.getElementById('timer-display');
    const hintDisplay = document.getElementById('hint-display');
    const regenScrambleBtn = document.getElementById('regen-scramble-btn');
    const singleSolveBtn = document.getElementById('single-solve-btn');
    const seriesSolveBtn = document.getElementById('series-solve-btn');
    const seriesCountInput = document.getElementById('series-count');
    const scrambleLengthInput = document.getElementById('scramble-length');
    // Przyciski wizualizacji zostały usunięte z interfejsu
    const visualizerContainerId = 'scramble-visualizer-space';
    const seriesTimesDisplay = document.getElementById('series-times-display');
    const speedControlRadios = document.querySelectorAll('input[name="scramble-speed"]');
    const animationSpeedSlider = document.getElementById('animation-speed');
    const speedValueDisplay = document.getElementById('speed-value');
    const seriesCount = document.querySelector('#series-count');
    const selectedSeriesCount = document.querySelector('.selected-series-count');
    const selectedSeriesCountSpan = document.querySelector("#selected-series-count-span")
    const seriesCountOptionsList = document.querySelector(".series-count-options")
    const seriesCountOptions = document.querySelectorAll(".series-count-options > li")
    const scrambleDisplay = document.querySelector("#scramble-display")

    const scrambleLengthButton = document.querySelector(".scramble-length-button")
    const scrambleLength = document.querySelector("#scramble-length")
    const scrambleLengthMenu = document.querySelector(".scramble-length-menu")
    const scrambleLengthSpan = document.querySelector("#scramble-length-span")
    const scrabbleLengthInput = document.querySelector("#scrabble-length-input")

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

        const length = parseInt(scrabbleLengthInput?.value, 10) || 12; // Domyślnie 12 dla 2x2

        if (typeof generateScramble === 'function') {
            currentScramble = generateScramble(length);
            scrambles[currentSolveIndex] = currentScramble;

            if (scrambleDisplay) {
                scrambleDisplay.textContent = `${currentScramble}`;
            }
        } else {
            currentScramble = '';
            if (scrambleDisplay) {
                scrambleDisplay.textContent = 'Scramble: Error generating scramble.';
            }
            console.error("Funkcja generateScramble nie została znaleziona.");
        }

        resetTimer();
        const startHint = isSeriesMode ? `Start solve ${currentSolveIndex + 1}` : 'Press SPACE to start';
        hintDisplay.textContent = startHint;
    }

    function visualizeCurrentScramble() {
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.displayScrambledState === 'function') {
            if (currentScramble) {
                // Zawsze używaj animacji z ustaloną prędkością
                const animateScramble = true;
                const fixedSpeed = 150; // Stała, szybka ale czytelna prędkość (150ms)
                
                // Ustaw stałą prędkość animacji
                if (scrambleVisualizerInstance.setAnimationSpeed) {
                    scrambleVisualizerInstance.setAnimationSpeed(fixedSpeed);
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
            const stopHint = isSeriesMode ? `Stop timer — solve ${currentSolveIndex + 1}` : 'Press SPACE to stop';
            hintDisplay.textContent = stopHint;
        }
    }

    function stopTimer() {
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
            timerDisplay.textContent = finalTime;

            let nextHint = 'Press SPACE for next attempt';

            if (isSeriesMode) {
                seriesTimes[currentSolveIndex] = parseFloat(finalTime);
                renderSeriesTimes();
                currentSolveIndex++;

                if (currentSolveIndex < totalSolvesInSeries) {
                    nextHint = `Start attempt ${currentSolveIndex + 1}`;
                    // POPRAWKA: Automatycznie wygeneruj i wizualizuj następny scramble w serii
                    setTimeout(() => {
                        generateAndDisplayScramble();
                        setTimeout(() => {
                            visualizeCurrentScramble();
                        }, 100);
                    }, 500);
                } else {
                    nextHint = 'Series complete! Generate new scramble or change settings.';
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
            <h3>Series statistics</h3>
            <p>Average: ${avg.toFixed(2)}s</p>
            <p>Best: ${best.toFixed(2)}s</p>
            <p>Worst: ${worst.toFixed(2)}s</p>
        `;
        
        seriesTimesDisplay.appendChild(statsElement);
    }

    function renderSeriesTimes() {
        if (!isSeriesMode || seriesTimes.length === 0) {
            if (seriesTimesDisplay) {
                seriesTimesDisplay.innerHTML = '';
            }
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'solve-grid';

        seriesTimes.forEach((time, index) => {
            const tile = document.createElement('div');
            tile.className = 'solve-tile';
            // Prosta struktura jak w kostce 3x3 - tylko czas bez numeru próby
            tile.textContent = time.toFixed(2);
            
            // Dodaj event listenery dla pokazywania scramble w głównym okienku
            if (scrambles[index]) {
                tile.title = scrambles[index];
                tile.addEventListener('mouseenter', () => {
                    if (scrambleDisplay) {
                        scrambleDisplay.textContent = scrambles[index];
                    }
                });
                tile.addEventListener('mouseleave', () => {
                    if (scrambleDisplay && currentScramble) {
                        scrambleDisplay.textContent = currentScramble;
                    }
                });
            }
            
            grid.appendChild(tile);
        });

        if (seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = '';
            seriesTimesDisplay.appendChild(grid);
        }
    }

    // USUNIĘTE: Funkcje tooltip - teraz pokazujemy scramble w głównym okienku

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
        if (seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = '';
        }
        generateAndDisplayScramble();
        // POPRAWKA: Automatycznie wykonaj ruchy scramble'a po wygenerowaniu
        setTimeout(() => {
            visualizeCurrentScramble();
        }, 100);
    });
    
    // Naprawiony event listener dla długości scramble'a
    if (scrabbleLengthInput) {
        scrabbleLengthInput.addEventListener('change', generateAndDisplayScramble);
    }
    
    // Przyciski "Visualize" i "Reset" zostały usunięte z interfejsu

    singleSolveBtn.addEventListener('click', () => {
        isSeriesMode = false;
        if (seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = '';
        }
        singleSolveBtn.classList.add('active');
        seriesSolveBtn.classList.remove('active');
        if (seriesCount) {
            seriesCount.classList.remove("active");
        }
        currentSolveIndex = 0;
        
        const seriesTiles = document.querySelectorAll('.solve-tile.series');
        seriesTiles.forEach(tile => {
            tile.classList.add('disabled');
        });
    });

    seriesSolveBtn.addEventListener('click', () => {
        isSeriesMode = true;
        if (seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = '';
        }
        seriesSolveBtn.classList.add('active');
        if (seriesCount) {
            seriesCount.classList.add('active');
        }
        singleSolveBtn.classList.remove('active');
        currentSolveIndex = 0;
        totalSolvesInSeries = Math.min(parseInt(selectedSeriesCountSpan?.textContent, 10) || 5, MAX_SERIES_LENGTH);
        
        const singleTiles = document.querySelectorAll('.solve-tile.single');
        singleTiles.forEach(tile => {
            tile.classList.add('disabled');
        });
    });

    // USUNIĘTE: seriesCountInput nie istnieje w nowym HTML - używamy custom dropdown

    // Kontrolki prędkości zostały usunięte - używamy stałej prędkości animacji

    // Obsługa custom dropdownów - dodane z training-3x3.js

    // Obsługa custom select dla liczby ułożeń w serii
    if (seriesCountOptions) {
        seriesCountOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (selectedSeriesCountSpan) {
                    selectedSeriesCountSpan.textContent = option.textContent;
                }
                seriesCountOptions.forEach(opt => opt.classList.remove('series-count-options-selected'));
                option.classList.add('series-count-options-selected');
                if (seriesCountOptionsList) {
                    seriesCountOptionsList.classList.toggle("series-count-options-visible");
                }
                
                // Aktualizuj totalSolvesInSeries gdy zmienia się wybór
                if (isSeriesMode) {
                    totalSolvesInSeries = Math.min(parseInt(selectedSeriesCountSpan?.textContent, 10) || 5, MAX_SERIES_LENGTH);
                    currentSolveIndex = 0;
                    seriesTimes = [];
                    scrambles = [];
                    if (seriesTimesDisplay) {
                        seriesTimesDisplay.innerHTML = '';
                    }
                }
            });
        });
    }

    // Obsługa zmian wartości w custom input dla długości scramble'a
    if (scrabbleLengthInput && scrambleLengthSpan) {
        scrabbleLengthInput.addEventListener('input', () => {
            scrambleLengthSpan.textContent = scrabbleLengthInput.value;
        });
    }

    // Obsługa przycisków plus/minus dla długości scramble'a
    const plusButton = document.querySelector('.scramble-length-menu .plus');
    const minusButton = document.querySelector('.scramble-length-menu .minus');
    
    if (plusButton && scrabbleLengthInput && scrambleLengthSpan) {
        plusButton.addEventListener('click', () => {
            scrabbleLengthInput.stepUp();
            scrambleLengthSpan.textContent = scrabbleLengthInput.value;
        });
    }
    
    if (minusButton && scrabbleLengthInput && scrambleLengthSpan) {
        minusButton.addEventListener('click', () => {
            scrabbleLengthInput.stepDown();
            scrambleLengthSpan.textContent = scrabbleLengthInput.value;
        });
    }

    // Series count custom select
    if (selectedSeriesCount && seriesCountOptionsList && seriesTimesDisplay) {
        selectedSeriesCount.addEventListener('click', () => {
            isSeriesMode = true;
            if (seriesCount) {
                seriesCount.classList.add('active');
            }
            singleSolveBtn.classList.remove("active");
            seriesSolveBtn.classList.add("active");
            seriesCountOptionsList.classList.toggle("series-count-options-visible");
            seriesTimesDisplay.innerHTML = '';
            currentSolveIndex = 0;
            totalSolvesInSeries = Math.min(parseInt(selectedSeriesCountSpan?.textContent, 10) || 5, MAX_SERIES_LENGTH);
        });
    }

    // Close series count dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (seriesCount && !seriesCount.contains(e.target) && seriesCountOptionsList) {
            seriesCountOptionsList.classList.remove('series-count-options-visible');
        }
        if (scrambleLength && !scrambleLength.contains(e.target) && scrambleLengthMenu) {
            scrambleLengthMenu.classList.remove("scramble-length-menu-visible");
        }
    });

    if (scrambleLengthButton && scrambleLengthMenu) {
        scrambleLengthButton.addEventListener("click", () => {
            scrambleLengthMenu.classList.toggle("scramble-length-menu-visible");
        });
    }

    // Ustaw początkowy stan interfejsu
    if (scrambleDisplay) {
        scrambleDisplay.textContent = 'Press "Scramble" to generate a scramble';
    }
    if (hintDisplay) {
        hintDisplay.textContent = 'Generate a scramble first';
    }

    document.body.classList.add('single-mode-active');
}); 
