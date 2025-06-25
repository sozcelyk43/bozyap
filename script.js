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

    let selectedCols = null;
    let selectedRows = null;
    let selectedCategory = null;
    let selectedImage = null;

    let puzzlePieces = [];
    let gameStartTime;
    let timerInterval;
    let hintUsed = false;
    let confettiInstance = null;

    // --- Ses Efektleri ---
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
            .then(buffer => audioContext.decodeSound(buffer))
            .then(decodedData => {
                sounds[name] = decodedData;
            })
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


    const imageCategories = {
        "Doğa ve Manzara": [
            "images/dogamanzara/dogamanzara01.jpg", "images/dogamanzara/dogamanzara02.jpg",
            "images/dogamanzara/dogamanzara03.jpg", "images/dogamanzara/dogamanzara04.jpg",
            "images/dogamanzara/dogamanzara05.jpg", "images/dogamanzara/dogamanzara06.jpg",
            "images/dogamanzara/dogamanzara07.jpg", "images/dogamanzara/dogamanzara08.jpg",
            "images/dogamanzara/dogamanzara09.jpg", "images/dogamanzara/dogamanzara10.jpg",
            "images/dogamanzara/dogamanzara11.jpg", "images/dogamanzara/dogamanzara12.jpg",
            "images/dogamanzara/dogamanzara13.jpg", "images/dogamanzara/dogamanzara14.jpg",
            "images/dogamanzara/dogamanzara15.jpg", "images/dogamanzara/dogamanzara16.jpg",
            "images/dogamanzara/dogamanzara17.jpg", "images/dogamanzara/dogamanzara18.jpg",
            "images/dogamanzara/dogamanzara19.jpg", "images/dogamanzara/dogamanzara20.jpg"
        ],
        "Hayvanlar": [
            "images/hayvanlar/hayvanlar01.jpg", "images/hayvanlar/hayvanlar02.jpg",
            "images/hayvanlar/hayvanlar03.jpg", "images/hayvanlar/hayvanlar04.jpg",
            "images/hayvanlar/hayvanlar05.jpg", "images/hayvanlar/hayvanlar06.jpg",
            "images/hayvanlar/hayvanlar07.jpg", "images/hayvanlar/hayvanlar08.jpg",
            "images/hayvanlar/hayvanlar09.jpg", "images/hayvanlar/hayvanlar10.jpg",
            "images/hayvanlar/hayvanlar11.jpg", "images/hayvanlar/hayvanlar12.jpg",
            "images/hayvanlar/hayvanlar13.jpg", "images/hayvanlar/hayvanlar14.jpg",
            "images/hayvanlar/hayvanlar15.jpg", "images/hayvanlar/hayvanlar16.jpg",
            "images/hayvanlar/hayvanlar17.jpg", "images/hayvanlar/hayvanlar18.jpg",
            "images/hayvanlar/hayvanlar19.jpg", "images/hayvanlar/hayvanlar20.jpg"
        ],
        "Şehirler ve Mimari": [
            "images/sehirler/sehirler01.jpg", "images/sehirler/sehirler02.jpg",
            "images/sehirler/sehirler03.jpg", "images/sehirler/sehirler04.jpg",
            "images/sehirler/sehirler05.jpg", "images/sehirler/sehirler06.jpg",
            "images/sehirler/sehirler07.jpg", "images/sehirler/sehirler08.jpg",
            "images/sehirler/sehirler09.jpg", "images/sehirler/sehirler10.jpg",
            "images/sehirler/sehirler11.jpg", "images/sehirler/sehirler12.jpg",
            "images/sehirler/sehirler13.jpg", "images/sehirler/sehirler14.jpg",
            "images/sehirler/sehirler15.jpg", "images/sehirler/sehirler16.jpg",
            "images/sehirler/sehirler17.jpg", "images/sehirler/sehirler18.jpg",
            "images/sehirler/sehirler19.jpg", "images/sehirler/sehirler20.jpg"
        ],
        "Yiyecek ve İçecek": [
            "images/yiyecek/yiyecek01.jpg", "images/yiyecek/yiyecek02.jpg",
            "images/yiyecek/yiyecek03.jpg", "images/yiyecek/yiyecek04.jpg",
            "images/yiyecek/yiyecek05.jpg", "images/yiyecek/yiyecek06.jpg",
            "images/yiyecek/yiyecek07.jpg", "images/yiyecek/yiyecek08.jpg",
            "images/yiyecek/yiyecek09.jpg", "images/yiyecek/yiyecek10.jpg",
            "images/yiyecek/yiyecek11.jpg", "images/yiyecek/yiyecek12.jpg",
            "images/yiyecek/yiyecek13.jpg", "images/yiyecek/yiyecek14.jpg",
            "images/yiyecek/yiyecek15.jpg", "images/yiyecek/yiyecek16.jpg",
            "images/yiyecek/yiyecek17.jpg", "images/yiyecek/yiyecek18.jpg",
            "images/yiyecek/yiyecek19.jpg", "images/yiyecek/yiyecek20.jpg"
        ],
        "Teknoloji": [
            "images/teknoloji/teknoloji01.jpg", "images/teknoloji/teknoloji02.jpg",
            "images/teknoloji/teknoloji03.jpg", "images/teknoloji/teknoloji04.jpg",
            "images/teknoloji/teknoloji05.jpg", "images/teknoloji/teknoloji06.jpg",
            "images/teknoloji/teknoloji07.jpg", "images/teknoloji/teknoloji08.jpg",
            "images/teknoloji/teknoloji09.jpg", "images/teknoloji/teknoloji10.jpg",
            "images/teknoloji/teknoloji11.jpg", "images/teknoloji/teknoloji12.jpg",
            "images/teknoloji/teknoloji13.jpg", "images/teknoloji/teknoloji14.jpg",
            "images/teknoloji/teknoloji15.jpg", "images/teknoloji/teknoloji16.jpg",
            "images/teknoloji/teknoloji17.jpg", "images/teknoloji/teknoloji18.jpg",
            "images/teknoloji/teknoloji19.jpg", "images/teknoloji/teknoloji20.jpg"
        ],
        "Spor": [
            "images/spor/spor01.jpg", "images/spor/spor02.jpg",
            "images/spor/spor03.jpg", "images/spor/spor04.jpg",
            "images/spor/spor05.jpg", "images/spor/spor06.jpg",
            "images/spor/spor07.jpg", "images/spor/spor08.jpg",
            "images/spor/spor09.jpg", "images/spor/spor10.jpg",
            "images/spor/spor11.jpg", "images/spor/spor12.jpg",
            "images/spor/spor13.jpg", "images/spor/spor14.jpg",
            "images/spor/spor15.jpg", "images/spor/spor16.jpg",
            "images/spor/spor17.jpg", "images/spor/spor18.jpg",
            "images/spor/spor19.jpg", "images/spor/spor20.jpg"
        ],
        "Sanat ve Kültür": [
            "images/sanat/sanat01.jpg", "images/sanat/sanat02.jpg",
            "images/sanat/sanat03.jpg", "images/sanat/sanat04.jpg",
            "images/sanat/sanat05.jpg", "images/sanat/sanat06.jpg",
            "images/sanat/sanat07.jpg", "images/sanat/sanat08.jpg",
            "images/sanat/sanat09.jpg", "images/sanat/sanat10.jpg",
            "images/sanat/sanat11.jpg", "images/sanat/sanat12.jpg",
            "images/sanat/sanat13.jpg", "images/sanat/sanat14.jpg",
            "images/sanat/sanat15.jpg", "images/sanat/sanat16.jpg",
            "images/sanat/sanat17.jpg", "images/sanat/sanat18.jpg",
            "images/sanat/sanat19.jpg", "images/sanat/sanat20.jpg"
        ],
        "Uzay ve Astronomi": [
            "images/uzay/uzay01.jpg", "images/uzay/uzay02.jpg",
            "images/uzay/uzay03.jpg", "images/uzay/uzay04.jpg",
            "images/uzay/uzay05.jpg", "images/uzay/uzay06.jpg",
            "images/uzay/uzay07.jpg", "images/uzay/uzay08.jpg",
            "images/uzay/uzay09.jpg", "images/uzay/uzay10.jpg",
            "images/uzay/uzay11.jpg", "images/uzay/uzay12.jpg",
            "images/uzay/uzay13.jpg", "images/uzay/uzay14.jpg",
            "images/uzay/uzay15.jpg", "images/uzay/uzay16.jpg",
            "images/uzay/uzay17.jpg", "images/uzay/uzay18.jpg",
            "images/uzay/uzay19.jpg", "images/uzay/uzay20.jpg"
        ],
        "Araçlar": [
            "images/araclar/araclar01.jpg", "images/araclar/araclar02.jpg",
            "images/araclar/araclar03.jpg", "images/araclar/araclar04.jpg",
            "images/araclar/araclar05.jpg", "images/araclar/araclar06.jpg",
            "images/araclar/araclar07.jpg", "images/araclar/araclar08.jpg",
            "images/araclar/araclar09.jpg", "images/araclar/araclar10.jpg",
            "images/araclar/araclar11.jpg", "images/araclar/araclar12.jpg",
            "images/araclar/araclar13.jpg", "images/araclar/araclar14.jpg",
            "images/araclar/araclar15.jpg", "images/araclar/araclar16.jpg",
            "images/araclar/araclar17.jpg", "images/araclar/araclar18.jpg",
            "images/araclar/araclar19.jpg", "images/araclar/araclar20.jpg"
        ],
        "Bitkiler ve Çiçekler": [
            "images/bitkiler/bitkiler01.jpg", "images/bitkiler/bitkiler02.jpg",
            "images/bitkiler/bitkiler03.jpg", "images/bitkiler/bitkiler04.jpg",
            "images/bitkiler/bitkiler05.jpg", "images/bitkiler/bitkiler06.jpg",
            "images/bitkiler/bitkiler07.jpg", "images/bitkiler/bitkiler08.jpg",
            "images/bitkiler/bitkiler09.jpg", "images/bitkiler/bitkiler10.jpg",
            "images/bitkiler/bitkiler11.jpg", "images/bitkiler/bitkiler12.jpg",
            "images/bitkiler/bitkiler13.jpg", "images/bitkiler/bitkiler14.jpg",
            "images/bitkiler/bitkiler15.jpg", "images/bitkiler/bitkiler16.jpg",
            "images/bitkiler/bitkiler17.jpg", "images/bitkiler/bitkiler18.jpg",
            "images/bitkiler/bitkiler19.jpg", "images/bitkiler/bitkiler20.jpg"
        ],
        "Deniz Yaşamı": [
            "images/deniz/deniz01.jpg", "images/deniz/deniz02.jpg",
            "images/deniz/deniz03.jpg", "images/deniz/deniz04.jpg",
            "images/deniz/deniz05.jpg", "images/deniz/deniz06.jpg",
            "images/deniz/deniz07.jpg", "images/deniz/deniz08.jpg",
            "images/deniz/deniz09.jpg", "images/deniz/deniz010.jpg",
            "images/deniz/deniz011.jpg", "images/deniz/deniz012.jpg",
            "images/deniz/deniz013.jpg", "images/deniz/deniz014.jpg",
            "images/deniz/deniz015.jpg", "images/deniz/deniz016.jpg",
            "images/deniz/deniz017.jpg", "images/deniz/deniz018.jpg",
            "images/deniz/deniz019.jpg", "images/deniz/deniz020.jpg"
        ],
        "Müzik": [
            "images/muzik/muzik01.jpg", "images/muzik/muzik02.jpg",
            "images/muzik/muzik03.jpg", "images/muzik/muzik04.jpg",
            "images/muzik/muzik05.jpg", "images/muzik/muzik06.jpg",
            "images/muzik/muzik07.jpg", "images/muzik/muzik08.jpg",
            "images/muzik/muzik09.jpg", "images/muzik/muzik10.jpg",
            "images/muzik/muzik11.jpg", "images/muzik/muzik12.jpg",
            "images/muzik/muzik13.jpg", "images/muzik/muzik14.jpg",
            "images/muzik/muzik15.jpg", "images/muzik/muzik16.jpg",
            "images/muzik/muzik17.jpg", "images/muzik/muzik18.jpg",
            "images/muzik/muzik19.jpg", "images/muzik/muzik20.jpg"
        ],
        "Moda": [
            "images/moda/moda01.jpg", "images/moda/moda02.jpg",
            "images/moda/moda03.jpg", "images/moda/moda04.jpg",
            "images/moda/moda05.jpg", "images/moda/moda06.jpg",
            "images/moda/moda07.jpg", "images/moda/moda08.jpg",
            "images/moda/moda09.jpg", "images/moda/moda10.jpg",
            "images/moda/moda11.jpg", "images/moda/moda12.jpg",
            "images/moda/moda13.jpg", "images/moda/moda14.jpg",
            "images/moda/moda15.jpg", "images/moda/moda16.jpg",
            "images/moda/moda17.jpg", "images/moda/moda18.jpg",
            "images/moda/moda19.jpg", "images/moda/moda20.jpg"
        ],
        "Hobiler": [
            "images/hobiler/hobiler01.jpg", "images/hobiler/hobiler02.jpg",
            "images/hobiler/hobiler03.jpg", "images/hobiler/hobiler04.jpg",
            "images/hobiler/hobiler05.jpg", "images/hobiler/hobiler06.jpg",
            "images/hobiler/hobiler07.jpg", "images/hobiler/hobiler08.jpg",
            "images/hobiler/hobiler09.jpg", "images/hobiler/hobiler10.jpg",
            "images/hobiler/hobiler11.jpg", "images/hobiler/hobiler12.jpg",
            "images/hobiler/hobiler13.jpg", "images/hobiler/hobiler14.jpg",
            "images/hobiler/hobiler15.jpg", "images/hobiler/hobiler16.jpg",
            "images/hobiler/hobiler17.jpg", "images/hobiler/hobiler18.jpg",
            "images/hobiler/hobiler19.jpg", "images/hobiler/hobiler20.jpg"
        ],
        "Seyahat": [
            "images/seyahat/seyahat01.jpg", "images/seyahat/seyahat02.jpg",
            "images/seyahat/seyahat03.jpg", "images/seyahat/seyahat04.jpg",
            "images/seyahat/seyahat05.jpg", "images/seyahat/seyahat06.jpg",
            "images/seyahat/seyahat07.jpg", "images/seyahat/seyahat08.jpg",
            "images/seyahat/seyahat09.jpg", "images/seyahat/seyahat10.jpg",
            "images/seyahat/seyahat11.jpg", "images/seyahat/seyahat12.jpg",
            "images/seyahat/seyahat13.jpg", "images/seyahat/seyahat14.jpg",
            "images/seyahat/seyahat15.jpg", "images/seyahat/seyahat16.jpg",
            "images/seyahat/seyahat17.jpg", "images/seyahat/seyahat18.jpg",
            "images/seyahat/seyahat19.jpg", "images/seyahat/seyahat20.jpg"
        ],
        "Tarih": [
            "images/tarih/tarih01.jpg", "images/tarih/tarih02.jpg",
            "images/tarih/tarih03.jpg", "images/tarih/tarih04.jpg",
            "images/tarih/tarih05.jpg", "images/tarih/tarih06.jpg",
            "images/tarih/tarih07.jpg", "images/tarih/tarih08.jpg",
            "images/tarih/tarih09.jpg", "images/tarih/tarih10.jpg",
            "images/tarih/tarih11.jpg", "images/tarih/tarih12.jpg",
            "images/tarih/tarih13.jpg", "images/tarih/tarih14.jpg",
            "images/tarih/tarih15.jpg", "images/tarih/tarih16.jpg",
            "images/tarih/tarih17.jpg", "images/tarih/tarih18.jpg",
            "images/tarih/tarih19.jpg", "images/tarih/tarih20.jpg"
        ],
        "Bilim": [
            "images/bilim/bilim01.jpg", "images/bilim/bilim02.jpg",
            "images/bilim/bilim03.jpg", "images/bilim/bilim04.jpg",
            "images/bilim/bilim05.jpg", "images/bilim/bilim06.jpg",
            "images/bilim/bilim07.jpg", "images/bilim/bilim08.jpg",
            "images/bilim/bilim09.jpg", "images/bilim/bilim10.jpg",
            "images/bilim/bilim11.jpg", "images/bilim/bilim12.jpg",
            "images/bilim/bilim13.jpg", "images/bilim/bilim14.jpg",
            "images/bilim/bilim15.jpg", "images/bilim/bilim16.jpg",
            "images/bilim/bilim17.jpg", "images/bilim/bilim18.jpg",
            "images/bilim/bilim19.jpg", "images/bilim/bilim20.jpg"
        ],
        "Kişiler ve Portreler": [
            "images/kisiler/kisiler01.jpg", "images/kisiler/kisiler02.jpg",
            "images/kisiler/kisiler03.jpg", "images/kisiler/kisiler04.jpg",
            "images/kisiler/kisiler05.jpg", "images/kisiler/kisiler06.jpg",
            "images/kisiler/kisiler07.jpg", "images/kisiler/kisiler08.jpg",
            "images/kisiler/kisiler09.jpg", "images/kisiler/kisiler10.jpg",
            "images/kisiler/kisiler11.jpg", "images/kisiler/kisiler12.jpg",
            "images/kisiler/kisiler13.jpg", "images/kisiler/kisiler14.jpg",
            "images/kisiler/kisiler15.jpg", "images/kisiler/kisiler16.jpg",
            "images/kisiler/kisiler17.jpg", "images/kisiler/kisiler18.jpg",
            "images/kisiler/kisiler19.jpg", "images/kisiler/kisiler20.jpg"
        ],
        "Kış Manzaraları": [
            "images/kismanzaralari/kismanzaralari01.jpg", "images/kismanzaralari/kismanzaralari02.jpg",
            "images/kismanzaralari/kismanzaralari03.jpg", "images/kismanzaralari/kismanzaralari04.jpg",
            "images/kismanzaralari/kismanzaralari05.jpg", "images/kismanzaralari/kismanzaralari06.jpg",
            "images/kismanzaralari/kismanzaralari07.jpg", "images/kismanzaralari/kismanzaralari08.jpg",
            "images/kismanzaralari/kismanzaralari09.jpg", "images/kismanzaralari/kismanzaralari10.jpg",
            "images/kismanzaralari/kismanzaralari11.jpg", "images/kismanzaralari/kismanzaralari12.jpg",
            "images/kismanzaralari/kismanzaralari13.jpg", "images/kismanzaralari/kismanzaralari14.jpg",
            "images/kismanzaralari/kismanzaralari15.jpg", "images/kismanzaralari/kismanzaralari16.jpg",
            "images/kismanzaralari/kismanzaralari17.jpg", "images/kismanzaralari/kismanzaralari18.jpg",
            "images/kismanzaralari/kismanzaralari19.jpg", "images/kismanzaralari/kismanzaralari20.jpg"
        ],
        "Fantastik ve Hayali": [
            "images/fantastik/fantastik01.jpg", "images/fantastik/fantastik02.jpg",
            "images/fantastik/fantastik03.jpg", "images/fantastik/fantastik04.jpg",
            "images/fantastik/fantastik05.jpg", "images/fantastik/fantastik06.jpg",
            "images/fantastik/fantastik07.jpg", "images/fantastik/fantastik08.jpg",
            "images/fantastik/fantastik09.jpg", "images/fantastik/fantastik10.jpg",
            "images/fantastik/fantastik11.jpg", "images/fantastik/fantastik12.jpg",
            "images/fantastik/fantastik13.jpg", "images/fantastik/fantastik14.jpg",
            "images/fantastik/fantastik15.jpg", "images/fantastik/fantastik16.jpg",
            "images/fantastik/fantastik17.jpg", "images/fantastik/fantastik18.jpg",
            "images/fantastik/fantastik19.jpg", "images/fantastik/fantastik20.jpg"
        ],
        "Oyuncaklar": [
            "images/oyuncaklar/oyuncaklar01.jpg", "images/oyuncaklar/oyuncaklar02.jpg",
            "images/oyuncaklar/oyuncaklar03.jpg", "images/oyuncaklar/oyuncaklar04.jpg",
            "images/oyuncaklar/oyuncaklar05.jpg", "images/oyuncaklar/oyuncaklar06.jpg",
            "images/oyuncaklar/oyuncaklar07.jpg", "images/oyuncaklar/oyuncaklar08.jpg",
            "images/oyuncaklar/oyuncaklar09.jpg", "images/oyuncaklar/oyuncaklar10.jpg",
            "images/oyuncaklar/oyuncaklar11.jpg", "images/oyuncaklar/oyuncaklar12.jpg",
            "images/oyuncaklar/oyuncaklar13.jpg", "images/oyuncaklar/oyuncaklar14.jpg",
            "images/oyuncaklar/oyuncaklar15.jpg", "images/oyuncaklar/oyuncaklar16.jpg",
            "images/oyuncaklar/oyuncaklar17.jpg", "images/oyuncaklar/oyuncaklar18.jpg",
            "images/oyuncaklar/oyuncaklar19.jpg", "images/oyuncaklar/oyuncaklar20.jpg"
        ],
        "Çizgi Filmler": [
            "images/cizgifilmler/cizgifilmler01.jpg", "images/cizgifilmler/cizgifilmler02.jpg",
            "images/cizgifilmler/cizgifilmler03.jpg", "images/cizgifilmler/cizgifilmler04.jpg",
            "images/cizgifilmler/cizgifilmler05.jpg", "images/cizgifilmler/cizgifilmler06.jpg",
            "images/cizgifilmler/cizgifilmler07.jpg", "images/cizgifilmler/cizgifilmler08.jpg",
            "images/cizgifilmler/cizgifilmler09.jpg", "images/cizgifilmler/cizgifilmler10.jpg",
            "images/cizgifilmler/cizgifilmler11.jpg", "images/cizgifilmler/cizgifilmler12.jpg",
            "images/cizgifilmler/cizgifilmler13.jpg", "images/cizgifilmler/cizgifilmler14.jpg",
            "images/cizgifilmler/cizgifilmler15.jpg", "images/cizgifilmler/cizgifilmler16.jpg",
            "images/cizgifilmler/cizgifilmler17.jpg", "images/cizgifilmler/cizgifilmler18.jpg",
            "images/cizgifilmler/cizgifilmler19.jpg", "images/cizgifilmler/cizgifilmler20.jpg"
        ],
        "Oyunlar": [
            "images/oyunlar/oyunlar01.jpg", "images/oyunlar/oyunlar02.jpg",
            "images/oyunlar/oyunlar03.jpg", "images/oyunlar/oyunlar04.jpg",
            "images/oyunlar/oyunlar05.jpg", "images/oyunlar/oyunlar06.jpg",
            "images/oyunlar/oyunlar07.jpg", "images/oyunlar/oyunlar08.jpg",
            "images/oyunlar/oyunlar09.jpg", "images/oyunlar/oyunlar10.jpg",
            "images/oyunlar/oyunlar11.jpg", "images/oyunlar/oyunlar12.jpg",
            "images/oyunlar/oyunlar13.jpg", "images/oyunlar/oyunlar14.jpg",
            "images/oyunlar/oyunlar15.jpg", "images/oyunlar/oyunlar16.jpg",
            "images/oyunlar/oyunlar17.jpg", "images/oyunlar/oyunlar18.jpg",
            "images/oyunlar/oyunlar19.jpg", "images/oyunlar/oyunlar20.jpg"
        ],
        "Meyveler ve Sebzeler": [
            "images/meyvesebze/meyvesebze01.jpg", "images/meyvesebze/meyvesebze02.jpg",
            "images/meyvesebze/meyvesebze03.jpg", "images/meyvesebze/meyvesebze04.jpg",
            "images/meyvesebze/meyvesebze05.jpg", "images/meyvesebze/meyvesebze06.jpg",
            "images/meyvesebze/meyvesebze07.jpg", "images/meyvesebze/meyvesebze08.jpg",
            "images/meyvesebze/meyvesebze09.jpg", "images/meyvesebze/meyvesebze10.jpg",
            "images/meyvesebze/meyvesebze11.jpg", "images/meyvesebze/meyvesebze12.jpg",
            "images/meyvesebze/meyvesebze13.jpg", "images/meyvesebze/meyvesebze14.jpg",
            "images/meyvesebze/meyvesebze15.jpg", "images/meyvesebze/meyvesebze16.jpg",
            "images/meyvesebze/meyvesebze17.jpg", "images/meyvesebze/meyvesebze18.jpg",
            "images/meyvesebze/meyvesebze19.jpg", "images/meyvesebze/meyvesebze20.jpg"
        ],
        "Masallar": [
            "images/masallar/masallar01.jpg", "images/masallar/masallar02.jpg",
            "images/masallar/masallar03.jpg", "images/masallar/masallar04.jpg",
            "images/masallar/masallar05.jpg", "images/masallar/masallar06.jpg",
            "images/masallar/masallar07.jpg", "images/masallar/masallar08.jpg",
            "images/masallar/masallar09.jpg", "images/masallar/masallar10.jpg",
            "images/masallar/masallar11.jpg", "images/masallar/masallar12.jpg",
            "images/masallar/masallar13.jpg", "images/masallar/masallar14.jpg",
            "images/masallar/masallar15.jpg", "images/masallar/masallar16.jpg",
            "images/masallar/masallar17.jpg", "images/masallar/masallar18.jpg",
            "images/masallar/masallar19.jpg", "images/masallar/masallar20.jpg"
        ],
        "Meslekler": [
            "images/meslekler/meslekler01.jpg", "images/meslekler/meslekler02.jpg",
            "images/meslekler/meslekler03.jpg", "images/meslekler/meslekler04.jpg",
            "images/meslekler/meslekler05.jpg", "images/meslekler/meslekler06.jpg",
            "images/meslekler/meslekler07.jpg", "images/meslekler/meslekler08.jpg",
            "images/meslekler/meslekler09.jpg", "images/meslekler/meslekler10.jpg",
            "images/meslekler/meslekler11.jpg", "images/meslekler/meslekler12.jpg",
            "images/meslekler/meslekler13.jpg", "images/meslekler/meslekler14.jpg",
            "images/meslekler/meslekler15.jpg", "images/meslekler/meslekler16.jpg",
            "images/meslekler/meslekler17.jpg", "images/meslekler/meslekler18.jpg",
            "images/meslekler/meslekler19.jpg", "images/meslekler/meslekler20.jpg"
        ]
    };

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

    function updateStartButtonState() {
        if (selectedCols && selectedRows && selectedCategory) {
            startGameButton.disabled = false;
        } else {
            startGameButton.disabled = true;
        }
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

    function resetGame() {
        stopTimer();
        if (confettiInstance) {
            confettiInstance.clear();
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

        const existingPieces = gameBoard.querySelectorAll('.puzzle-piece');
        existingPieces.forEach(piece => piece.remove());

        gameBoard.style.gap = '2px';
        gameBoard.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        gameBoard.classList.remove('solved-effect');

        selectedCols = null;
        selectedRows = null;
        selectedCategory = null;
        selectedImage = null;
        puzzlePieces = [];

        document.querySelectorAll('.piece-button').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('selected'));
        updateStartButtonState();
    }


    // --- Olay Dinleyicileri ---
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
        winScreen.style.display = 'none';
        gameBoard.style.display = 'grid';
        gameControls.style.display = 'flex';
        
        timerDisplay.textContent = '00:00';
        hintButton.disabled = false;
        hintUsed = false;
        if (confettiInstance) {
            confettiInstance.clear();
            confettiInstance = null;
        }

        const existingPieces = gameBoard.querySelectorAll('.puzzle-piece');
        existingPieces.forEach(piece => piece.remove());

        gameBoard.style.gap = '2px';
        gameBoard.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        gameBoard.classList.remove('solved-effect');

        createPuzzle(selectedImage, selectedCols, selectedRows);
        startTimer();
        playSound('piecePlace');
    });

    mainMenuButton.addEventListener('click', resetGame);
    mainMenuFromGameButton.addEventListener('click', resetGame);

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

    // --- Puzzle Oluşturma Fonksiyonu (Sabit Oyun Alanı) ---
    async function createPuzzle(imageUrl, cols, rows) {
        gameBoard.innerHTML = '';
        puzzlePieces = [];

        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = "Anonymous";

        await new Promise(resolve => img.onload = resolve);

        const boardComputedStyle = getComputedStyle(gameBoard);
        const boardWidth = parseFloat(boardComputedStyle.width);
        const boardHeight = parseFloat(boardComputedStyle.height);

        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        const pieceWidthOriginal = img.width / cols;
        const pieceHeightOriginal = img.height / rows;

        const totalPieces = cols * rows;

        for (let i = 0; i < totalPieces; i++) {
            const pieceDiv = document.createElement('div');
            pieceDiv.classList.add('puzzle-piece');
            pieceDiv.setAttribute('draggable', 'true'); // Fare için draggable özelliği
            pieceDiv.dataset.originalIndex = i;

            const row = Math.floor(i / cols);
            const col = i % cols;

            const canvas = document.createElement('canvas');
            canvas.width = pieceWidthOriginal;
            canvas.height = pieceHeightOriginal;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img,
                col * pieceWidthOriginal, row * pieceHeightOriginal,
                pieceWidthOriginal, pieceHeightOriginal,
                0, 0,
                pieceWidthOriginal, pieceHeightOriginal
            );

            const pieceImage = document.createElement('img');
            pieceImage.src = canvas.toDataURL();
            pieceImage.alt = `Puzzle Piece ${i}`;
            pieceDiv.appendChild(pieceImage);

            puzzlePieces.push(pieceDiv);
        }

        shuffleArray(puzzlePieces);

        puzzlePieces.forEach(piece => gameBoard.appendChild(piece));

        addDragDropListeners(); // Fare için sürükle-bırak olaylarını ekle
        addTouchListeners();   // Dokunmatik için olayları ekle
    }

    // Diziyi karıştıran yardımcı fonksiyon (Fisher-Yates shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- FARE SÜRÜKLE-BIRAK İŞLEVSELLİĞİ ---
    let draggedItem = null; // Sürüklenen orijinal element

    function addDragDropListeners() {
        // gameBoard içinde oluştukları için tekrar seçilmesi lazım
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

    function dragStart(e) {
        draggedItem = this;
        // Fare sürüklemesinde orijinali şeffaf yapma
        setTimeout(() => this.style.opacity = '0.5', 0); 
        playSound('pieceMove');
    }

    function dragEnd() {
        this.style.opacity = '1'; // Orijinali tekrar görünür yap
        document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('drag-over'));
        checkWinCondition();
    }

    function dragOver(e) {
        e.preventDefault(); // Drop olayının gerçekleşmesi için bu gerekli
    }

    function dragEnter(e) {
        e.preventDefault();
        this.classList.add('drag-over'); // Sürüklenen elementin üzerine gelindiğinde görsel geri bildirim
    }

    function dragLeave() {
        this.classList.remove('drag-over');
    }

    function dragDrop() {
        this.classList.remove('drag-over');
        if (draggedItem && draggedItem !== this) {
            const parent = gameBoard;
            // İki elementi DOM içinde takas etme mantığı (Fare sürüklemesi için)
            // Bu takas mantığı en basit ve güvenilir olanıdır.
            const target = this; // Bırakılan hedef
            const dragged = draggedItem; // Sürüklenen eleman

            const temp = document.createElement('div'); // Geçici bir yer tutucu oluştur
            parent.insertBefore(temp, target); // Hedefin yerine geçiciyi koy

            parent.insertBefore(target, dragged); // Hedefi sürüklenenin orijinal yerine (veya yeni yerine) taşı
            parent.insertBefore(dragged, temp); // Sürükleneni geçicinin yerine taşı (hedefin eski yeri)
            
            temp.remove(); // Geçici yer tutucuyu kaldır

            playSound('piecePlace');
        }
    }

    // --- MOBİL DOKUNMATİK İŞLEVSELLİĞİ (KLONLAMA YÖNTEMİ) ---
    let currentTouchPiece = null; // Dokunulan orijinal puzzle parçası
    let touchPieceClone = null;   // Parmağın hareket ettiği klon puzzle parçası
    let cloneOffsetX = 0;         // Parmağın klona göre x offset'i
    let cloneOffsetY = 0;         // Parmağın klona göre y offset'i

    function addTouchListeners() {
        const pieces = gameBoard.querySelectorAll('.puzzle-piece'); 
        pieces.forEach(piece => {
            piece.addEventListener('touchstart', touchStart);
            piece.addEventListener('touchmove', touchMove);
            piece.addEventListener('touchend', touchEnd);
            piece.addEventListener('touchcancel', touchEnd); // Dokunma kesildiğinde temizlik için
        });
    }

    function touchStart(e) {
        if (e.touches.length !== 1) return; // Sadece tek parmak dokunuşunu dinle
        e.preventDefault(); // Tarayıcının varsayılan kaydırma/yakınlaştırma davranışını engelle

        currentTouchPiece = this; // Dokunulan orijinal puzzle parçası
        currentTouchPiece.style.opacity = '0.4'; // Orijinal parçayı şeffaf yap
        currentTouchPiece.style.pointerEvents = 'none'; // Orijinal parçanın olayları yakalamasını engelle (hedef tespiti için)

        // Klon puzzle parçasını oluştur ve stilini ayarla
        touchPieceClone = currentTouchPiece.cloneNode(true);
        Object.assign(touchPieceClone.style, {
            position: 'fixed', // Ekranın viewport'una göre sabit konumlandırma
            zIndex: '1001',    // En üstte görünmesini sağla
            opacity: '1',      // Klonun tamamen görünür olmasını sağla
            pointerEvents: 'none', // Klonun kendisinin dokunma olaylarını yakalamasını engelle
            // Klonun boyutunu orijinal parça ile aynı yap
            width: currentTouchPiece.offsetWidth + 'px', 
            height: currentTouchPiece.offsetHeight + 'px',
            // Orijinal parçanın CSS'indeki diğer görsellikleri klona aktar
            borderRadius: getComputedStyle(currentTouchPiece).borderRadius,
            boxShadow: getComputedStyle(currentTouchPiece).boxShadow,
            border: getComputedStyle(currentTouchPiece).border,
            backgroundColor: getComputedStyle(currentTouchPiece).backgroundColor,
            display: 'flex', // İçindeki img elementinin tam sığması için
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'scale(1.05)' // Hafif bir "kalkma" efekti için
        });
        
        // Klonun içindeki img elementinin de boyutunu ayarlayalım
        const imgInClone = touchPieceClone.querySelector('img');
        if (imgInClone) {
            Object.assign(imgInClone.style, {
                width: '100%',
                height: '100%',
                objectFit: 'fill'
            });
        }

        document.body.appendChild(touchPieceClone); // Klonu body'ye ekle

        const touch = e.touches[0]; // İlk dokunma noktası
        const rect = currentTouchPiece.getBoundingClientRect(); // Orijinal parçanın ekran koordinatları

        // Parmak ucunun klonun sol üst köşesine göre offset'ini hesapla
        cloneOffsetX = touch.clientX - rect.left;
        cloneOffsetY = touch.clientY - rect.top;

        // Klonu parmak pozisyonuna göre konumlandır
        touchPieceClone.style.left = `${touch.clientX - cloneOffsetX}px`;
        touchPieceClone.style.top = `${touch.clientY - cloneOffsetY}px`;

        playSound('pieceMove');
    }

    function touchMove(e) {
        if (!touchPieceClone || !currentTouchPiece || e.touches.length !== 1) return;
        e.preventDefault();

        const touch = e.touches[0];
        // Klonu parmak pozisyonuna göre güncelle
        touchPieceClone.style.left = `${touch.clientX - cloneOffsetX}px`;
        touchPieceClone.style.top = `${touch.clientY - cloneOffsetY}px`;
    }

    function touchEnd(e) {
        if (!currentTouchPiece || !touchPieceClone) return;

        e.preventDefault(); // Varsayılan tıklama/seçme davranışını engelle

        touchPieceClone.remove(); // Klonu DOM'dan kaldır
        touchPieceClone = null; // Klon referansını sıfırla

        currentTouchPiece.style.opacity = '1'; // Orijinal parçayı tekrar tamamen görünür yap
        currentTouchPiece.style.pointerEvents = 'auto'; // Orijinal parçanın olay yakalamasını tekrar etkinleştir
        
        const touch = e.changedTouches[0];
        
        // Bırakılan noktadaki hedef elementi bulmak için:
        // Orijinal parçayı geçici olarak gizleyerek elementFromPoint'in onu görmesini engelle.
        const originalDisplay = currentTouchPiece.style.display;
        const originalVisibility = currentTouchPiece.style.visibility; 
        currentTouchPiece.style.display = 'none'; // DOM'dan geçici olarak kaldırılıyor gibi davran
        currentTouchPiece.style.visibility = 'hidden'; // Ekstra güvenlik için gizle
        
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Orijinal parçayı eski haline getir
        currentTouchPiece.style.display = originalDisplay;
        currentTouchPiece.style.visibility = originalVisibility;

        let targetPiece = null;
        // Eğer bulunan element bir puzzle parçasıysa ve kendi parçamız değilse, onu hedef olarak al
        if (targetElement && targetElement.classList.contains('puzzle-piece') && targetElement !== currentTouchPiece) {
            targetPiece = targetElement;
        }

        if (targetPiece) {
            // İki puzzle parçasının DOM'daki yerini güvenli bir şekilde değiştirme
            const parent = gameBoard; // gameBoard, tüm puzzle parçalarının ebeveyni
            
            const temp = document.createElement('div'); // Geçici bir yer tutucu oluştur
            
            // Elemanları takas etme mantığı:
            // 1. Hedef parçanın hemen önüne geçici bir yer tutucu koy
            parent.insertBefore(temp, targetPiece); 
            
            // 2. Sürüklenen parçayı, hedef parçanın yerine koy
            parent.insertBefore(targetPiece, currentTouchPiece); 
            
            // 3. Hedef parçanın eski yerine sürüklenen parçayı koy (yani temp'in yerine)
            parent.insertBefore(currentTouchPiece, temp); 
            
            temp.remove(); // Geçici yer tutucuyu kaldır

            playSound('piecePlace');
        } 
        // Eğer hedef bulunamazsa veya hedef kendi parçamızsa, parça otomatik olarak orijinal yerinde kalır.
        
        currentTouchPiece = null; // Sürükleme durumu sıfırla
        checkWinCondition(); // Kazanma koşulunu kontrol et
    }


    async function showHint() {
        const tempImage = new Image();
        tempImage.src = selectedImage;
        tempImage.crossOrigin = "Anonymous";

        await new Promise(resolve => tempImage.onload = resolve);

        const hintOverlay = document.createElement('div');
        hintOverlay.style.position = 'fixed';
        hintOverlay.style.top = '0';
        hintOverlay.style.left = '0';
        hintOverlay.style.width = '100%';
        hintOverlay.style.height = '100%';
        hintOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        hintOverlay.style.zIndex = '2000';
        hintOverlay.style.display = 'flex';
        hintOverlay.style.justifyContent = 'center';
        hintOverlay.style.alignItems = 'center';
        hintOverlay.style.opacity = '0';
        hintOverlay.style.transition = 'opacity 0.5s ease-in-out';

        const hintImg = document.createElement('img');
        hintImg.src = selectedImage;
        hintImg.style.maxWidth = '90%';
        hintImg.style.maxHeight = '90%';
        hintImg.style.objectFit = 'contain';
        hintImg.style.borderRadius = '10px';
        hintImg.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
        
        hintOverlay.appendChild(hintImg);
        document.body.appendChild(hintOverlay);

        setTimeout(() => {
            hintOverlay.style.opacity = '1';
        }, 50);

        setTimeout(() => {
            hintOverlay.style.opacity = '0';
            hintOverlay.addEventListener('transitionend', () => {
                hintOverlay.remove();
            }, { once: true });
        }, 3000);
    }


    // --- Kazanma Koşulu Kontrolü ---
    function checkWinCondition() {
        const currentOrderDOM = Array.from(gameBoard.children).filter(el => el.classList.contains('puzzle-piece'));
        let isSolved = true;

        // --- HATA AYIKLAMA ÇIKTILARI (GEREKİRSE YORUM SATIRINI KALDIRIN) ---
        // console.log("--- checkWinCondition çağrıldı ---");
        // console.log("Oyun tahtasındaki parçaların mevcut sırası (originalIndex):");
        // currentOrderDOM.forEach((piece, index) => {
        //     console.log(`DOM Sırası: ${index}, OriginalIndex: ${parseInt(piece.dataset.originalIndex)}`);
        // });
        // --- HATA AYIKLAMA SONU ---

        for (let i = 0; i < currentOrderDOM.length; i++) {
            if (parseInt(currentOrderDOM[i].dataset.originalIndex) !== i) {
                isSolved = false;
                // console.log(`Yanlış yerleşim tespit edildi: DOM Sırası ${i} -> Beklenen OriginalIndex ${i}, Gerçek OriginalIndex ${currentOrderDOM[i].dataset.originalIndex}`);
                break;
            }
        }

        // console.log("isSolved durumu: " + isSolved);

        if (isSolved) {
            stopTimer();
            playSound('win');

            const confettiCanvas = document.createElement('canvas');
            confettiCanvas.id = 'confetti-canvas';
            confettiCanvas.style.position = 'fixed';
            confettiCanvas.style.top = '0';
            confettiCanvas.style.left = '0';
            confettiCanvas.style.width = '100%';
            confettiCanvas.style.height = '100%';
            confettiCanvas.style.zIndex = '9999';
            document.body.appendChild(confettiCanvas);

            const confettiSettings = { 
                target: 'confetti-canvas',
                max: 80, 
                size: 1, 
                animate: true, 
                props: ['circle', 'triangle', 'square', 'line'], 
                colors: [[165,104,246],[230,61,135],[0,199,228],[253,214,126]], 
                clock: 25, 
                start_from_zero: false, 
                decay: 0.9, 
                width: window.innerWidth, 
                height: window.innerHeight 
            };
            confettiInstance = new ConfettiGenerator(confettiSettings);
            confettiInstance.render();

            alert('Tebrikler! Yapbozu tamamladınız!');

            const sortedPieces = Array.from(gameBoard.children).filter(el => el.classList.contains('puzzle-piece'))
                                 .sort((a, b) => parseInt(a.dataset.originalIndex) - parseInt(b.dataset.originalIndex));
            
            gameBoard.innerHTML = '';
            sortedPieces.forEach(piece => {
                piece.style.opacity = '1';
                gameBoard.appendChild(piece);
            });

            gameBoard.style.gap = '0px'; 
            gameBoard.style.borderColor = 'transparent';
            gameBoard.classList.add('solved-effect');

            setTimeout(() => {
                gameBoard.classList.remove('solved-effect');
                gameBoard.style.gap = '2px';
                gameBoard.style.borderColor = 'rgba(255, 255, 255, 0.5)';

                const finalTime = timerDisplay.textContent;
                finalTimeDisplay.textContent = `Tamamlama Süreniz: ${finalTime}`;

                gameBoard.style.display = 'none';
                gameControls.style.display = 'none';
                winScreen.style.display = 'block';
                
                if (confettiInstance) {
                    confettiInstance.clear();
                    confettiCanvas.remove();
                    confettiInstance = null;
                }

            }, 5000);
        }
    }

    loadCategories();
});
