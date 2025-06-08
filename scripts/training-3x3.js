document.addEventListener('DOMContentLoaded', () => {
    // Elementy UI
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
    if (typeof ScrambleVisualizer !== 'undefined' && typeof ScrambleVisualizer.init === 'function') {
        scrambleVisualizerInstance = ScrambleVisualizer.init(visualizerContainerId);
        if (!scrambleVisualizerInstance) {
            console.error("Nie udało się zainicjalizować instancji wizualizatora tasowania.");
            // Opcjonalnie wyświetl komunikat o błędzie użytkownikowi w kontenerze wizualizatora
            const container = document.getElementById(visualizerContainerId);
            if (container) container.innerHTML = "Błąd ładowania wizualizacji kostki.";
        }
    } else {
        console.error("Skrypt wizualizatora tasowania nie został poprawnie załadowany.");
        const container = document.getElementById(visualizerContainerId);
        if (container) container.innerHTML = "Błąd ładowania skryptu wizualizacji kostki.";
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
            // POPRAWKA: Sprawdź czy element istnieje przed manipulacją
            if (seriesTimesDisplay) {
                seriesTimesDisplay.innerHTML = ''; // Wyczyść wyświetlacz
            }
        }
        // Wyczyść również, jeśli wychodzisz z trybu serii
        if (!isSeriesMode && seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = '';
        }
        // --- Koniec czyszczenia ---

        // POPRAWKA: Używam właściwej wartości z custom input dla długości scramble'a
        const length = parseInt(scrabbleLengthInput?.value, 10) || 20;

        if (typeof generateScramble === 'function') {
            currentScramble = generateScramble(length);
            // Zapisz tasowanie do późniejszego użycia
            scrambles[currentSolveIndex] = currentScramble;

            // Dodaj postęp serii do tekstu tasowania, jeśli jesteś w trybie serii
            // const seriesPrefix = isSeriesMode ? `(${currentSolveIndex + 1}/${totalSolvesInSeries}) ` : '';
            if (scrambleDisplay) {
                scrambleDisplay.textContent = `${currentScramble}`;
            }
        } else {
            currentScramble = '';
            if (scrambleDisplay) {
                scrambleDisplay.textContent = 'Tasowanie: Błąd generowania tasowania.';
            }
            console.error("Funkcja generateScramble nie została znaleziona.");
        }

        // Zresetuj timer i podpowiedź
        resetTimer();
        const startHint = isSeriesMode ? `Start attempt ${currentSolveIndex + 1}` : 'Press SPACE to begin';
        if (hintDisplay) {
            hintDisplay.textContent = startHint;
        }
    }

    // --- Wizualizacja tasowania (Zmodyfikowana) ---
    function visualizeCurrentScramble() {
        if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.displayScrambledState === 'function') {
            if (currentScramble) {
                // --- Sprawdź wybraną prędkość ---
                let animateScramble = true;
                // let animateScramble = false;
                let selectedSpeed = 'animated';
                // let selectedSpeed = 'instant';
                // try {
                //     selectedSpeed = document.querySelector('input[name="scramble-speed"]:checked').value;
                // } catch (e) {
                //     console.warn("Nie można odczytać wartości kontroli prędkości, domyślnie ustawiono natychmiastową.");
                // }
                // animateScramble = (selectedSpeed === 'animated');

                // Pokaż/ukryj kontrolki prędkości animacji w zależności od wybranego trybu
                // const speedControlContainer = document.querySelector('.animation-speed-control');
                // if (speedControlContainer) {
                //     speedControlContainer.style.display = animateScramble ? 'flex' : 'none';
                // }

                // Ustaw prędkość animacji, jeśli mamy suwak i animujemy
                // if (animateScramble && animationSpeedSlider && scrambleVisualizerInstance.setAnimationSpeed) {
                //     const speedValue = parseInt(animationSpeedSlider.value, 10);
                //     scrambleVisualizerInstance.setAnimationSpeed(speedValue);
                // }
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
            console.error("Instancja wizualizatora tasowania lub funkcja displayScrambledState niedostępna.");
        }
    }

    // --- Logika timera (Zmodyfikowana funkcja stopTimer) ---
    function startTimer() {
        if (!timerRunning) {
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 10); // Aktualizuj co 10ms dla 2 miejsc po przecinku
            timerRunning = true;
            const stopHint = isSeriesMode ? `Stop the timer ${currentSolveIndex + 1}` : 'Press SPACE to stop';
            if (hintDisplay) {
                hintDisplay.textContent = stopHint;
            }
        }
    }

    function stopTimer() {
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
            timerDisplay.textContent = finalTime;

            let nextHint = 'Press SPACE to begin next attempt';

            // --- Obsługa logiki serii ---
            if (isSeriesMode) {
                seriesTimes[currentSolveIndex] = parseFloat(finalTime);

                // Aktualizuj wyświetlacz
                renderSeriesTimes();

                currentSolveIndex++;

                if (currentSolveIndex < totalSolvesInSeries) {
                    nextHint = `Press SPACE to begin attempt ${currentSolveIndex + 1}`;
                } else {
                    // Seria zakończona
                    nextHint = 'Series finished! Generate a new scramble or change the settings';

                    // Wyświetl statystyki
                    displaySeriesStatistics();
                }
            }
            // --- Koniec logiki serii ---

            if (hintDisplay) {
                hintDisplay.textContent = nextHint;
            }
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

        // POPRAWKA: Sprawdź czy element istnieje przed dodaniem
        if (seriesTimesDisplay) {
            seriesTimesDisplay.appendChild(statsElement);
        }
    }

    // --- Nowa funkcja do renderowania czasów serii jako siatki ---
    function renderSeriesTimes() {
        // POPRAWKA: Sprawdź czy element istnieje przed manipulacją
        if (!seriesTimesDisplay) {
            console.warn("Element seriesTimesDisplay nie istnieje");
            return;
        }
        
        seriesTimesDisplay.innerHTML = ''; // Wyczyść poprzedni render

        // Utwórz kontener siatki
        const gridContainer = document.createElement('div');
        gridContainer.classList.add('solve-grid');

        // POPRAWKA: Sprawdź czy seria została zakończona - sprawdź czy to jest ostatnie ułożenie
        const isSeriesComplete = isSeriesMode && (currentSolveIndex + 1) >= totalSolvesInSeries;

        // Dodaj kafelki dla każdego czasu
        seriesTimes.forEach((time, index) => {
            const tile = document.createElement('div');
            tile.classList.add('solve-tile');
            // Dodaj klasę specyficzną dla trybu
            tile.classList.add(isSeriesMode ? 'series' : 'single');
            tile.dataset.index = index;
            tile.textContent = time.toFixed(2);

            // Dodaj tasowanie jako podpowiedź
            tile.title = scrambles[index] || '';

            // ZMIENIONA LOGIKA: Po zakończeniu serii hover zmienia scramble-display, przed zakończeniem pokazuje tooltip
            if (isSeriesComplete) {
                // Po zakończeniu serii - zmiana zawartości scramble-display
                tile.addEventListener('mouseenter', () => {
                    const scrambleText = scrambles[index] || '';
                    if (scrambleDisplay) {
                        scrambleDisplay.textContent = scrambleText;
                    }
                });

                // Opcjonalnie: przywróć ostatni scramble po opuszczeniu kafelka
                tile.addEventListener('mouseleave', () => {
                    // Przywracamy scramble z ostatniego układania (bieżący scramble)
                    if (scrambleDisplay && currentScramble) {
                        scrambleDisplay.textContent = currentScramble;
                    }
                });
            } else {
                // Przed zakończeniem serii - stara logika z tooltip
                tile.addEventListener('mouseenter', () => {
                    const tooltipDiv = document.createElement('div');
                    tooltipDiv.classList.add('scramble-tooltip');
                    const scrambleText = scrambles[index] || '';
                    tooltipDiv.textContent = scrambleText;
                    
                    // Dodaj klasę dla długich scramble'i (powyżej 15 ruchów lub 60 znaków)
                    const moveCount = scrambleText.split(' ').filter(move => move.trim().length > 0).length;
                    if (moveCount > 15 || scrambleText.length > 60) {
                        tooltipDiv.classList.add('long-scramble');
                    }
                    
                    tile.appendChild(tooltipDiv);
                    
                    // Inteligentne pozycjonowanie tooltip'a
                    setTimeout(() => {
                        const rect = tooltipDiv.getBoundingClientRect();
                        const tileRect = tile.getBoundingClientRect();
                        const viewportWidth = window.innerWidth;
                        
                        // Sprawdź czy tooltip wychodzi poza prawą krawędź
                        if (rect.right > viewportWidth - 10) {
                            tooltipDiv.style.left = 'auto';
                            tooltipDiv.style.right = '0';
                            tooltipDiv.style.transform = 'translateX(0)';
                        }
                        // Sprawdź czy tooltip wychodzi poza lewą krawędź
                        else if (rect.left < 10) {
                            tooltipDiv.style.left = '0';
                            tooltipDiv.style.transform = 'translateX(0)';
                        }
                    }, 0);
                });

                tile.addEventListener('mouseleave', () => {
                    const tooltip = tile.querySelector('.scramble-tooltip');
                    if (tooltip) {
                        tile.removeChild(tooltip);
                    }
                });
            }

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

    // --- Event Listeners (Adjusted spacebar logic) ---
    // --- Nasłuchiwacze zdarzeń (Dostosowana logika spacji) ---
    document.body.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            if (!timerRunning && startTime === 0) {
                // POPRAWKA: Zabezpieczenie - nie pozwalaj uruchomić timera bez scramble'a
                if (!currentScramble || currentScramble.trim() === '') {
                    console.log("Cannot start timer without a scramble. Generate scramble first.");
                    if (hintDisplay) {
                        hintDisplay.textContent = 'Generate a scramble first before starting the timer';
                    }
                    return;
                }
                
                // Check if series is already complete before starting
                // Sprawdź, czy seria jest już zakończona przed rozpoczęciem
                if (isSeriesMode && currentSolveIndex >= totalSolvesInSeries) {
                    console.log("Series already complete. Generate new scramble or change mode.");
                    return; // Do nothing if series finished
                    // Nie rób nic, jeśli seria zakończona
                }
                startTimer();
            } else if (timerRunning) {
                stopTimer();
            } else if (!timerRunning && startTime !== 0) {
                // Generate next scramble only if the series is not finished OR not in series mode
                // Generuj następne tasowanie tylko jeśli seria nie jest zakończona LUB nie jesteśmy w trybie serii
                if (!isSeriesMode || currentSolveIndex < totalSolvesInSeries) {
                    generateAndDisplayScramble();
                    // POPRAWKA: W trybie serii automatycznie mieszaj kostkę po wygenerowaniu nowego scramble'a
                    if (isSeriesMode) {
                        visualizeCurrentScramble();
                    }
                } else {
                    console.log("Series complete. Press 'New Scramble' or change mode.");
                }
            }
        }
    });

    // Regenerate scramble when button clicked or length changes
    // Regeneruj tasowanie po kliknięciu przycisku lub zmianie długości
    regenScrambleBtn.addEventListener('click', () => {
        // Reset everything when generating a new scramble
        // Resetuj wszystko podczas generowania nowego tasowania
        currentSolveIndex = 0;
        seriesTimes = [];
        scrambles = [];
        // POPRAWKA: Sprawdź czy element istnieje
        if (seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = '';
        }
        generateAndDisplayScramble();
        // POPRAWKA: Dodaję wizualizację tylko po kliknięciu przycisku Scramble
        visualizeCurrentScramble();
    });

    // scrambleLengthInput.addEventListener('change', generateAndDisplayScramble);

    // Visualize scramble when button clicked
    // Wizualizuj tasowanie po kliknięciu przycisku
    // visualizeScrambleBtn.addEventListener('click', visualizeCurrentScramble);

    // Reset visualizer when button clicked
    // Resetuj wizualizator po kliknięciu przycisku
    // resetVisualizerBtn.addEventListener('click', () => {
    //     if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.resetVisualization === 'function') {
    //          try {
    //             scrambleVisualizerInstance.resetVisualization();
    //          } catch (error) {
    //             console.error("Error calling resetVisualization():", error);
    //          }
    //     } else {
    //         console.error("Scramble visualizer instance or resetVisualization function not available.");
    //     }
    // });

    // Mode selection listeners (Clear times display when changing mode)
    // Nasłuchiwacze wyboru trybu (Czyszczenie wyświetlacza czasów przy zmianie trybu)
    singleSolveBtn.addEventListener('click', () => {
        isSeriesMode = false;
        // POPRAWKA: Sprawdź czy element istnieje
        if (seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = ''; // Clear times
        }
        // Wyczyść czasy
        singleSolveBtn.classList.add('active');
        seriesSolveBtn.classList.remove('active');
        if (seriesCount) {
            seriesCount.classList.remove("active");
        }
        if (seriesCountInput) {
            seriesCountInput.disabled = true;
        }
        currentSolveIndex = 0;

        // Add class to body for mode-specific styling
        // Dodaj klasę do body dla stylizacji specyficznej dla trybu
        // document.body.classList.remove('series-mode-active');
        // document.body.classList.add('single-mode-active');

        // Gray out any series tiles if they exist
        // Wyszarz wszystkie kafelki serii, jeśli istnieją
        const seriesTiles = document.querySelectorAll('.solve-tile.series');
        seriesTiles.forEach(tile => {
            tile.classList.add('disabled');
        });

        // generateAndDisplayScramble();
    });

    seriesSolveBtn.addEventListener('click', () => {
        isSeriesMode = true;
        // POPRAWKA: Sprawdź czy element istnieje
        if (seriesTimesDisplay) {
            seriesTimesDisplay.innerHTML = ''; // Clear times
        }
        // Wyczyść czasy
        seriesSolveBtn.classList.add('active');
        if (seriesCount) {
            seriesCount.classList.add('active');
        }
        singleSolveBtn.classList.remove('active');
        if (seriesCountInput) {
            seriesCountInput.disabled = false;
        }
        currentSolveIndex = 0;
        // POPRAWKA: Używam textContent zamiast value dla custom select
        totalSolvesInSeries = Math.min(parseInt(selectedSeriesCountSpan?.textContent, 10) || 5, MAX_SERIES_LENGTH);

        // Add class to body for mode-specific styling
        // Dodaj klasę do body dla stylizacji specyficznej dla trybu
        // document.body.classList.remove('single-mode-active');
        // document.body.classList.add('series-mode-active');

        // Gray out any single tiles if they exist
        // Wyszarz wszystkie kafelki pojedynczego trybu, jeśli istnieją
        const singleTiles = document.querySelectorAll('.solve-tile.single');
        singleTiles.forEach(tile => {
            tile.classList.add('disabled');
        });

        // generateAndDisplayScramble();
    });

    // POPRAWKA: Obsługa zmian w custom select dla liczby ułożeń w serii
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

    // POPRAWKA: Dodaję obsługę zmian wartości w custom input dla długości scramble'a
    if (scrabbleLengthInput && scrambleLengthSpan) {
        scrabbleLengthInput.addEventListener('input', () => {
            // Aktualizuj wyświetlaną wartość w przycisku
            scrambleLengthSpan.textContent = scrabbleLengthInput.value;
        });
    }

    // POPRAWKA: Obsługa przycisków plus/minus dla długości scramble'a
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

    // Add listener for speed controls (Optional - could trigger re-visualization)
    // Dodaj nasłuchiwacz dla kontrolek prędkości (Opcjonalnie - może wyzwolić ponowną wizualizację)
    // speedControlRadios.forEach(radio => {
    //     radio.addEventListener('change', () => {
    //         console.log("Scramble speed changed to:", radio.value);
    //         // Automatically re-visualize with the new speed
    //         // Automatycznie wizualizuj ponownie z nową prędkością
    //         visualizeCurrentScramble();
    //     });
    // });

    // Animation speed slider handler
    // Obsługa suwaka prędkości animacji
    // if (animationSpeedSlider) {
    //     // Initial display update
    //     // Początkowa aktualizacja wyświetlacza
    //     speedValueDisplay.textContent = `${animationSpeedSlider.value}ms`;
    //
    //     // Update when slider changes
    //     // Aktualizacja po zmianie suwaka
    //     animationSpeedSlider.addEventListener('input', () => {
    //         const speedValue = animationSpeedSlider.value;
    //         speedValueDisplay.textContent = `${speedValue}ms`;
    //
    //         // Update animation speed in visualizer
    //         // Aktualizuj prędkość animacji w wizualizatorze
    //         if (scrambleVisualizerInstance && typeof scrambleVisualizerInstance.setAnimationSpeed === 'function') {
    //             scrambleVisualizerInstance.setAnimationSpeed(parseInt(speedValue, 10));
    //         }
    //     });
    // }
