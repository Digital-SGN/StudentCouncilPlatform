let globalAudio = null;
let isMusicPlaying = false;

export function initGlobalMusic() {
    if (!globalAudio) {
        globalAudio = new Audio('/music/background.mp3');
        globalAudio.loop = true;
        
        const savedState = localStorage.getItem('musicEnabled');
        if (savedState === 'true') {
            globalAudio.play().catch(e => console.log('Автовоспроизведение заблокировано'));
            isMusicPlaying = true;
        }
    }
    updateMusicButton();
}

export function toggleGlobalMusic() {
    if (!globalAudio) {
        initGlobalMusic();
    }
    
    if (isMusicPlaying) {
        globalAudio.pause();
        isMusicPlaying = false;
        localStorage.setItem('musicEnabled', 'false');
    } else {
        globalAudio.play().catch(e => console.log('Не удалось воспроизвести:', e));
        isMusicPlaying = true;
        localStorage.setItem('musicEnabled', 'true');
    }
    updateMusicButton();
}

function updateMusicButton() {
    const btn = document.getElementById('global-music-btn');
    if (btn) {
        btn.textContent = isMusicPlaying ? '🔊' : '🔇';
    }
}

window.toggleGlobalMusic = toggleGlobalMusic;