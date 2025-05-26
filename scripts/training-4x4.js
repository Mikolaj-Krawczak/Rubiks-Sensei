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
    
    // Elementy specyficzne dla 4x4
    const includeBasicCheckbox = document.getElementById('includeBasic');
    const includeInnerCheckbox = document.getElementById('includeInner');
    const includeWideCheckbox = document.getElementById('includeWide');

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

        const length = parseInt(scrambleLengthInput.value, 10) || 40;
        
        // Pobierz opcje dla scramble'a 4x4
        const includeBasic = includeBasicCheckbox.checked;
        const includeInner = includeInnerCheckbox.checked;
        const includeWide = includeWideCheckbox.checked;

        if (typeof generateScramble4x4 === 'function') {
            currentScramble = generateScramble4x4(length, {
                includeBasic,
                includeInner,
                includeWide
            });
            // Zapisz tasowanie do późniejszego użycia
            scrambles[currentSolveIndex] = currentScramble;
            
            // Dodaj postęp serii do tekstu tasowania, jeśli jesteś w trybie serii
            const seriesPrefix = isSeriesMode ? `(${currentSolveIndex + 1}/${totalSolvesInSeries}) ` : '';
            scrambleDisplay.textContent = `Tasowanie ${seriesPrefix}: ${currentScramble}`;
        } else {
            currentScramble = '';
            scrambleDisplay.textContent = 'Tasowanie: Błąd generowania tasowania 4x4.';
            console.error("Funkcja generateScramble4x4 nie została znaleziona.");
        }

        // Zresetuj timer i podpowiedź
        resetTimer();
        const startHint = isSeriesMode ? `Rozpocznij ułożenie ${currentSolveIndex + 1}` : 'Naciśnij Spację, aby rozpocząć';
        hintDisplay.textContent = startHint;
    }

     // --- Wizualizacja tasowania ---
    function visualizeCurrentScramble() {
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.displayScrambledState === 'function') {
            if (currentScramble) {
                // --- Sprawdź wybraną prędkość ---
                let animateScramble = false;
                let selectedSpeed = 'instant';
                try {
                    selectedSpeed = document.querySelector('input[name="scramble-speed"]:checked').value;
                } catch (e) {
                    console.warn("Nie można odczytać wartości kontroli prędkości, domyślnie ustawiono natychmiastową.");
                }
                animateScramble = (selectedSpeed === 'animated');
                
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
                    nextHint = `Naciśnij Spację, aby rozpocząć ułożenie ${currentSolveIndex + 1}`;
                } else {
                    // Seria zakończona
                    nextHint = 'Seria zakończona! Wygeneruj nowy scramble lub zmień ustawienia.';
                    
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
            tile.innerHTML = `
                <div><strong>${index + 1}</strong></div>
                <div>${time.toFixed(2)}s</div>
            `;
            
            // Dodaj tooltip z scramble'em
            if (scrambles[index]) {
                tile.title = scrambles[index];
                tile.addEventListener('mouseenter', (e) => showScrambleTooltip(e, scrambles[index]));
                tile.addEventListener('mouseleave', hideScrambleTooltip);
            }
            
            grid.appendChild(tile);
        });

        seriesTimesDisplay.innerHTML = '';
        seriesTimesDisplay.appendChild(grid);
    }

    // --- Funkcje tooltip ---
    function showScrambleTooltip(e, scramble) {
        const tooltip = document.createElement('div');
        tooltip.className = 'scramble-tooltip';
        tooltip.textContent = scramble;
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = (e.pageY - 10) + 'px';
        document.body.appendChild(tooltip);
    }

    function hideScrambleTooltip() {
        const tooltip = document.querySelector('.scramble-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

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

    // --- Event listenery ---
    singleSolveBtn.addEventListener('click', () => setMode(false));
    seriesSolveBtn.addEventListener('click', () => setMode(true));
    
    seriesCountInput.addEventListener('change', () => {
        if (isSeriesMode) {
            totalSolvesInSeries = parseInt(seriesCountInput.value, 10) || 5;
            currentSolveIndex = 0;
            seriesTimes = [];
            scrambles = [];
            seriesTimesDisplay.classList.remove('series-complete');
            generateAndDisplayScramble();
        }
    });

    regenScrambleBtn.addEventListener('click', () => {
        if (isSeriesMode && currentSolveIndex >= totalSolvesInSeries) {
            // Seria zakończona, rozpocznij nową
            currentSolveIndex = 0;
            seriesTimes = [];
            scrambles = [];
            seriesTimesDisplay.classList.remove('series-complete');
        }
        generateAndDisplayScramble();
    });

    visualizeScrambleBtn.addEventListener('click', visualizeCurrentScramble);
    
    resetVisualizerBtn.addEventListener('click', () => {
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.resetVisualization === 'function') {
            scrambleVisualizerInstance.resetVisualization();
        }
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

    // --- Obsługa kontrolek prędkości ---
    speedControlRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const speedControlContainer = document.querySelector('.animation-speed-control');
            if (speedControlContainer) {
                speedControlContainer.style.display = radio.value === 'animated' ? 'flex' : 'none';
            }
        });
    });

    if (animationSpeedSlider && speedValueDisplay) {
        animationSpeedSlider.addEventListener('input', () => {
            speedValueDisplay.textContent = animationSpeedSlider.value + 'ms';
        });
    }

    // --- Obsługa zmian opcji scramble'a ---
    [includeBasicCheckbox, includeInnerCheckbox, includeWideCheckbox].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                // Sprawdź czy przynajmniej jedna opcja jest zaznaczona
                const anyChecked = includeBasicCheckbox.checked || includeInnerCheckbox.checked || includeWideCheckbox.checked;
                if (!anyChecked) {
                    // Jeśli żadna nie jest zaznaczona, zaznacz podstawowe ruchy
                    includeBasicCheckbox.checked = true;
                }
            });
        }
    });

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