// --- Initial Load ---
// --- Początkowe załadowanie ---
// Visualizer is initialized at the start
// Wizualizator jest inicjalizowany na początku
    // POPRAWKA: Usuwam automatyczne generowanie scramble'a przy ładowaniu strony
    // generateAndDisplayScramble(); // Generate the first scramble text
// Generuj pierwszy tekst tasowania
    // POPRAWKA: Usuwam automatyczną wizualizację przy załadowaniu strony
    // visualizeCurrentScramble()
// Do not visualize automatically on load, user clicks the button
// Nie wizualizuj automatycznie przy ładowaniu, użytkownik klika przycisk

    // Ustaw początkowy stan interfejsu
    if (scrambleDisplay) {
        scrambleDisplay.textContent = 'Naciśnij "Scramble" aby wygenerować tasowanie';
    }
    if (hintDisplay) {
        hintDisplay.textContent = 'Generate a scramble first';
    }

    // Obsluga customowych select list

    // --- Series count custom select
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
            // POPRAWKA: Używam textContent zamiast value dla custom select
            totalSolvesInSeries = Math.min(parseInt(selectedSeriesCountSpan?.textContent, 10) || 5, MAX_SERIES_LENGTH);
        });
    }

    // Close series count dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (seriesCount && !seriesCount.contains(e.target) && seriesCountOptionsList) {
            // seriesCount.classList.remove('active');
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

});