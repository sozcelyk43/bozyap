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
        { name: 'Çok Kolay', pieces: '2x4', cols: 2, rows: 4 },
        { name: 'Kolay', pieces: '3x5', cols: 3, rows: 5 },
        { name: 'Orta', pieces: '3x6', cols: 3, rows: 6 },
        { name: 'Zor', pieces: '4x8', cols: 4, rows: 8 },
        { name: 'Çok Zor', pieces: '5x10', cols: 5, rows: 9 }
    ];

    let isAudioContextResumed = false;
    document.body.addEventListener('click', resumeAudioContext, { once: true });
    document.body.addEventListener('touchend', resumeAudioContext, { once: true });

    function resumeAudioContext() {
        if (!isAudioContextResumed && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        isAudioContextResumed = true;
    }

    function playSound(name) {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (sounds[name]) {
            const source = audioContext.createBufferSource();
            source.buffer = sounds[name];
            source.connect(audioContext.destination);
            source.start(0);
        }
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {};
    function loadSound(name, url) { fetch(url).then(response => response.arrayBuffer()).then(buffer => audioContext.decodeAudioData(buffer)).then(decodedData => { sounds[name] = decodedData; }).catch(e => console.error(`Ses dosyası yüklenemedi: ${name}`, e)); }
    function playSound(name) { if (sounds[name]) { const source = audioContext.createBufferSource(); source.buffer = sounds[name]; source.connect(audioContext.destination); source.start(0); } }
    loadSound('pieceMove', 'sounds/button1.mp3');
    loadSound('piecePlace', 'sounds/button2.mp3');
    loadSound('win', 'sounds/success1.mp3');
    loadSound('hint', 'sounds/button3.mp3');

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

            if (index < 2) {
                button.classList.add('easy');
            } else if (index < 3) {
                button.classList.add('medium');
            } else {
                button.classList.add('hard');
            }

            button.innerHTML = `${level.name}<br><small>(${level.pieces})</small>`;
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

        // --- YENİ EKLENEN KOD BAŞLANGICI ---

        // 1. Oyun alanının en-boy oranını JS ile dinamik olarak ayarla
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gameBoard.style.aspectRatio = `${cols} / ${rows}`;

        // 2. Resmin ve hedef yapboz gridinin en-boy oranlarını hesapla
        const imageAspectRatio = img.width / img.height;
        const gridAspectRatio = cols / rows;

        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

        // 3. Orijinal resmi, yapboz gridine uyacak şekilde KIRPMA HESAPLAMALARI
        // Eğer resim, gridden daha genişse (ör: 16:9 resmi 4:3 gride sığdırmak)
        if (imageAspectRatio > gridAspectRatio) {
            sWidth = img.height * gridAspectRatio; // Genişliği kırp
            sx = (img.width - sWidth) / 2; // Ortalamak için başlangıç x pozisyonunu ayarla
        }
        // Eğer resim, gridden daha yüksekse (ör: dikey bir resmi 4:3 gride sığdırmak)
        else if (imageAspectRatio < gridAspectRatio) {
            sHeight = img.width / gridAspectRatio; // Yüksekliği kırp
            sy = (img.height - sHeight) / 2; // Ortalamak için başlangıç y pozisyonunu ayarla
        }

        // 4. Her bir KARE parçanın boyutunu hesapla (kırpılmış alana göre)
        const pieceSourceWidth = sWidth / cols;
        const pieceSourceHeight = sHeight / rows;

        // Kanvaslar için sabit bir çözünürlük belirleyelim (kalite için)
        const canvasSize = 200;

        for (let i = 0; i < cols * rows; i++) {
            const pieceDiv = document.createElement('div');
            pieceDiv.classList.add('puzzle-piece');
            pieceDiv.setAttribute('draggable', 'true');
            pieceDiv.dataset.originalIndex = i;

            const canvas = document.createElement('canvas');
            // Her kanvas kare olacak
            canvas.width = canvasSize;
            canvas.height = canvasSize;

            const ctx = canvas.getContext('2d');

            // 5. drawImage'in 9 parametreli versiyonunu kullanarak KIRPILMIŞ alandan parçayı çiz
            // Kaynak resim (img) üzerindeki kırpılmış bölgeden (sx, sy, sWidth, sHeight) ilgili parçayı al
            // ve hedef kanvasa (canvas) tam boyutunda (0, 0, canvasSize, canvasSize) çiz.
            const sourceX = sx + (i % cols) * pieceSourceWidth;
            const sourceY = sy + Math.floor(i / cols) * pieceSourceHeight;

            ctx.drawImage(
                img,
                sourceX, sourceY,           // Kaynak resimdeki parçanın başlangıç (x, y) noktası
                pieceSourceWidth, pieceSourceHeight, // Kaynak resimden alınacak parçanın genişlik ve yüksekliği
                0, 0,                       // Kanvas üzerinde çizime başlanacak (x, y) noktası
                canvasSize, canvasSize      // Kanvas üzerine çizilecek resmin genişlik ve yüksekliği
            );

            pieceDiv.appendChild(canvas);
            puzzlePieces.push(pieceDiv);
        }
        // --- YENİ EKLENEN KOD SONU ---

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

addMouseListeners();
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
            } else {
                piece.classList.remove('locked');
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
let draggingHand;


// --- YENİ FARE İLE SÜRÜKLEME SİSTEMİ (KESİN ÇÖZÜM) ---

let currentDraggedPiece = null;

// Bu fonksiyon, fare olay dinleyicilerini ekler.
function addMouseListeners() {
    const pieces = gameBoard.querySelectorAll('.puzzle-piece');
    pieces.forEach(piece => {
        piece.addEventListener('mousedown', onMouseDown);
    });
}

// ---- onMouseDown fonksiyonunun tamamını bununla değiştirin ----
function onMouseDown(e) {
    if (e.button !== 0 || this.classList.contains('locked')) return;
    e.preventDefault();

    document.body.classList.add('is-dragging');
    currentDraggedPiece = this;
    this.classList.add('dragging'); // Orijinal parçayı şeffaflaştırır

    // --- Taşıma Hayaletini (Klon Parça + Yumruk) Oluştur ---
    draggingHand = document.createElement('div');
    Object.assign(draggingHand.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '2000',
        transform: 'translate(-50%, -50%)' // Hayaleti fare imlecine ortalar
    });

    // Parçanın görsel kopyasını (canvas) oluştur
    const canvasClone = this.querySelector('canvas').cloneNode(true);



const originalCanvas = this.querySelector('canvas');
canvasClone.getContext('2d').drawImage(originalCanvas, 0, 0);
    const pieceRect = this.getBoundingClientRect();
    canvasClone.style.width = `${pieceRect.width}px`;
    canvasClone.style.height = `${pieceRect.height}px`;
    canvasClone.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
    canvasClone.style.display = 'block';

    // Yumruk emojisini oluştur
    const fistElement = document.createElement('span');
    fistElement.textContent = '✊';
    Object.assign(fistElement.style, {
        position: 'absolute',
        right: '0px',
        bottom: '0px',
        fontSize: '28px',
        // Yumruğu parçanın sağ alt köşesindeymiş gibi gösterir
        transform: 'translate(25%, 25%)',
        textShadow: '0 0 5px black'
    });

    // Yumruğu parçanın üzerine konumlandırmak için bir sarmalayıcı kullan
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(canvasClone);
    wrapper.appendChild(fistElement);

    // Tamamlanmış hayaleti ana taşıyıcıya ekle
    draggingHand.appendChild(wrapper);
    document.body.appendChild(draggingHand);

    updateHandPosition(e); // Hayaleti ilk konumuna getir

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    playSound('pieceMove');
}


function onMouseMove(e) {
    if (!currentDraggedPiece) return;
    
    // YUMRUK EMOJİSİNİ FARENİN KONUMUNA GÜNCELLE
    updateHandPosition(e);

    // Üzerinden geçilen parçayı vurgula
    const targetPiece = document.elementFromPoint(e.clientX, e.clientY)?.closest('.puzzle-piece');
    document.querySelectorAll('.puzzle-piece.drag-over').forEach(p => p.classList.remove('drag-over'));
    if (targetPiece && !targetPiece.classList.contains('locked') && targetPiece !== currentDraggedPiece) {
        targetPiece.classList.add('drag-over');
    }
}

// Farenin tuşu bırakıldığında
function onMouseUp(e) {
    if (!currentDraggedPiece) return;

    // Yumruk emojisini animasyonla kaldır
    if (draggingHand) {
        draggingHand.textContent = '🖐️'; // Bırakırken açık el olsun
        draggingHand.style.animation = 'releaseHand 0.5s ease-out forwards';
        setTimeout(() => {
            if (draggingHand) draggingHand.remove();
            draggingHand = null;
        }, 500);
    }
    
    const targetPiece = document.elementFromPoint(e.clientX, e.clientY)?.closest('.puzzle-piece');
    if (targetPiece && !targetPiece.classList.contains('locked') && targetPiece !== currentDraggedPiece) {
        swapPieces(targetPiece, currentDraggedPiece);
    }

    // Tüm stilleri ve dinleyicileri temizle
    currentDraggedPiece.classList.remove('dragging');
    document.querySelectorAll('.puzzle-piece.drag-over').forEach(p => p.classList.remove('drag-over'));
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.classList.remove('is-dragging');

    currentDraggedPiece = null;
}







    let currentTouchPiece = null;
    function addTouchListeners() { const pieces = gameBoard.querySelectorAll('.puzzle-piece'); pieces.forEach(piece => { piece.addEventListener('touchstart', touchStart, { passive: false }); piece.addEventListener('touchmove', touchMove, { passive: false }); piece.addEventListener('touchend', touchEnd, { passive: false }); }); }





// ---- touchStart fonksiyonunun tamamını bununla değiştirin ----
function touchStart(e) {
    if (this.classList.contains('locked')) return;
    e.preventDefault();

    document.body.classList.add('is-dragging');
    currentTouchPiece = this;
    this.classList.add('dragging'); // Orijinal parçayı şeffaflaştırır

    // --- Taşıma Hayaletini (Klon Parça + Yumruk) Oluştur ---
    draggingHand = document.createElement('div');
    Object.assign(draggingHand.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '2000',
        transform: 'translate(-50%, -50%)' // Hayaleti parmak ucuna ortalar
    });

    // Parçanın görsel kopyasını (canvas) oluştur
    const canvasClone = this.querySelector('canvas').cloneNode(true);
const originalCanvas = this.querySelector('canvas');
canvasClone.getContext('2d').drawImage(originalCanvas, 0, 0);
    const pieceRect = this.getBoundingClientRect();
    canvasClone.style.width = `${pieceRect.width}px`;
    canvasClone.style.height = `${pieceRect.height}px`;
    canvasClone.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
    canvasClone.style.display = 'block';

    // Yumruk emojisini oluştur
    const fistElement = document.createElement('span');
    fistElement.textContent = '✊';
    Object.assign(fistElement.style, {
        position: 'absolute',
        right: '0px',
        bottom: '0px',
        fontSize: '28px',
        // Yumruğu parçanın sağ alt köşesindeymiş gibi gösterir
        transform: 'translate(25%, 25%)',
        textShadow: '0 0 5px black'
    });

    // Yumruğu parçanın üzerine konumlandırmak için bir sarmalayıcı kullan
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.appendChild(canvasClone);
    wrapper.appendChild(fistElement);

    // Tamamlanmış hayaleti ana taşıyıcıya ekle
    draggingHand.appendChild(wrapper);
    document.body.appendChild(draggingHand);

    updateHandPosition(e.touches ? e.touches.item(0) : e); // Hayaleti ilk konumuna getir

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
    document.body.classList.remove('is-dragging');

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