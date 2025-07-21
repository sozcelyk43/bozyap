document.addEventListener('DOMContentLoaded', () => {
    const selectionScreen = document.getElementById('selectionScreen');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const gameBoard = document.getElementById('gameBoard');
    const pieceOptionsContainer = document.querySelector('.piece-options');
    const categoryOptionsContainer = document.querySelector('.category-options');
    const startGameButton = document.getElementById('startGameButton');
    const quickStartButton = document.getElementById('quickStartButton');
    const leaderboardButton = document.getElementById('leaderboardButton');
    const timerDisplay = document.getElementById('timer');
    const hintButton = document.getElementById('hintButton');
    const winScreen = document.getElementById('winScreen');
    const finalTimeDisplay = document.getElementById('finalTime');
    const playAgainButton = document.getElementById('playAgainButton');
    const mainMenuButton = document.getElementById('mainMenuButton');
    const mainMenuFromGameButton = document.getElementById('mainMenuFromGame');
    const gameControls = document.getElementById('gameControls');
    const gameTitle = document.getElementById('gameTitle');
    const footer = document.querySelector('footer');
    const continuePrompt = document.getElementById('continuePrompt');
    const continueYesButton = document.getElementById('continueYes');
    const continueNoButton = document.getElementById('continueNo');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const leaderboardContent = document.getElementById('leaderboardContent');
    const closeLeaderboardButton = document.getElementById('closeLeaderboard');
    const clearScoresButton = document.getElementById('clearScores');
    const confirmClearScores = document.getElementById('confirmClearScores');
    const confirmClearYes = document.getElementById('confirmClearYes');
    const confirmClearNo = document.getElementById('confirmClearNo');
    const customAlert = document.getElementById('customAlert');
    const customAlertTitle = document.getElementById('customAlertTitle');
    const customAlertMessage = document.getElementById('customAlertMessage');
    const customAlertOk = document.getElementById('customAlertOk');
    const exitGameConfirm = document.getElementById('exitGameConfirm');
    const exitGameYes = document.getElementById('exitGameYes');
    const exitGameNo = document.getElementById('exitGameNo');
    const quitAppConfirm = document.getElementById('quitAppConfirm');
    const quitAppYes = document.getElementById('quitAppYes');
    const quitAppNo = document.getElementById('quitAppNo');

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

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {};
    function loadSound(name, url) { fetch(url).then(response => response.arrayBuffer()).then(buffer => audioContext.decodeAudioData(buffer)).then(decodedData => { sounds[name] = decodedData; }).catch(e => console.error(`Ses dosyası yüklenemedi: ${name}`, e)); }
    function playSound(name) { if (sounds[name]) { const source = audioContext.createBufferSource(); source.buffer = sounds[name]; source.connect(audioContext.destination); source.start(0); } }
    loadSound('pieceMove', 'sounds/button-1.mp3');
    loadSound('piecePlace', 'sounds/button-2.mp3');
    loadSound('win', 'sounds/success-1.mp3');
    loadSound('hint', 'sounds/button-3.mp3');

    function showAlert(message, title = 'Uyarı') {
        customAlertTitle.textContent = title;
        customAlertMessage.textContent = message;
        customAlert.style.display = 'flex';
    }

    function createDifficultyButtons() {
        pieceOptionsContainer.innerHTML = '';
        difficulties.forEach((level, index) => {
            const button = document.createElement('button');
            button.classList.add('level-button');

            // Renkler için class ekleme
            if (index < 2) { // Çok Kolay, Kolay
                button.classList.add('easy');
            } else if (index < 3) { // Orta
                button.classList.add('medium');
            } else { // Zor, Çok Zor
                button.classList.add('hard');
            }

            button.textContent = level.name;
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

    async function startGame(fromSave = false) {
        if (!fromSave && (!gameState.difficulty || !gameState.category)) {
             showAlert('Lütfen zorluk seviyesi ve resim kategorisi seçin!');
             return;
        }
        selectionScreen.style.display = 'none';
        gameTitle.style.display = 'none';
        footer.style.display = 'none';
        loadingOverlay.style.display = 'flex';

        if (!fromSave) {
            const imageList = imageCategories[gameState.category].resimListesi;
            gameState.image = imageList[Math.floor(Math.random() * imageList.length)];
            gameState.startTime = Date.now();
            gameState.hintUsed = false;
        }

        await createPuzzle(gameState.image, gameState.difficulty.cols, gameState.difficulty.rows, fromSave);

        loadingOverlay.style.display = 'none';
        gameBoard.style.display = 'grid';
        gameControls.style.display = 'grid';

        gameState.isGameActive = true;
        startTimer();
        if(!fromSave) playSound('piecePlace');
    }

    function quickStartGame() {
        const quickDifficulties = difficulties.filter(d => ['Kolay', 'Orta', 'Zor'].includes(d.name));
        gameState.difficulty = quickDifficulties[Math.floor(Math.random() * quickDifficulties.length)];
        const availableCategories = Object.keys(imageCategories).filter(key => imageCategories[key].resimListesi && imageCategories[key].resimListesi.length > 0);
        gameState.category = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        startGame(false);
    }

    function resetGame() {
        stopTimer();
        if (confettiInstance) { confettiInstance.clear(); document.getElementById('confetti-canvas')?.remove(); confettiInstance = null; }

        selectionScreen.style.display = 'flex';
        gameTitle.style.display = 'block';
        gameBoard.style.display = 'none';
        winScreen.style.display = 'none';
        gameControls.style.display = 'none';

        timerDisplay.textContent = '00:00';
        if(hintButton) hintButton.disabled = false;
        gameBoard.innerHTML = '';

        Object.assign(gameState, {
            difficulty: null, category: null, image: null, startTime: 0,
            timerInterval: null, hintUsed: false, isGameActive: false
        });

        puzzlePieces = [];
        document.querySelectorAll('.level-button, .category-card').forEach(btn => btn.classList.remove('selected'));
        updateStartButtonState();
        clearSavedGame();
    }

    function updateStartButtonState() {
        startGameButton.disabled = !(gameState.difficulty && gameState.category);
    }

    function startTimer() { if (gameState.timerInterval) clearInterval(gameState.timerInterval); gameState.timerInterval = setInterval(updateTimer, 1000); updateTimer(); }
    function stopTimer() { clearInterval(gameState.timerInterval); }
    function updateTimer() {
        const elapsedTime = Date.now() - gameState.startTime;
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    async function createPuzzle(imageUrl, cols, rows, fromSave = false) {
        gameBoard.innerHTML = '';
        puzzlePieces = [];
        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = "Anonymous";

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
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
            pieceDiv.appendChild(canvas);
            puzzlePieces.push(pieceDiv);
        }

        const savedState = fromSave ? getSavedGame() : null;
        if (savedState && savedState.pieceOrder) {
            const orderedPieces = savedState.pieceOrder.map(index => puzzlePieces.find(p => p.dataset.originalIndex == index));
            orderedPieces.forEach(piece => gameBoard.appendChild(piece));
        } else {
            shuffleArray(puzzlePieces);

            // --- YENİ EKLENEN KISIM ---
            // Bu döngü, hiçbir parçanın doğru yerde başlamamasını garantiler.
            puzzlePieces.forEach((piece, index) => {
                if (parseInt(piece.dataset.originalIndex) === index) {
                    // Eğer parça doğru yerdeyse, bir sonrakiyle değiştir (sondaysa bir öncekiyle)
                    const swapIndex = (index === puzzlePieces.length - 1) ? index - 1 : index + 1;
                    [puzzlePieces[index], puzzlePieces[swapIndex]] = [puzzlePieces[swapIndex], puzzlePieces[index]];
                }
            });
            // --- YENİ KISIM SONU ---

            puzzlePieces.forEach(piece => gameBoard.appendChild(piece));
        }

        addDragDropListeners();
        addTouchListeners();
        updatePieceState();
        if (!fromSave) saveGameState();
    }

    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }

    function swapPieces(piece1, piece2) {
        playSound('pieceMove');
        const parent = gameBoard;
        const temp = document.createElement('div');
        parent.insertBefore(temp, piece1);
        parent.insertBefore(piece1, piece2);
        parent.insertBefore(piece2, temp);
        temp.remove();
        updatePieceState();
        checkWinCondition();
        saveGameState();
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
            confettiInstance = new ConfettiGenerator({ target: 'confetti-canvas' });
            confettiInstance.render();
            gameBoard.style.gap = '0px';
            gameBoard.style.borderColor = 'transparent';
            setTimeout(() => {
                const finalTime = timerDisplay.textContent;
                finalTimeDisplay.textContent = `Süreniz: ${finalTime}`;
                winScreen.style.display = 'flex';
                gameBoard.style.display = 'none';
                gameControls.style.display = 'none';
                if (confettiInstance) { confettiInstance.clear(); confettiCanvas.remove(); confettiInstance = null; }
            }, 4000);
        }
    }

    function saveGameState() {
        if (!gameState.isGameActive) return;
        const pieceOrder = Array.from(gameBoard.querySelectorAll('.puzzle-piece')).map(p => p.dataset.originalIndex);
        const stateToSave = { ...gameState, pieceOrder };
        localStorage.setItem('puzzleSaveState', JSON.stringify(stateToSave));
    }
    function getSavedGame() { const savedData = localStorage.getItem('puzzleSaveState'); return savedData ? JSON.parse(savedData) : null; }
    function loadGameFromSave() { const savedState = getSavedGame(); if (savedState) { Object.assign(gameState, savedState); startGame(true); } }
    function clearSavedGame() { localStorage.removeItem('puzzleSaveState'); }

    function saveScore() {
        const scores = JSON.parse(localStorage.getItem('puzzleScores') || '[]');
        const newScore = { difficulty: gameState.difficulty.name, time: timerDisplay.textContent, timestamp: Date.now() };
        scores.push(newScore);
        scores.sort((a, b) => a.time.localeCompare(b.time));
        localStorage.setItem('puzzleScores', JSON.stringify(scores.slice(0, 10)));
    }

    function displayLeaderboard() {
        leaderboardContent.innerHTML = '';
        const scores = JSON.parse(localStorage.getItem('puzzleScores') || '[]');
        if (scores.length === 0) {
            leaderboardContent.innerHTML = '<p class="no-scores">Henüz kaydedilmiş skor yok.</p>';
        } else {
            scores.forEach((score, index) => {
                const scoreEl = document.createElement('div');
                scoreEl.innerHTML = `<span class="score-rank">${index + 1}.</span><span class="score-difficulty">${score.difficulty}</span><span class="score-time">${score.time}</span>`;
                leaderboardContent.appendChild(scoreEl);
            });
        }
        leaderboardScreen.style.display = 'flex';
    }

    function showHint() {
        if(gameState.hintUsed) { showAlert('Bu hakkınızı zaten kullandınız.'); return; }
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
        saveGameState();
    }

    let draggedItem = null;
let draggingHand; // Yeni değişken




    function addDragDropListeners() { const pieces = gameBoard.querySelectorAll('.puzzle-piece'); pieces.forEach(piece => { piece.addEventListener('dragstart', dragStart); piece.addEventListener('dragenter', dragEnter); piece.addEventListener('dragleave', dragLeave); piece.addEventListener('dragover', dragOver); piece.addEventListener('drop', dragDrop); piece.addEventListener('dragend', dragEnd); }); }

    function dragEnter(e) { e.preventDefault(); if (this.classList.contains('locked') || this === draggedItem) { return; } this.classList.add('drag-over'); }
    function dragDrop() { this.classList.remove('drag-over'); if (this.classList.contains('locked')) { return; } if (draggedItem && draggedItem !== this) { swapPieces(draggedItem, this); } }
    function dragStart(e) {
        if (this.classList.contains('locked')) { e.preventDefault(); return; }
        draggedItem = this;
        setTimeout(() => {
            this.classList.add('dragging');
        }, 0);
        playSound('pieceMove');
    }

    function dragEnd() {
        this.classList.remove('dragging');
        document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('drag-over'));
    }
    function dragOver(e) { e.preventDefault(); }
    function dragLeave() { this.classList.remove('drag-over'); }

    let currentTouchPiece = null;
    function addTouchListeners() { const pieces = gameBoard.querySelectorAll('.puzzle-piece'); pieces.forEach(piece => { piece.addEventListener('touchstart', touchStart, { passive: false }); piece.addEventListener('touchmove', touchMove, { passive: false }); piece.addEventListener('touchend', touchEnd, { passive: false }); }); }
    function touchStart(e) {
        if (this.classList.contains('locked')) return;
        e.preventDefault();
        currentTouchPiece = this;
        this.classList.add('dragging');

        // El işareti oluştur ve konumlandır
        draggingHand = document.createElement('div');
        draggingHand.classList.add('dragging-hand');
        draggingHand.textContent = '✊';
        Object.assign(draggingHand.style, {
            position: 'fixed',
            fontSize: '30px',
            color: 'white',
            textShadow: '0 0 5px black',
            opacity: '0.9',
            pointerEvents: 'none',
            zIndex: '101' // Puzzle parçasının üstünde
        });
        document.body.appendChild(draggingHand);
        updateHandPosition(e.touches ? e.touches.item(0) : e);

        playSound('pieceMove');
    }

    function touchMove(e) {
        if (!currentTouchPiece) return;
        e.preventDefault();
        const touch = e.touches ? e.touches.item(0) : e;
        updateHandPosition(touch); // El işaretini parmağın/farenin konumuna güncelle

        const targetPiece = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.puzzle-piece');
        document.querySelectorAll('.puzzle-piece.drag-over').forEach(p => p.classList.remove('drag-over'));
        if (targetPiece && !targetPiece.classList.contains('locked') && targetPiece !== currentTouchPiece) {
            targetPiece.classList.add('drag-over');
        }
    }

    function touchEnd(e) {
        if (!currentTouchPiece) return;
        e.preventDefault();
        currentTouchPiece.classList.remove('dragging');

        // El işaretini bırakma animasyonu ile kaldır
        if (draggingHand) {
            // YENİ: Yumruk el emojisini, "açık el" emojisi ile değiştir
            draggingHand.textContent = '🖐️';

            // YENİ: Emoji'nin son pozisyonda sabit kalmasını ve animasyonunu tetikle
            const touch = e.changedTouches ? e.changedTouches.item(0) : e;
            if(touch) {
               updateHandPosition(touch); // Elin pozisyonunu son dokunma noktasına sabitle
            }

            // Kaybolma animasyonunu uygula ve DOM'dan kaldır
            draggingHand.style.animation = 'releaseHand 0.5s ease-out forwards';
            setTimeout(() => {
                if (draggingHand && draggingHand.parentNode) {
                    draggingHand.parentNode.removeChild(draggingHand);
                    draggingHand = null;
                }
            }, 500); // Animasyon süresi kadar bekle
        }

        const finalTouch = e.changedTouches ? e.changedTouches.item(0) : e;
        const targetPiece = document.elementFromPoint(finalTouch.clientX, finalTouch.clientY)?.closest('.puzzle-piece');

        document.querySelectorAll('.puzzle-piece.drag-over').forEach(p => p.classList.remove('drag-over'));

        if (targetPiece && !targetPiece.classList.contains('locked') && targetPiece !== currentTouchPiece) {
            swapPieces(targetPiece, currentTouchPiece);
        }

        currentTouchPiece = null;
    }

    function updateHandPosition(point) {
        if (draggingHand && point) {
            draggingHand.style.left = `${point.clientX}px`;
            draggingHand.style.top = `${point.clientY}px`;
            draggingHand.style.transform = 'translate(-50%, -50%)'; // Merkezi parmak/fare ucunda tut
        }
    }
    function handleBackButton() {
        const anyOverlayOpen = [...document.querySelectorAll('.overlay-screen, .win-screen')].some(el => el.style.display === 'flex' || el.style.display === 'block');
        if (anyOverlayOpen) return;
        if (gameState.isGameActive) {
            exitGameConfirm.style.display = 'flex';
        } else {
            quitAppConfirm.style.display = 'flex';
        }
    }

    startGameButton.addEventListener('click', () => startGame(false));
    quickStartButton.addEventListener('click', quickStartGame);
    playAgainButton.addEventListener('click', resetGame);
    mainMenuButton.addEventListener('click', resetGame);
    mainMenuFromGameButton.addEventListener('click', resetGame);
    hintButton.addEventListener('click', showHint);
    leaderboardButton.addEventListener('click', displayLeaderboard);
    closeLeaderboardButton.addEventListener('click', () => leaderboardScreen.style.display = 'none');
    clearScoresButton.addEventListener('click', () => { confirmClearScores.style.display = 'flex'; });
    confirmClearYes.addEventListener('click', () => { localStorage.removeItem('puzzleScores'); confirmClearScores.style.display = 'none'; displayLeaderboard(); });
    confirmClearNo.addEventListener('click', () => { confirmClearScores.style.display = 'none'; });
    customAlertOk.addEventListener('click', () => { customAlert.style.display = 'none'; });
    continueYesButton.addEventListener('click', () => { continuePrompt.style.display = 'none'; loadGameFromSave(); });
    continueNoButton.addEventListener('click', () => { continuePrompt.style.display = 'none'; clearSavedGame(); });
    exitGameYes.addEventListener('click', () => { exitGameConfirm.style.display = 'none'; resetGame(); });
    exitGameNo.addEventListener('click', () => { exitGameConfirm.style.display = 'none'; });
    quitAppYes.addEventListener('click', () => { if (window.Android && typeof window.Android.closeApp === 'function') { window.Android.closeApp(); } else { quitAppConfirm.style.display = 'none'; showAlert('Uygulamadan sadece Android cihazlarda çıkılabilir.'); } });
    quitAppNo.addEventListener('click', () => { quitAppConfirm.style.display = 'none'; });

    function initialize() {
        createDifficultyButtons();
        createCategoryCards();
        updateStartButtonState();
        const savedState = getSavedGame();
        if (savedState && savedState.isGameActive) {
            continuePrompt.style.display = 'flex';
        }
    }

    initialize();
});