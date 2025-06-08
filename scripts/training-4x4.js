document.addEventListener('DOMContentLoaded', () => {
    // Elementy UI
    const timerDisplay = document.getElementById('timer-display');
    const hintDisplay = document.getElementById('hint-display');
    const regenScrambleBtn = document.getElementById('regen-scramble-btn');
    const singleSolveBtn = document.getElementById('single-solve-btn');
    const seriesSolveBtn = document.getElementById('series-solve-btn');
    const seriesCountInput = document.getElementById('series-count');
    const scrambleLengthInput = document.getElementById('scramble-length');
    // Przyciski wizualizacji zostały usunięte z interfejsu 4x4
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
    
    // Elementy specyficzne dla 4x4 zostały usunięte - używamy wszystkich typów ruchów

    // POPRAWKA: Sprawdzenie czy krytyczne elementy istnieją
    if (!timerDisplay || !hintDisplay || !regenScrambleBtn || !singleSolveBtn || !seriesSolveBtn || !scrambleDisplay) {
        console.error("Krytyczne elementy DOM nie zostały znalezione. Sprawdź HTML strony.");
        return; // Przerwij wykonanie jeśli brakuje kluczowych elementów
    }

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
    if (typeof ScrambleVisualizer4x4 !== 'undefined' && typeof ScrambleVisualizer4x4.init === 'function') {
        scrambleVisualizerInstance = ScrambleVisualizer4x4.init(visualizerContainerId);
        if (!scrambleVisualizerInstance) {
             console.error("Nie udało się zainicjalizować instancji wizualizatora tasowania 4x4.");
             // Opcjonalnie wyświetl komunikat o błędzie użytkownikowi w kontenerze wizualizatora
             const container = document.getElementById(visualizerContainerId);
             if(container) container.innerHTML = "Błąd ładowania wizualizacji kostki 4x4.";
        }
    } else {
        console.error("Skrypt wizualizatora tasowania 4x4 nie został poprawnie załadowany.");
        const container = document.getElementById(visualizerContainerId);
        if(container) container.innerHTML = "Błąd ładowania skryptu wizualizacji kostki 4x4.";
    }

    // --- Generowanie tasowania ---
    function generateAndDisplayScramble() {
        // Zresetuj wizualizator NAJPIERW
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.resetVisualization === 'function') {
            try {
                scrambleVisualizerInstance.resetVisualization();
            } catch (error) {
                console.error("Błąd resetowania wizualizatora przed generowaniem tasowania:", error);
            }
        } else {
             console.warn("Nie można zresetować wizualizatora - instancja lub funkcja niedostępna.");
        }

        // --- Wyczyść poprzednie czasy serii, jeśli rozpoczynasz nową serię ---
        if (isSeriesMode && currentSolveIndex === 0) {
            seriesTimes = [];
            scrambles = [];
            seriesTimesDisplay.innerHTML = ''; // Wyczyść wyświetlacz
        }
        // Wyczyść również, jeśli wychodzisz z trybu serii
        if (!isSeriesMode) {
             seriesTimesDisplay.innerHTML = '';
        }
        // --- Koniec czyszczenia ---

        // POPRAWKA: Używam właściwej wartości z custom input dla długości scramble'a
        const length = parseInt(scrabbleLengthInput?.value, 10) || 40;
        
        // Zawsze używaj wszystkich typów ruchów dla 4x4
        const includeBasic = true;
        const includeInner = true;
        const includeWide = true;

        if (typeof generateScramble4x4 === 'function') {
            currentScramble = generateScramble4x4(length, {
                includeBasic,
                includeInner,
                includeWide
            });
            // Zapisz tasowanie do późniejszego użycia
            scrambles[currentSolveIndex] = currentScramble;

            if (scrambleDisplay) {
                scrambleDisplay.textContent = `${currentScramble}`;
            }
        } else {
            currentScramble = '';
            if (scrambleDisplay) {
                scrambleDisplay.textContent = 'Tasowanie: Błąd generowania tasowania 4x4.';
            }
            console.error("Funkcja generateScramble4x4 nie została znaleziona.");
        }

        // Zresetuj timer i podpowiedź
        resetTimer();
        const startHint = isSeriesMode ? `Start attempt ${currentSolveIndex + 1}` : 'Press SPACE to begin';
        if (hintDisplay) {
            hintDisplay.textContent = startHint;
        }
    }

     // --- Wizualizacja tasowania ---
    function visualizeCurrentScramble() {
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.displayScrambledState === 'function') {
            if (currentScramble) {
                // --- POPRAWKA: Domyślnie wykonuj animację ruchów (jak w 3x3) ---
                let animateScramble = true;
                let selectedSpeed = 'animated';
                try {
                    const speedControl = document.querySelector('input[name="scramble-speed"]:checked');
                    if (speedControl) {
                        selectedSpeed = speedControl.value;
                        animateScramble = (selectedSpeed === 'animated');
                    }
                } catch (e) {
                    console.warn("Nie można odczytać wartości kontroli prędkości, używam animacji.");
                }
                
                // Pokaż/ukryj kontrolki prędkości animacji w zależności od wybranego trybu
                const speedControlContainer = document.querySelector('.animation-speed-control');
                if (speedControlContainer) {
                    speedControlContainer.style.display = animateScramble ? 'flex' : 'none';
                }
                
                // Ustaw prędkość animacji, jeśli mamy suwak i animujemy
                if (animateScramble && animationSpeedSlider && scrambleVisualizerInstance.setAnimationSpeed) {
                    const speedValue = parseInt(animationSpeedSlider.value, 10);
                    scrambleVisualizerInstance.setAnimationSpeed(speedValue);
                }
                // --- Koniec sprawdzania prędkości ---

                try {
                    // Przekaż flagę animacji do wizualizatora
                    scrambleVisualizerInstance.displayScrambledState(currentScramble, animateScramble);
                } catch (error) {
                     console.error("Błąd wywołania displayScrambledState():", error);
                }
            } else {
                console.warn("Brak wygenerowanego tasowania do wizualizacji.");
                // Zresetuj wizualizator do stanu ułożonego, jeśli próbujesz wizualizować pusty stan
                 try {
                    scrambleVisualizerInstance.displayScrambledState("", false); // Zawsze natychmiastowy reset
                 } catch (error) {
                     console.error("Błąd resetowania stanu wizualizatora:", error);
                 }
            }
        } else {
            console.error("Instancja wizualizatora tasowania 4x4 lub funkcja displayScrambledState niedostępna.");
        }
    }

    // --- Logika timera ---
    function startTimer() {
        if (!timerRunning) {
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 10); // Aktualizuj co 10ms dla 2 miejsc po przecinku
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

            // --- Obsługa logiki serii ---
            if (isSeriesMode) {
                seriesTimes[currentSolveIndex] = parseFloat(finalTime);
                
                // Aktualizuj wyświetlacz
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
                    // Seria zakończona
                    nextHint = 'Series complete! Generate new scramble or change settings.';
                    
                    // Wyświetl statystyki
                    displaySeriesStatistics();
                }
            }
            // --- Koniec logiki serii ---

            hintDisplay.textContent = nextHint;
        }
    }

    // --- Funkcja do wyświetlania statystyk serii ---
    function displaySeriesStatistics() {
        if (seriesTimes.length === 0) return;
        
        // Oblicz statystyki
        const avg = seriesTimes.reduce((a, b) => a + b, 0) / seriesTimes.length;
        const best = Math.min(...seriesTimes);
        const worst = Math.max(...seriesTimes);
        
        // Utwórz element statystyk
        const statsElement = document.createElement('div');
        statsElement.classList.add('series-stats');
        statsElement.innerHTML = `
            <h3>Statystyki serii</h3>
            <p>Średnia: ${avg.toFixed(2)}s</p>
            <p>Najlepszy: ${best.toFixed(2)}s</p>
            <p>Najgorszy: ${worst.toFixed(2)}s</p>
        `;
        
        // Dodaj do wyświetlacza czasów serii
        seriesTimesDisplay.appendChild(statsElement);
        
        // Dodaj klasę ukończenia
        seriesTimesDisplay.classList.add('series-complete');
    }

    // --- Funkcja renderowania czasów serii ---
    function renderSeriesTimes() {
        if (!isSeriesMode || seriesTimes.length === 0) {
            seriesTimesDisplay.innerHTML = '';
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

        seriesTimesDisplay.innerHTML = '';
        seriesTimesDisplay.appendChild(grid);
    }

    // USUNIĘTE: Funkcje tooltip - teraz pokazujemy scramble w głównym okienku

    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerDisplay.textContent = '0.00';
    }

    function updateTimer() {
        if (timerRunning) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            timerDisplay.textContent = elapsed;
        }
    }

    // --- Obsługa przełączania trybu ---
    function setMode(isSeries) {
        isSeriesMode = isSeries;
        singleSolveBtn.classList.toggle('active', !isSeries);
        seriesSolveBtn.classList.toggle('active', isSeries);
        seriesCountInput.disabled = !isSeries;
        
        if (isSeries) {
            totalSolvesInSeries = parseInt(seriesCountInput.value, 10) || 5;
            currentSolveIndex = 0;
            seriesTimes = [];
            scrambles = [];
        } else {
            currentSolveIndex = 0;
            seriesTimesDisplay.innerHTML = '';
        }
        
        // Usuń klasę ukończenia serii
        seriesTimesDisplay.classList.remove('series-complete');
        
        generateAndDisplayScramble();
    }

    // Mode selection listeners (Clear times display when changing mode)
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

    regenScrambleBtn.addEventListener('click', () => {
        // Reset everything when generating a new scramble
        currentSolveIndex = 0;
        seriesTimes = [];
        scrambles = [];
        if (seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = '';
        }
        generateAndDisplayScramble();
        // POPRAWKA: Automatycznie wykonuj animację ruchów po wygenerowaniu
        setTimeout(() => {
            visualizeCurrentScramble();
        }, 100);
    });

    // --- Obsługa klawiatury ---
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            
            if (isSeriesMode && currentSolveIndex >= totalSolvesInSeries) {
                // Seria zakończona, nie rób nic
                return;
            }
            
            if (timerRunning) {
                stopTimer();
                
                // Sprawdź czy należy wygenerować następne tasowanie
                if (isSeriesMode && currentSolveIndex < totalSolvesInSeries) {
                    setTimeout(() => {
                        generateAndDisplayScramble();
                    }, 500);
                } else if (!isSeriesMode) {
                    setTimeout(() => {
                        generateAndDisplayScramble();
                    }, 500);
                }
            } else {
                startTimer();
            }
        }
    });

    // NOWA OBSŁUGA CUSTOM DROPDOWNÓW
    // Series count dropdown
    if (seriesCount && selectedSeriesCount && seriesCountOptionsList && seriesCountOptions.length > 0) {
        selectedSeriesCount.addEventListener('click', () => {
            seriesCountOptionsList.classList.toggle('series-count-options-visible');
        });

        seriesCountOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (selectedSeriesCountSpan) {
                    selectedSeriesCountSpan.textContent = option.textContent;
                }
                // Update selected state
                seriesCountOptions.forEach(opt => opt.classList.remove('series-count-options-selected'));
                option.classList.add('series-count-options-selected');
                seriesCountOptionsList.classList.remove('series-count-options-visible');
                
                // Update series if in series mode
                if (isSeriesMode) {
                    totalSolvesInSeries = Math.min(parseInt(option.textContent, 10) || 5, MAX_SERIES_LENGTH);
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

    // Scramble length dropdown  
    if (scrambleLengthButton && scrambleLengthMenu && scrabbleLengthInput) {
        scrambleLengthButton.addEventListener('click', () => {
            scrambleLengthMenu.classList.toggle('scramble-length-menu-visible');
        });

        const minusBtn = scrambleLengthMenu.querySelector('.minus');
        const plusBtn = scrambleLengthMenu.querySelector('.plus');

        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                let currentValue = parseInt(scrabbleLengthInput.value, 10) || 40;
                if (currentValue > 20) {
                    scrabbleLengthInput.value = currentValue - 1;
                    if (scrambleLengthSpan) {
                        scrambleLengthSpan.textContent = scrabbleLengthInput.value;
                    }
                }
            });
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                let currentValue = parseInt(scrabbleLengthInput.value, 10) || 40;
                if (currentValue < 80) {
                    scrabbleLengthInput.value = currentValue + 1;
                    if (scrambleLengthSpan) {
                        scrambleLengthSpan.textContent = scrabbleLengthInput.value;
                    }
                }
            });
        }

        if (scrabbleLengthInput) {
            scrabbleLengthInput.addEventListener('blur', () => {
                let value = parseInt(scrabbleLengthInput.value, 10);
                if (isNaN(value) || value < 20) value = 20;
                if (value > 80) value = 80;
                scrabbleLengthInput.value = value;
                if (scrambleLengthSpan) {
                    scrambleLengthSpan.textContent = value;
                }
            });
        }
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (seriesCountOptionsList && !seriesCount?.contains(e.target)) {
            seriesCountOptionsList.classList.remove('series-count-options-visible');
        }
        if (scrambleLengthMenu && !scrambleLength?.contains(e.target)) {
            scrambleLengthMenu.classList.remove('scramble-length-menu-visible');
        }
    });

    // --- Obsługa kontrolek prędkości ---
    speedControlRadios.forEach(radio => {
        if (radio) {
            radio.addEventListener('change', () => {
                const speedControlContainer = document.querySelector('.animation-speed-control');
                if (speedControlContainer) {
                    speedControlContainer.style.display = radio.value === 'animated' ? 'flex' : 'none';
                }
            });
        }
    });

    if (animationSpeedSlider && speedValueDisplay) {
        animationSpeedSlider.addEventListener('input', () => {
            speedValueDisplay.textContent = animationSpeedSlider.value + 'ms';
        });
    }

    // Obsługa opcji scramble'a została usunięta - zawsze używamy wszystkich typów ruchów

    // --- Inicjalizacja ---
    // Ustaw początkową widoczność kontrolek animacji
    const speedControlContainer = document.querySelector('.animation-speed-control');
    if (speedControlContainer) {
        speedControlContainer.style.display = 'none'; // Domyślnie ukryte
    }
    
    // Wygeneruj pierwsze tasowanie
    generateAndDisplayScramble();
    
    console.log("Moduł treningowy 4x4 załadowany");
}); 