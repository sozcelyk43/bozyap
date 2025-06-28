document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTLERİNİ SEÇME ===
    const selectionScreen = document.getElementById('selectionScreen');
    const gameContainer = document.querySelector('.game-container');
    const pieceOptionsContainer = document.querySelector('.piece-options');
    const categoryOptionsContainer = document.querySelector('.category-options');
    const startGameButton = document.getElementById('startGameButton');
    const gameBoard = document.getElementById('gameBoard');
    const gameControls = document.querySelector('.game-controls');
    const timerDisplay = document.getElementById('timer');
    const hintButton = document.getElementById('hintButton');
    const winScreen = document.getElementById('winScreen');
    const finalTimeDisplay = document.getElementById('finalTime');
    const playAgainButton = document.getElementById('playAgainButton');
    const mainMenuButton = document.getElementById('mainMenuButton');
    const mainMenuFromGameButton = document.getElementById('mainMenuFromGame');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const gameTitle = document.getElementById('gameTitle');
    const footer = document.querySelector('footer');

    // === OYUN DEĞİŞKENLERİ ===
    let selectedDifficulty = null;
    let selectedCategory = null;
    let selectedImageURL = null; // Sadece restart için
    let puzzlePieces = [];
    let gameStartTime;
    let timerInterval;
    let hintUsed = false;
    let confettiInstance = null;

