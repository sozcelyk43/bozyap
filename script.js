document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTLERİNİ SEÇME ===
    const selectionScreen = document.getElementById('selectionScreen');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const gameBoard = document.getElementById('gameBoard');
    const pieceOptionsContainer = document.querySelector('.piece-options');
    const categoryOptionsContainer = document.querySelector('.category-options');
    const startGameButton = document.getElementById('startGameButton');
    const timerDisplay = document.getElementById('timer');
    const hintButton = document.getElementById('hintButton');
    const winScreen = document.getElementById('winScreen');
    const finalTimeDisplay = document.getElementById('finalTime');
    const playAgainButton = document.getElementById('playAgainButton');
    const mainMenuButton = document.getElementById('mainMenuButton');
    const mainMenuFromGameButton = document.getElementById('mainMenuFromGame');
    const gameControls = document.querySelector('.game-controls');
    const gameTitle = document.getElementById('gameTitle');
    const footer = document.querySelector('footer');

    // YENİ EKLENEN ELEMENTLER
    const previewButton = document.getElementById('previewButton');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const continuePrompt = document.getElementById('continuePrompt');
    const continueYesButton = document.getElementById('continueYes');
    const continueNoButton = document.getElementById('continueNo');
    const leaderboardButton = document.getElementById('leaderboardButton');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const leaderboardContent = document.getElementById('leaderboardContent');
    const closeLeaderboardButton = document.getElementById('closeLeaderboard');
    const clearScoresButton = document.getElementById('clearScores');

    // === OYUN DEĞİŞKENLERİ ===
    const gameState = {
        difficulty: null,
        category: null,
        image: null,
        startTime: 0,
        timerInterval: null,
        hintUsed: false,
        isGameActive: false
    };

    let puzzlePieces = [];
    let confettiInstance = null;

    const difficulties = [
        { name: 'Çok Kolay', pieces: '3x2', cols: 3, rows: 2 },
        { name: 'Kolay', pieces: '4x3', cols: 4, rows: 3 },
        { name: 'Orta', pieces: '5x4', cols: 5, rows: 4 },
        { name: 'Zor', pieces: '6x4', cols: 6, rows: 4 },
        { name: 'Çok Zor', pieces: '7x5', cols: 7, rows: 5 }
    ];

    // === SES FONKSİYONLARI ===
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {};
    function loadSound(name, url) { fetch(url).then(response => response.arrayBuffer()).then(buffer => audioContext.decodeAudioData(buffer)).then(decodedData => { sounds[name] = decodedData; }).catch(e => console.error(`Ses dosyası yüklenemedi: ${name}`, e)); }
    function playSound(name) { if (sounds[name]) { const source = audioContext.createBufferSource(); source.buffer = sounds[name]; source.connect(audioContext.destination); source.start(0); } }
    loadSound('pieceMove', 'sounds/button-1.mp3');
    loadSound('piecePlace', 'sounds/button-2.mp3');
    loadSound('win', 'sounds/success-1.mp3');
    loadSound('hint', 'sounds/button-3.mp3');

    // === ARAYÜZ OLUŞTURMA ===
    function createDifficultyButtons() {
        pieceOptionsContainer.innerHTML = '';
        const createGridIcon = (level) => {
            const icon = document.createElement('div');
            icon.classList.add('difficulty-icon');
            icon.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;
            icon.style.width = `${level.cols * 4}px`;
            icon.style.height = `${level.rows * 4}px`;
            for (let i = 0; i < level.cols * level.rows; i++) {
                icon.appendChild(document.createElement('div')).classList.add('grid-cell');
            }
            return icon;
        };
        difficulties.forEach(level => {
            const button = document.createElement('button');
            button.classList.add('level-button');
            button.appendChild(createGridIcon(level));
            button.appendChild(document.createTextNode(level.name));
            button.addEventListener('click', () => {
                gameState.difficulty = level;
                document.querySelectorAll('.level-button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                updateStartButtonState();
                playSound('piecePlace');
            });
            pieceOptionsContainer.appendChild(button);
        });
    }

    function createCategoryCards() {
        categoryOptionsContainer.innerHTML = '';
        for (const categoryName in imageCategories) {
            const card = document.createElement('button');
            card.classList.add('category-card');
            const img = document.createElement('img');
            img.src = imageCategories[categoryName].kapakResmi;
            img.alt = categoryName;
            img.loading = 'lazy';
            card.appendChild(img);
            card.appendChild(document.createElement('span')).textContent = categoryName;
            if (!imageCategories[categoryName].resimListesi || imageCategories[categoryName].resimListesi.length === 0) {
                card.disabled = true;
            }
            card.addEventListener('click', () => {
                if (card.disabled) return;
                gameState.category = categoryName;
                document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                updateStartButtonState();
                playSound('piecePlace');
            });
            categoryOptionsContainer.appendChild(card);
        }
    }
    
    // === OYUN YÖNETİMİ ===
    async function startGame(fromSave = false) {
        if (!fromSave && (!gameState.difficulty || !gameState.category)) {
             alert('Lütfen zorluk seviyesi ve resim kategorisi seçin!');
             return;
        }

        selectionScreen.style.display = 'none';
        gameTitle.style.display = 'none';
        loadingOverlay.style.display = 'flex';

        if (!fromSave) {
            const imageList = imageCategories[gameState.category].resimListesi;
            gameState.image = imageList[Math.floor(Math.random() * imageList.length)];
            gameState.startTime = Date.now();
            gameState.hintUsed = false;
        }
        
        await createPuzzle(gameState.image, gameState.difficulty.cols, gameState.difficulty.rows, fromSave);
        
        previewImage.src = gameState.image;
        loadingOverlay.style.display = 'none';
        gameBoard.style.display = 'grid';
        gameControls.style.display = 'flex';
        footer.style.display = 'none';
        gameState.isGameActive = true;
        startTimer();
        if(!fromSave) playSound('piecePlace');
    }

    function restartPuzzle() {
        winScreen.style.display = 'none';
        if (confettiInstance) { confettiInstance.clear(); document.getElementById('confetti-canvas')?.remove(); confettiInstance = null; }
        
        gameState.startTime = Date.now();
        gameState.hintUsed = false;
        hintButton.disabled = false;
        timerDisplay.textContent = '00:00';

        gameBoard.innerHTML = '';
        gameBoard.style.gap = '2px';
        gameBoard.style.borderColor = 'var(--border-color)';
        gameBoard.classList.remove('solved-effect');
        
        startGame(true); // Re-use the same image and difficulty
        playSound('piecePlace');
    }

    function resetGame() {
        stopTimer();
        if (confettiInstance) { confettiInstance.clear(); document.getElementById('confetti-canvas')?.remove(); confettiInstance = null; }
        
        selectionScreen.style.display = 'block';
        gameTitle.style.display = 'block';
        gameBoard.style.display = 'none';
        winScreen.style.display = 'none';
        gameControls.style.display = 'none';
        previewContainer.style.display = 'none';
        footer.style.display = 'block';

        timerDisplay.textContent = '00:00';
        hintButton.disabled = false;
        gameBoard.innerHTML = '';
        gameBoard.style.gap = '2px';
        gameBoard.style.borderColor = 'var(--border-color)';
        gameBoard.classList.remove('solved-effect');

        Object.assign(gameState, {
            difficulty: null, category: null, image: null, startTime: 0,
            timerInterval: null, hintUsed: false, isGameActive: false
        });

        puzzlePieces = [];
        document.querySelectorAll('.level-button, .category-card').forEach(btn => btn.classList.remove('selected'));
        updateStartButtonState();
        clearSavedGame(); // Clear save on returning to menu
    }

    function updateStartButtonState() {
        startGameButton.disabled = !(gameState.difficulty && gameState.category);
    }

    // === ZAMANLAYICI ===
    function startTimer() { if (gameState.timerInterval) clearInterval(gameState.timerInterval); gameState.timerInterval = setInterval(updateTimer, 1000); updateTimer(); }
    function stopTimer() { clearInterval(gameState.timerInterval); }
    function updateTimer() {
        const elapsedTime = Date.now() - gameState.startTime;
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // === PUZZLE OLUŞTURMA & MEKANİKLER ===
    async function createPuzzle(imageUrl, cols, rows, fromSave = false) {
        gameBoard.innerHTML = '';
        puzzlePieces = [];
        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = "Anonymous";
        await new Promise(resolve => img.onload = resolve);
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        const pieceWidth = img.width / cols;
        const pieceHeight = img.height / rows;

        for (let i = 0; i < cols * rows; i++) {
            const pieceDiv = document.createElement('div');
            pieceDiv.classList.add('puzzle-piece');
            pieceDiv.setAttribute('draggable', 'true');
            pieceDiv.dataset.originalIndex = i;
            const canvas = document.createElement('canvas');
            canvas.width = pieceWidth;
            canvas.height = pieceHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, (i % cols) * pieceWidth, Math.floor(i / cols) * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);
            const pieceImage = document.createElement('img');
            pieceImage.src = canvas.toDataURL();
            pieceImage.alt = `Puzzle Piece ${i}`;
            pieceDiv.appendChild(pieceImage);
            puzzlePieces.push(pieceDiv);
        }

        const savedState = fromSave ? getSavedGame() : null;
        if (savedState && savedState.pieceOrder) {
            const orderedPieces = savedState.pieceOrder.map(index => puzzlePieces.find(p => p.dataset.originalIndex == index));
            orderedPieces.forEach(piece => gameBoard.appendChild(piece));
        } else {
            shuffleArray(puzzlePieces);
            puzzlePieces.forEach(piece => gameBoard.appendChild(piece));
        }
        
        addDragDropListeners();
        addTouchListeners();
        updatePieceState();
        if(!fromSave) saveGameState();
    }
    
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }
    
    function swapPieces(piece1, piece2) {
        playSound('piecePlace');
        
        piece1.classList.add('swapping');
        piece2.classList.add('swapping');

        requestAnimationFrame(() => {
            const parent = gameBoard;
            const temp = document.createElement('div');
            parent.insertBefore(temp, piece1);
            parent.insertBefore(piece1, piece2);
            parent.insertBefore(piece2, temp);
            temp.remove();

            setTimeout(() => {
                piece1.classList.remove('swapping');
                piece2.classList.remove('swapping');
                updatePieceState();
                checkWinCondition();
                saveGameState(); // Save state after every move
            }, 150);
        });
    }

    function updatePieceState() {
        const currentPieces = Array.from(gameBoard.querySelectorAll('.puzzle-piece'));
        currentPieces.forEach((piece, index) => {
            if (parseInt(piece.dataset.originalIndex) === index) {
                piece.classList.add('locked');
                piece.setAttribute('draggable', 'false');
            } else {
                piece.classList.remove('locked');
                piece.setAttribute('draggable', 'true');
            }
        });
    }
    
    async function checkWinCondition() {
        if (!gameState.isGameActive) return;
        const isSolved = Array.from(gameBoard.querySelectorAll('.puzzle-piece'))
                              .every((p, i) => parseInt(p.dataset.originalIndex) === i);
        if (isSolved) {
            gameState.isGameActive = false;
            stopTimer();
            playSound('win');
            
            saveScore();
            clearSavedGame();

            const confettiCanvas = document.createElement('canvas');
            confettiCanvas.id = 'confetti-canvas';
            Object.assign(confettiCanvas.style, { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' });
            document.body.appendChild(confettiCanvas);
            confettiInstance = new ConfettiGenerator({ target: 'confetti-canvas', max: 100, size: 1.2, clock: 30 });
            confettiInstance.render();

            gameBoard.style.gap = '0px';
            gameBoard.style.borderColor = 'transparent';
            
            setTimeout(() => {
                const finalTime = timerDisplay.textContent;
                finalTimeDisplay.textContent = `Süreniz: ${finalTime}`;
                gameBoard.style.display = 'none';
                gameControls.style.display = 'none';
                previewContainer.style.display = 'none';
                if (confettiInstance) { confettiInstance.clear(); confettiCanvas.remove(); confettiInstance = null; }
                winScreen.style.display = 'block';
            }, 4000);
        }
    }

    // === YENİ ÖZELLİKLER: KAYDETME, SKOR, ÖNİZLEME ===
    function saveGameState() {
        if (!gameState.isGameActive) return;
        const pieceOrder = Array.from(gameBoard.querySelectorAll('.puzzle-piece')).map(p => p.dataset.originalIndex);
        const stateToSave = { ...gameState, pieceOrder };
        localStorage.setItem('puzzleSaveState', JSON.stringify(stateToSave));
    }

    function getSavedGame() {
        const savedData = localStorage.getItem('puzzleSaveState');
        return savedData ? JSON.parse(savedData) : null;
    }

    function loadGameFromSave() {
        const savedState = getSavedGame();
        if (savedState) {
            Object.assign(gameState, savedState);
            startGame(true);
        }
    }

    function clearSavedGame() {
        localStorage.removeItem('puzzleSaveState');
    }

    function saveScore() {
        const scores = JSON.parse(localStorage.getItem('puzzleScores') || '[]');
        const newScore = {
            difficulty: gameState.difficulty.name,
            time: timerDisplay.textContent,
            timestamp: Date.now()
        };
        scores.push(newScore);
        scores.sort((a, b) => a.time.localeCompare(b.time)); // Sort lexicographically
        localStorage.setItem('puzzleScores', JSON.stringify(scores.slice(0, 10))); // Keep top 10
    }

    function displayLeaderboard() {
        leaderboardContent.innerHTML = '';
        const scores = JSON.parse(localStorage.getItem('puzzleScores') || '[]');
        if (scores.length === 0) {
            leaderboardContent.innerHTML = '<p class="no-scores">Henüz kaydedilmiş skor yok.</p>';
        } else {
            scores.forEach((score, index) => {
                const scoreEl = document.createElement('div');
                scoreEl.innerHTML = `
                    <span class="score-rank">${index + 1}.</span>
                    <span class="score-difficulty">${score.difficulty}</span>
                    <span class="score-time">${score.time}</span>`;
                leaderboardContent.appendChild(scoreEl);
            });
        }
        leaderboardScreen.style.display = 'flex';
    }

    async function showHint() {
        if(gameState.hintUsed) { alert('İpucu hakkınızı zaten kullandınız!'); return; }
        
        const hintOverlay = document.createElement('div');
        Object.assign(hintOverlay.style, { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0, transition: 'opacity 0.5s ease' });
        const hintImg = document.createElement('img');
        hintImg.src = gameState.image;
        Object.assign(hintImg.style, { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '10px' });
        hintOverlay.appendChild(hintImg);
        document.body.appendChild(hintOverlay);

        setTimeout(() => hintOverlay.style.opacity = 1, 50);
        setTimeout(() => {
            hintOverlay.style.opacity = 0;
            hintOverlay.addEventListener('transitionend', () => hintOverlay.remove(), { once: true });
        }, 3000);
        
        gameState.hintUsed = true;
        hintButton.disabled = true;
        playSound('hint');
        saveGameState(); // Save hint usage state
    }

    function togglePreview() {
        previewContainer.style.display = previewContainer.style.display === 'none' ? 'block' : 'none';
    }
    
    // === KLAVYE İLE GEZİNME ===
    function enableKeyboardNavigation(containerSelector) {
        const container = document.querySelector(containerSelector);
        container.addEventListener('keydown', e => {
            if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) return;
            e.preventDefault();
            
            const options = Array.from(container.querySelectorAll('button:not(:disabled)'));
            const focusedIndex = options.indexOf(document.activeElement);

            let nextIndex = -1;
            if(e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextIndex = focusedIndex < options.length - 1 ? focusedIndex + 1 : 0;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                nextIndex = focusedIndex > 0 ? focusedIndex - 1 : options.length - 1;
            } else if (e.key === 'Enter' || e.key === ' ') {
                document.activeElement?.click();
            }

            if(nextIndex !== -1) options[nextIndex].focus();
        });
    }

    // === OLAY DİNLEYİCİLERİ ===
    startGameButton.addEventListener('click', () => startGame(false));
    playAgainButton.addEventListener('click', () => { restartPuzzle(); playSound('piecePlace'); });
    mainMenuButton.addEventListener('click', () => { resetGame(); playSound('piecePlace'); });
    mainMenuFromGameButton.addEventListener('click', () => { resetGame(); playSound('piecePlace'); });
    hintButton.addEventListener('click', showHint);
    previewButton.addEventListener('click', togglePreview);
    leaderboardButton.addEventListener('click', displayLeaderboard);
    closeLeaderboardButton.addEventListener('click', () => leaderboardScreen.style.display = 'none');
    clearScoresButton.addEventListener('click', () => {
        if(confirm('Tüm skorları silmek istediğinize emin misiniz?')){
            localStorage.removeItem('puzzleScores');
            displayLeaderboard();
        }
    });
    continueYesButton.addEventListener('click', () => {
        continuePrompt.style.display = 'none';
        loadGameFromSave();
    });
    continueNoButton.addEventListener('click', () => {
        continuePrompt.style.display = 'none';
        clearSavedGame();
    });

    // --- Drag/Drop ve Touch event listener'ları (Değişiklik yok) ---
    // (Bu fonksiyonlar uzun olduğu için kod tekrarını önlemek adına buraya kopyalanmadı,
    // projenizdeki orijinal script.js dosyasındaki halleriyle aynı kalacaklar.)
    let draggedItem = null;
    function addDragDropListeners() { const pieces = gameBoard.querySelectorAll('.puzzle-piece'); pieces.forEach(piece => { piece.addEventListener('dragstart', dragStart); piece.addEventListener('dragenter', dragEnter); piece.addEventListener('dragleave', dragLeave); piece.addEventListener('dragover', dragOver); piece.addEventListener('drop', dragDrop); piece.addEventListener('dragend', dragEnd); }); }
    function dragStart(e) { if (this.classList.contains('locked')) { e.preventDefault(); return; } draggedItem = this; setTimeout(() => this.style.opacity = '0.5', 0); playSound('pieceMove'); }
    function dragEnter(e) { e.preventDefault(); if (this.classList.contains('locked')) { return; } this.classList.add('drag-over'); }
    function dragDrop() { this.classList.remove('drag-over'); if (this.classList.contains('locked')) { return; } if (draggedItem && draggedItem !== this) { swapPieces(draggedItem, this); } }
    function dragEnd() { this.style.opacity = '1'; document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('drag-over')); }
    function dragOver(e) { e.preventDefault(); }
    function dragLeave() { this.classList.remove('drag-over'); }
    let currentTouchPiece = null; let touchPieceClone = null; let cloneOffsetX = 0; let cloneOffsetY = 0;
    function addTouchListeners() { const pieces = gameBoard.querySelectorAll('.puzzle-piece'); pieces.forEach(piece => { piece.addEventListener('touchstart', touchStart, { passive: false }); piece.addEventListener('touchmove', touchMove, { passive: false }); piece.addEventListener('touchend', touchEnd, { passive: false }); piece.addEventListener('touchcancel', touchEnd, { passive: false }); }); }
    function touchStart(e) { if (this.classList.contains('locked')) return; if (e.touches.length !== 1) return; e.preventDefault(); currentTouchPiece = this; currentTouchPiece.style.opacity = '0.4'; currentTouchPiece.style.pointerEvents = 'none'; touchPieceClone = currentTouchPiece.cloneNode(true); Object.assign(touchPieceClone.style, { position: 'fixed', zIndex: '1001', opacity: '1', pointerEvents: 'none', width: currentTouchPiece.offsetWidth + 'px', height: currentTouchPiece.offsetHeight + 'px', borderRadius: getComputedStyle(currentTouchPiece).borderRadius, boxShadow: getComputedStyle(currentTouchPiece).boxShadow, border: getComputedStyle(currentTouchPiece).border, backgroundColor: getComputedStyle(currentTouchPiece).backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.05)' }); const imgInClone = touchPieceClone.querySelector('img'); if (imgInClone) { Object.assign(imgInClone.style, { width: '100%', height: '100%', objectFit: 'fill' }); } document.body.appendChild(touchPieceClone); const touch = e.touches[0]; const rect = currentTouchPiece.getBoundingClientRect(); cloneOffsetX = touch.clientX - rect.left; cloneOffsetY = touch.clientY - rect.top; touchPieceClone.style.left = `${touch.clientX - cloneOffsetX}px`; touchPieceClone.style.top = `${touch.clientY - cloneOffsetY}px`; playSound('pieceMove'); }
    function touchMove(e) { if (!touchPieceClone || !currentTouchPiece || e.touches.length !== 1) return; e.preventDefault(); const touch = e.touches[0]; touchPieceClone.style.left = `${touch.clientX - cloneOffsetX}px`; touchPieceClone.style.top = `${touch.clientY - cloneOffsetY}px`; const targetPiece = findTargetPiece(touch.clientX, touch.clientY); document.querySelectorAll('.puzzle-piece').forEach(piece => piece.classList.remove('drag-over')); if (targetPiece && targetPiece !== currentTouchPiece && !targetPiece.classList.contains('locked')) { targetPiece.classList.add('drag-over'); } }
    function touchEnd(e) { if (!currentTouchPiece || !touchPieceClone) return; e.preventDefault(); touchPieceClone.remove(); touchPieceClone = null; currentTouchPiece.style.opacity = '1'; currentTouchPiece.style.pointerEvents = 'auto'; document.querySelectorAll('.puzzle-piece').forEach(piece => piece.classList.remove('drag-over')); const touch = e.changedTouches[0]; const targetPiece = findTargetPiece(touch.clientX, touch.clientY); if (targetPiece && targetPiece !== currentTouchPiece && !targetPiece.classList.contains('locked')) { swapPieces(targetPiece, currentTouchPiece); } currentTouchPiece = null; }
    function findTargetPiece(clientX, clientY) { let targetPiece = null; gameBoard.querySelectorAll('.puzzle-piece').forEach(piece => { const rect = piece.getBoundingClientRect(); if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && piece !== currentTouchPiece) { targetPiece = piece; } }); return targetPiece; }
    
    // === UYGULAMAYI BAŞLATMA ===
    function initialize() {
        footer.style.display = 'block';
        createDifficultyButtons();
        createCategoryCards();
        updateStartButtonState();
        enableKeyboardNavigation('.piece-options');
        enableKeyboardNavigation('.category-options');
        
        const savedState = getSavedGame();
        if (savedState && savedState.isGameActive) {
            continuePrompt.style.display = 'flex';
        }
    }

    initialize();
});