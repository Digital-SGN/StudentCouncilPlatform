let globalAudio = null;
let isMusicPlaying = false;

window.initGlobalMusic = function () {
    if (!globalAudio) {
        globalAudio = new Audio('/music/background.mp3');
        globalAudio.loop = true;

        const savedState = localStorage.getItem('musicEnabled');

        if (savedState === 'true') {
            const playPromise = globalAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    isMusicPlaying = true;
                    updateMusicButton();
                }).catch(e => {
                    console.log('Автовоспроизведение заблокировано:', e);
                    isMusicPlaying = false;
                    updateMusicButton();
                });
            }
        } else {
            isMusicPlaying = false;
            updateMusicButton();
        }
    }
};

window.toggleGlobalMusic = function () {
    if (!globalAudio) {
        initGlobalMusic();
    }

    if (isMusicPlaying) {
        globalAudio.pause();
        isMusicPlaying = false;
        localStorage.setItem('musicEnabled', 'false');
    } else {
        globalAudio.play().catch(e => {
            console.log('Не удалось воспроизвести:', e);
        });
        isMusicPlaying = true;
        localStorage.setItem('musicEnabled', 'true');
    }
    updateMusicButton();
};

function updateMusicButton() {
    const btn = document.getElementById('global-music-btn');
    if (btn) {
        btn.textContent = isMusicPlaying ? '🔊' : '🔇';
    }
}

window.addEventListener('load', () => {
    initGlobalMusic();
    updateMusicButton();  
});

window.updateMusicButton = updateMusicButton;