const difficulties = [
        { name: 'Çok Kolay', pieces: '3x2', cols: 3, rows: 2, icon: '🧩' },
        { name: 'Kolay', pieces: '4x3', cols: 4, rows: 3, icon: '🧩🧩' },
        { name: 'Orta', pieces: '5x4', cols: 5, rows: 4, icon: '🧩🧩🧩' },
        { name: 'Zor', pieces: '6x4', cols: 6, rows: 4, icon: '🧩🧩🧩🧩' },
        { name: 'Çok Zor', pieces: '7x5', cols: 7, rows: 5, icon: '🧩🧩🧩🧩🧩' }
    ];

    // === SES FONKSİYONLARI ===
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {};
    function loadSound(name, url) {
        fetch(url).then(response => { if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); } return response.arrayBuffer(); }).then(buffer => audioContext.decodeAudioData(buffer)).then(decodedData => { sounds[name] = decodedData; }).catch(e => console.error(`Ses dosyası yüklenemedi: ${name} (${url})`, e));
    }
    function playSound(name) {
        if (sounds[name]) { const source = audioContext.createBufferSource(); source.buffer = sounds[name]; source.connect(audioContext.destination); source.start(0); }
    }
    loadSound('pieceMove', 'sounds/button-1.mp3');
    loadSound('piecePlace', 'sounds/button-2.mp3');
    loadSound('win', 'sounds/success-1.mp3');
    loadSound('hint', 'sounds/button-3.mp3');

    // === GÖRSEL ARAYÜZ OLUŞTURMA ===
    function createDifficultyButtons() {
        pieceOptionsContainer.innerHTML = '';
        difficulties.forEach(level => {
            const button = document.createElement('button');
            button.classList.add('level-button');
            button.textContent = `${level.name} (${level.pieces})`;
            button.addEventListener('click', () => {
                selectedDifficulty = level;
                document.querySelectorAll('.level-button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                checkSelections();
                playSound('piecePlace');
            });
            pieceOptionsContainer.appendChild(button);
        });
    }

    function createCategoryCards() {
        categoryOptionsContainer.innerHTML = '';
        for (const categoryName in imageCategories) {
            const categoryData = imageCategories[categoryName];
            const card = document.createElement('button');
            card.classList.add('category-card');
            const img = document.createElement('img');
            img.src = categoryData.kapakResmi;
            img.alt = categoryName;
            img.loading = 'lazy';
            const span = document.createElement('span');
            span.textContent = categoryName;
            card.appendChild(img);
            card.appendChild(span);
            if (!categoryData.resimListesi || categoryData.resimListesi.length === 0) {
                card.disabled = true;
            }
            card.addEventListener('click', () => {
                if (card.disabled) return;
                selectedCategory = categoryName;
                document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                checkSelections();
                playSound('piecePlace');
            });
            categoryOptionsContainer.appendChild(card);
        }
    }

    function checkSelections() {
        startGameButton.disabled = !(selectedDifficulty && selectedCategory);
    }

    // === OYUN BAŞLATMA VE YÖNETİMİ ===
    startGameButton.addEventListener('click', async () => {
        if (!selectedDifficulty || !selectedCategory) return;
        const category = imageCategories[selectedCategory];
        const imageList = category.resimListesi;
        selectedImageURL = imageList[Math.floor(Math.random() * imageList.length)];
        await setupAndStartGame(selectedImageURL, selectedDifficulty.cols, selectedDifficulty.rows);
    });
    
    async function setupAndStartGame(imageUrl, cols, rows) {
        selectionScreen.style.display = 'none';
        gameTitle.style.display = 'none';
        gameBoard.style.display = 'grid';
        gameControls.style.display = 'flex';
        footer.style.display = 'none';
        loadingOverlay.style.display = 'flex';
        await createPuzzle(imageUrl, cols, rows);
        loadingOverlay.style.display = 'none';
        startTimer();
    }

    function restartPuzzle() {
        if (selectedImageURL && selectedDifficulty) {
            winScreen.style.display = 'none';
            gameBoard.innerHTML = '';
            hintUsed = false;
            hintButton.disabled = false;
            if (confettiInstance) {
                confettiInstance.clear();
                document.getElementById('confetti-canvas')?.remove();
                confettiInstance = null;
            }
            setupAndStartGame(selectedImageURL, selectedDifficulty.cols, selectedDifficulty.rows);
        } else {
            resetGame(); // Eğer bir sebepten ötürü bilgi yoksa ana menüye dön
        }
    }

    function resetGame() {
        stopTimer();
        if (confettiInstance) { confettiInstance.clear(); document.getElementById('confetti-canvas')?.remove(); confettiInstance = null; }
        selectionScreen.style.display = 'block';
        gameTitle.style.display = 'block';
        gameBoard.style.display = 'none';
        winScreen.style.display = 'none';
        gameControls.style.display = 'none';
        footer.style.display = 'block';
        timerDisplay.textContent = '00:00';
        hintButton.disabled = false;
        hintUsed = false;
        gameBoard.innerHTML = '';
        selectedDifficulty = null;
        selectedCategory = null;
        selectedImageURL = null;
        puzzlePieces = [];
        document.querySelectorAll('.level-button, .category-card').forEach(btn => btn.classList.remove('selected'));
        checkSelections();
    }
    
    playAgainButton.addEventListener('click', () => {
        playSound('piecePlace');
        restartPuzzle();
    });

    mainMenuButton.addEventListener('click', () => {
        playSound('piecePlace');
        resetGame();
    });

    mainMenuFromGameButton.addEventListener('click', () => {
        playSound('piecePlace');
        resetGame();
    });

    hintButton.addEventListener('click', () => {
        if (hintUsed || !selectedImageURL) return;
        playSound('hint');
        showHint();
        hintUsed = true;
        hintButton.disabled = true;
    });

    // === ZAMANLAYICI FONKSİYONLARI ===
    function startTimer() { gameStartTime = Date.now(); timerInterval = setInterval(updateTimer, 1000); updateTimer(); }
    function stopTimer() { clearInterval(timerInterval); }
    function updateTimer() { const elapsed = Date.now() - gameStartTime; const totalSeconds = Math.floor(elapsed / 1000); const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60; timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; }

    // === PUZZLE OLUŞTURMA VE OYNANIŞ MANTIĞI ===
    async function createPuzzle(imageUrl, cols, rows) {
        gameBoard.innerHTML = '';
        puzzlePieces = [];
        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = "Anonymous";
        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
        } catch (e) {
            console.error("Resim yüklenemedi:", imageUrl, e);
            alert("Yapboz resmi yüklenirken bir hata oluştu. Lütfen başka bir kategori deneyin veya internet bağlantınızı kontrol edin.");
            loadingOverlay.style.display = 'none';
            resetGame();
            return;
        }
        
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        const pieceWidth = img.width / cols;
        const pieceHeight = img.height / rows;
        
        for (let i = 0; i < cols * rows; i++) {
            const pieceDiv = document.createElement('div');
            pieceDiv.classList.add('puzzle-piece');
            pieceDiv.draggable = true;
            pieceDiv.dataset.originalIndex = i;
            const row = Math.floor(i / cols);
            const col = i % cols;
            const canvas = document.createElement('canvas');
            canvas.width = pieceWidth;
            canvas.height = pieceHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);
            const pieceImage = document.createElement('img');
            pieceImage.src = canvas.toDataURL();
            pieceImage.alt = `Puzzle Piece ${i}`;
            pieceDiv.appendChild(pieceImage);
            puzzlePieces.push(pieceDiv);
        }

        shuffleArray(puzzlePieces);
        puzzlePieces.forEach(piece => gameBoard.appendChild(piece));
        addDragDropListeners();
        addTouchListeners();
        updatePieceState();
    }
    
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }
    
    // === SÜRÜKLE-BIRAK VE DOKUNMATİK FONKSİYONLAR ===
    let draggedItem = null;
    function addDragDropListeners() {
        const pieces = gameBoard.querySelectorAll('.puzzle-piece');
        pieces.forEach(piece => {
            piece.addEventListener('dragstart', dragStart);
            piece.addEventListener('dragenter', dragEnter);
            piece.addEventListener('dragleave', dragLeave);
            piece.addEventListener('dragover', dragOver);
            piece.addEventListener('drop', dragDrop);
            piece.addEventListener('dragend', dragEnd);
        });
    }
    function dragStart(e) { if (this.classList.contains('locked')) { e.preventDefault(); return; } draggedItem = this; setTimeout(() => this.style.opacity = '0.5', 0); playSound('pieceMove'); }
    function dragEnter(e) { e.preventDefault(); if (this.classList.contains('locked')) return; this.classList.add('drag-over'); }
    function dragLeave() { this.classList.remove('drag-over'); }
    function dragOver(e) { e.preventDefault(); }
    function dragEnd() { this.style.opacity = '1'; }
    function dragDrop() { if (this.classList.contains('locked')) return; this.classList.remove('drag-over'); if (draggedItem && draggedItem !== this) { swapPieces(draggedItem, this); } }
    
    let currentTouchPiece = null;
    let touchPieceClone = null;
    function addTouchListeners() {
        const pieces = gameBoard.querySelectorAll('.puzzle-piece');
        pieces.forEach(piece => {
            piece.addEventListener('touchstart', touchStart, { passive: false });
            piece.addEventListener('touchmove', touchMove, { passive: false });
            piece.addEventListener('touchend', touchEnd, { passive: false });
        });
    }
    function touchStart(e) { if (this.classList.contains('locked')) return; if (e.touches.length !== 1) return; e.preventDefault(); currentTouchPiece = this; currentTouchPiece.style.opacity = '0.4'; playSound('pieceMove'); }
    function touchMove(e) { if (!currentTouchPiece) return; e.preventDefault(); }
    function touchEnd(e) {
        if (!currentTouchPiece) return;
        currentTouchPiece.style.opacity = '1';
        const touch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        if (targetElement && targetElement.classList.contains('puzzle-piece') && targetElement !== currentTouchPiece && !targetElement.classList.contains('locked')) {
            swapPieces(currentTouchPiece, targetElement);
        }
        currentTouchPiece = null;
    }

    // === OYUN DURUMU KONTROL FONKSİYONLARI ===
    function updatePieceState() {
        const currentPieces = Array.from(gameBoard.querySelectorAll('.puzzle-piece'));
        currentPieces.forEach((piece, index) => {
            if (parseInt(piece.dataset.originalIndex) === index) {
                piece.classList.add('locked');
                piece.draggable = false;
            }
        });
    }
    function swapPieces(p1, p2) {
        const parent = p1.parentNode;
        const p2Next = p2.nextSibling;
        if (p2Next === p1) {
            parent.insertBefore(p1, p2);
        } else {
            parent.insertBefore(p2, p1);
            if (p2Next) {
                parent.insertBefore(p1, p2Next);
            } else {
                parent.appendChild(p1);
            }
        }
        playSound('piecePlace');
        updatePieceState();
        checkWinCondition();
    }
    
    async function showHint() {
        const hintOverlay = document.createElement('div');
        Object.assign(hintOverlay.style, { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0, transition: 'opacity 0.5s' });
        const hintImg = document.createElement('img');
        hintImg.src = selectedImageURL;
        Object.assign(hintImg.style, { maxWidth: '90%', maxHeight: '90%', borderRadius: '10px', boxShadow: '0 0 30px rgba(255,255,255,0.5)' });
        hintOverlay.appendChild(hintImg);
        document.body.appendChild(hintOverlay);
        setTimeout(() => hintOverlay.style.opacity = 1, 50);
        setTimeout(() => { hintOverlay.style.opacity = 0; hintOverlay.addEventListener('transitionend', () => hintOverlay.remove()); }, 3000);
    }
    
    function checkWinCondition() {
        const currentOrderDOM = Array.from(gameBoard.querySelectorAll('.puzzle-piece'));
        const isSolved = currentOrderDOM.every((piece, index) => parseInt(piece.dataset.originalIndex) === index);
        
        if (isSolved) {
            stopTimer();
            playSound('win');
            gameBoard.classList.add('solved-effect');
            
            const confettiCanvas = document.createElement('canvas');
            confettiCanvas.id = 'confetti-canvas';
            Object.assign(confettiCanvas.style, { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' });
            document.body.appendChild(confettiCanvas);
            confettiInstance = new ConfettiGenerator({ target: 'confetti-canvas' });
            confettiInstance.render();

            setTimeout(() => {
                gameBoard.style.display = 'none';
                gameControls.style.display = 'none';
                finalTimeDisplay.textContent = `Tamamlama Süreniz: ${timerDisplay.textContent}`;
                winScreen.style.display = 'block';
            }, 2000);
        }
    }

    // === UYGULAMAYI BAŞLATMA ===
    function initialize() {
        createDifficultyButtons();
        createCategoryCards();
        checkSelections();
        footer.style.display = 'block';
    }

    initialize();
});
