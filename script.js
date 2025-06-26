document.addEventListener('DOMContentLoaded', () => {
    const selectionScreen = document.getElementById('selectionScreen');
    const gameBoard = document.getElementById('gameBoard');
    const pieceOptions = document.querySelector('.piece-options');
    const categoryOptions = document.querySelector('.category-options');
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

    let selectedCols = null;
    let selectedRows = null;
    let selectedCategory = null;
    let selectedImage = null;
    let puzzlePieces = [];
    let gameStartTime;
    let timerInterval;
    let hintUsed = false;
    let confettiInstance = null;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {};

    function loadSound(name, url) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(buffer => audioContext.decodeAudioData(buffer))
            .then(decodedData => { sounds[name] = decodedData; })
            .catch(e => console.error(`Ses dosyası yüklenemedi: ${name} (${url})`, e));
    }

    function playSound(name) {
        if (sounds[name]) {
            const source = audioContext.createBufferSource();
            source.buffer = sounds[name];
            source.connect(audioContext.destination);
            source.start(0);
        } else {
            console.warn(`Ses dosyası yüklenmedi veya bulunamadı: ${name}`);
        }
    }

    loadSound('pieceMove', 'sounds/button-1.mp3');
    loadSound('piecePlace', 'sounds/button-2.mp3');
    loadSound('win', 'sounds/success-1.mp3');
    loadSound('hint', 'sounds/button-3.mp3');

    function loadCategories() {
        categoryOptions.innerHTML = '';
        for (const categoryName in imageCategories) {
            const button = document.createElement('button');
            button.classList.add('category-button');
            button.textContent = categoryName;
            button.dataset.category = categoryName;
            categoryOptions.appendChild(button);
        }
    }

    function updatePieceOptions() {
        pieceOptions.innerHTML = '';
        const pieceConfigs = [
            { name: 'Çok Kolay (3x2)', cols: 3, rows: 2 },
            { name: 'Kolay (4x3)', cols: 4, rows: 3 },
            { name: 'Orta (5x4)', cols: 5, rows: 4 },
            { name: 'Zor (6x4)', cols: 6, rows: 4 },
            { name: 'Çok Zor (7x5)', cols: 7, rows: 5 }
        ];
        pieceConfigs.forEach(config => {
            const button = document.createElement('button');
            button.classList.add('piece-button');
            button.textContent = config.name;
            button.dataset.cols = config.cols;
            button.dataset.rows = config.rows;
            pieceOptions.appendChild(button);
        });
    }

    pieceOptions.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('piece-button')) {
            document.querySelectorAll('.piece-button').forEach(btn => btn.classList.remove('selected'));
            target.classList.add('selected');
            selectedCols = parseInt(target.dataset.cols);
            selectedRows = parseInt(target.dataset.rows);
            updateStartButtonState();
            playSound('piecePlace');
        }
    });

    categoryOptions.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('category-button')) {
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('selected'));
            target.classList.add('selected');
            selectedCategory = target.dataset.category;
            const imagesInSelectedCategory = imageCategories[selectedCategory];
            selectedImage = imagesInSelectedCategory[Math.floor(Math.random() * imagesInSelectedCategory.length)];
            updateStartButtonState();
            playSound('piecePlace');
        }
    });

    startGameButton.addEventListener('click', () => {
        if (selectedCols && selectedRows && selectedCategory && selectedImage) {
            footer.style.display = 'none';
            selectionScreen.style.display = 'none';
            gameTitle.style.display = 'none';
            gameBoard.style.display = 'grid';
            gameControls.style.display = 'flex';
            createPuzzle(selectedImage, selectedCols, selectedRows);
            startTimer();
            playSound('piecePlace');
        } else {
            alert('Lütfen zorluk seviyesi ve resim kategorisi seçin!');
        }
    });

    playAgainButton.addEventListener('click', () => {
        restartPuzzle();
        playSound('piecePlace');
    });

    mainMenuButton.addEventListener('click', () => {
        resetGame();
        playSound('piecePlace');
    });

    mainMenuFromGameButton.addEventListener('click', () => {
        resetGame();
        playSound('piecePlace');
    });

    hintButton.addEventListener('click', () => {
        if (hintUsed) {
            alert('İpucu hakkınızı zaten kullandınız!');
            return;
        }
        showHint();
        hintUsed = true;
        hintButton.disabled = true;
        playSound('hint');
    });

    function restartPuzzle() {
        footer.style.display = 'none';
        winScreen.style.display = 'none';
        gameBoard.style.display = 'grid';
        gameControls.style.display = 'flex';
        timerDisplay.textContent = '00:00';
        hintButton.disabled = false;
        hintUsed = false;
        if (confettiInstance) {
            confettiInstance.clear();
            const confettiCanvas = document.getElementById('confetti-canvas');
            if (confettiCanvas) confettiCanvas.remove();
            confettiInstance = null;
        }
        gameBoard.innerHTML = '';
        gameBoard.style.gap = '2px';
        gameBoard.style.borderColor = 'rgba(189, 195, 199, 0.5)';
        gameBoard.classList.remove('solved-effect');
        createPuzzle(selectedImage, selectedCols, selectedRows);
        startTimer();
    }

    function resetGame() {
        footer.style.display = 'block';
        stopTimer();
        if (confettiInstance) {
            confettiInstance.clear();
            const confettiCanvas = document.getElementById('confetti-canvas');
            if (confettiCanvas) confettiCanvas.remove();
            confettiInstance = null;
        }
        selectionScreen.style.display = 'block';
        gameTitle.style.display = 'block';
        gameBoard.style.display = 'none';
        winScreen.style.display = 'none';
        gameControls.style.display = 'none';
        timerDisplay.textContent = '00:00';
        hintButton.disabled = false;
        hintUsed = false;
        gameBoard.innerHTML = '';
        gameBoard.style.gap = '2px';
        gameBoard.style.borderColor = 'rgba(189, 195, 199, 0.5)';
        gameBoard.classList.remove('solved-effect');
        selectedCols = null;
        selectedRows = null;
        selectedCategory = null;
        selectedImage = null;
        puzzlePieces = [];
        document.querySelectorAll('.piece-button, .category-button').forEach(btn => btn.classList.remove('selected'));
        updateStartButtonState();
    }

    function updateStartButtonState() {
        startGameButton.disabled = !(selectedCols && selectedRows && selectedCategory);
    }

    function startTimer() {
        gameStartTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateTimer() {
        const elapsedTime = Date.now() - gameStartTime;
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    async function createPuzzle(imageUrl, cols, rows) {
        gameBoard.innerHTML = '';
        puzzlePieces = [];
        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = "Anonymous";
        await new Promise(resolve => img.onload = resolve);
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        const pieceWidthOriginal = img.width / cols;
        const pieceHeightOriginal = img.height / rows;
        const totalPieces = cols * rows;
        for (let i = 0; i < totalPieces; i++) {
            const pieceDiv = document.createElement('div');
            pieceDiv.classList.add('puzzle-piece');
            pieceDiv.setAttribute('draggable', 'true');
            pieceDiv.dataset.originalIndex = i;
            const row = Math.floor(i / cols);
            const col = i % cols;
            const canvas = document.createElement('canvas');
            canvas.width = pieceWidthOriginal;
            canvas.height = pieceHeightOriginal;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, col * pieceWidthOriginal, row * pieceHeightOriginal, pieceWidthOriginal, pieceHeightOriginal, 0, 0, pieceWidthOriginal, pieceHeightOriginal);
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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

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

    // ================================================================
    // *** PC / FARE İÇİN KESİN DÜZELTME BURADA ***
    // ================================================================
    
    // `e` parametresi eklendi ve `e.preventDefault()` çağrıldı.
    function dragStart(e) { 
        if (this.classList.contains('locked')) {
            // Sürükleme olayını varsayılan olarak engelle. Bu en güçlü yöntemdir.
            e.preventDefault(); 
            return;
        }
        draggedItem = this;
        setTimeout(() => this.style.opacity = '0.5', 0);
        playSound('pieceMove');
    }

    function dragEnter(e) {
        e.preventDefault();
        if (this.classList.contains('locked')) {
            return;
        }
        this.classList.add('drag-over');
    }

    function dragDrop() {
        this.classList.remove('drag-over');
        if (this.classList.contains('locked')) {
            return;
        }
        if (draggedItem && draggedItem !== this) {
            swapPieces(draggedItem, this);
            playSound('piecePlace');
        }
    }

    function dragEnd() {
        this.style.opacity = '1';
        document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('drag-over'));
    }

    function dragOver(e) { e.preventDefault(); }
    
    function dragLeave() { this.classList.remove('drag-over'); }

    // ================================================================
    // *** DOKUNMATİK EKRAN FONKSİYONLARI (ZATEN DOĞRU ÇALIŞIYOR) ***
    // ================================================================

    let currentTouchPiece = null;
    let touchPieceClone = null;
    let cloneOffsetX = 0;
    let cloneOffsetY = 0;

    function addTouchListeners() {
        const pieces = gameBoard.querySelectorAll('.puzzle-piece');
        pieces.forEach(piece => {
            piece.addEventListener('touchstart', touchStart, { passive: false });
            piece.addEventListener('touchmove', touchMove, { passive: false });
            piece.addEventListener('touchend', touchEnd, { passive: false });
            piece.addEventListener('touchcancel', touchEnd, { passive: false });
        });
    }

    function touchStart(e) {
        if (this.classList.contains('locked')) return;
        if (e.touches.length !== 1) return;
        e.preventDefault();
        currentTouchPiece = this;
        currentTouchPiece.style.opacity = '0.4';
        currentTouchPiece.style.pointerEvents = 'none';
        touchPieceClone = currentTouchPiece.cloneNode(true);
        Object.assign(touchPieceClone.style, {
            position: 'fixed', zIndex: '1001', opacity: '1', pointerEvents: 'none',
            width: currentTouchPiece.offsetWidth + 'px', height: currentTouchPiece.offsetHeight + 'px',
            borderRadius: getComputedStyle(currentTouchPiece).borderRadius, boxShadow: getComputedStyle(currentTouchPiece).boxShadow,
            border: getComputedStyle(currentTouchPiece).border, backgroundColor: getComputedStyle(currentTouchPiece).backgroundColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.05)'
        });
        const imgInClone = touchPieceClone.querySelector('img');
        if (imgInClone) { Object.assign(imgInClone.style, { width: '100%', height: '100%', objectFit: 'fill' }); }
        document.body.appendChild(touchPieceClone);
        const touch = e.touches[0];
        const rect = currentTouchPiece.getBoundingClientRect();
        cloneOffsetX = touch.clientX - rect.left;
        cloneOffsetY = touch.clientY - rect.top;
        touchPieceClone.style.left = `${touch.clientX - cloneOffsetX}px`;
        touchPieceClone.style.top = `${touch.clientY - cloneOffsetY}px`;
        playSound('pieceMove');
    }

    function touchMove(e) {
        if (!touchPieceClone || !currentTouchPiece || e.touches.length !== 1) return;
        e.preventDefault();
        const touch = e.touches[0];
        touchPieceClone.style.left = `${touch.clientX - cloneOffsetX}px`;
        touchPieceClone.style.top = `${touch.clientY - cloneOffsetY}px`;
        const targetPiece = findTargetPiece(touch.clientX, touch.clientY);
        document.querySelectorAll('.puzzle-piece').forEach(piece => piece.classList.remove('drag-over'));
        if (targetPiece && targetPiece !== currentTouchPiece && !targetPiece.classList.contains('locked')) {
            targetPiece.classList.add('drag-over');
        }
    }

    function touchEnd(e) {
        if (!currentTouchPiece || !touchPieceClone) return;
        e.preventDefault();
        touchPieceClone.remove();
        touchPieceClone = null;
        currentTouchPiece.style.opacity = '1';
        currentTouchPiece.style.pointerEvents = 'auto';
        document.querySelectorAll('.puzzle-piece').forEach(piece => piece.classList.remove('drag-over'));
        const touch = e.changedTouches[0];
        const targetPiece = findTargetPiece(touch.clientX, touch.clientY);
        if (targetPiece && targetPiece !== currentTouchPiece && !targetPiece.classList.contains('locked')) {
            swapPieces(currentTouchPiece, targetPiece);
            playSound('piecePlace');
        }
        currentTouchPiece = null;
    }

    function findTargetPiece(clientX, clientY) {
        let targetPiece = null;
        gameBoard.querySelectorAll('.puzzle-piece').forEach(piece => {
            const rect = piece.getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && piece !== currentTouchPiece) {
                targetPiece = piece;
            }
        });
        return targetPiece;
    }
    
    function updatePieceState() {
        const currentPieces = Array.from(gameBoard.querySelectorAll('.puzzle-piece'));
        currentPieces.forEach((piece, index) => {
            if (parseInt(piece.dataset.originalIndex) === index) {
                piece.classList.add('locked');
                piece.setAttribute('draggable', 'false');
            }
        });
    }

    function swapPieces(piece1, piece2) {
        requestAnimationFrame(() => {
            const parent = gameBoard;
            const temp = document.createElement('div');
            parent.insertBefore(temp, piece1);
            parent.insertBefore(piece1, piece2);
            parent.insertBefore(piece2, temp);
            temp.remove();
            
            updatePieceState();
            checkWinCondition();
        });
    }

    async function showHint() {
        const tempImage = new Image();
        tempImage.src = selectedImage;
        tempImage.crossOrigin = "Anonymous";
        await new Promise(resolve => tempImage.onload = resolve);
        const hintOverlay = document.createElement('div');
        Object.assign(hintOverlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: '2000', display: 'flex',
            justifyContent: 'center', alignItems: 'center', opacity: '0', transition: 'opacity 0.5s ease-in-out'
        });
        const hintImg = document.createElement('img');
        hintImg.src = selectedImage;
        Object.assign(hintImg.style, {
            maxWidth: '90%', maxHeight: '90%', objectFit: 'contain',
            borderRadius: '10px', boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
        });
        hintOverlay.appendChild(hintImg);
        document.body.appendChild(hintOverlay);
        setTimeout(() => hintOverlay.style.opacity = '1', 50);
        setTimeout(() => {
            hintOverlay.style.opacity = '0';
            hintOverlay.addEventListener('transitionend', () => hintOverlay.remove(), { once: true });
        }, 3000);
    }

    function checkWinCondition() {
        const currentOrderDOM = Array.from(gameBoard.querySelectorAll('.puzzle-piece'));
        let isSolved = true;
        for (let i = 0; i < currentOrderDOM.length; i++) {
            if (parseInt(currentOrderDOM[i].dataset.originalIndex) !== i) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) {
            stopTimer();
            playSound('win');
            const confettiCanvas = document.createElement('canvas');
            confettiCanvas.id = 'confetti-canvas';
            Object.assign(confettiCanvas.style, {
                position: 'fixed', top: '0', left: '0', width: '100%',
                height: '100%', zIndex: '9999', pointerEvents: 'none'
            });
            document.body.appendChild(confettiCanvas);
            const confettiSettings = {
                target: 'confetti-canvas', max: 80, size: 1, animate: true,
                props: ['circle', 'triangle', 'square', 'line'],
                colors: [[165, 104, 246], [230, 61, 135], [0, 199, 228], [253, 214, 126]],
                clock: 25, start_from_zero: false, decay: 0.9,
                width: window.innerWidth, height: window.innerHeight
            };
            confettiInstance = new ConfettiGenerator(confettiSettings);
            confettiInstance.render();
            gameBoard.innerHTML = '';
            puzzlePieces.sort((a, b) => parseInt(a.dataset.originalIndex) - parseInt(b.dataset.originalIndex))
                .forEach(piece => gameBoard.appendChild(piece));
            gameBoard.style.gap = '0px';
            gameBoard.style.borderColor = 'transparent';
            gameBoard.classList.add('solved-effect');
            setTimeout(() => {
                const finalTime = timerDisplay.textContent;
                finalTimeDisplay.textContent = `Tamamlama Süreniz: ${finalTime}`;
                gameBoard.style.display = 'none';
                gameControls.style.display = 'none';
                if (confettiInstance) {
                    confettiInstance.clear();
                    confettiCanvas.remove();
                    confettiInstance = null;
                }
                winScreen.style.display = 'block';
            }, 6000);
        }
    }

    footer.style.display = 'block';
    loadCategories();
    updatePieceOptions();
});
