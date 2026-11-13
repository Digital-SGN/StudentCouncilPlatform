import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faWater, faTree, faShoePrints, faPersonSwimming, 
    faStar, faGem, faCrown, faFish, faClock, 
    faRotateRight, faDesktop, faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import Bubbles from '../components/Bubbles';
import '../css/FishingGamePage.css';

const LOCATIONS = [
    { id: 'river', name: 'Яуза', icon: faWater, bg: '/game-assets/river.png', x: 5, y: 45, music: 'river' },
    { id: 'pond', name: 'Измайлово', icon: faTree, bg: '/game-assets/pond.png', x: 70, y: 20, music: 'pond' },
    { id: 'marina', name: 'Лужа на районе', icon: faShoePrints, bg: '/game-assets/marina.png', x: 76, y: 68, music: 'marina' },
    { id: 'pool', name: 'Бассейн СК', icon: faPersonSwimming, bg: '/game-assets/pool.png', x: 20, y: 20, music: 'pool' },
];

const PREDICTIONS = {
    common: [
        'Сегодня тебя ждёт неожиданная пятёрка', 
        'Кто-то из группы вспомнит о тебе добрым словом', 
        'Кофе в автомате сегодня будет вкуснее обычного', 
        'Найдёшь забытую наличку в кармане куртки', 
        'Лекция закончится раньше, чем ты думаешь', 
        'Тебе улыбнётся незнакомец — это знак'
    ],
    rare: [
        'На этой неделе тебя ждёт приятный сюрприз от друга', 
        'Твой проект выстрелит лучше, чем ты ожидаешь', 
        'Ты наконец-то выспишься. Правда-правда', 
        'Встретишь человека, который изменит твои планы'
    ],
    epic: [
        'Этим летом случится то, о чём ты будешь рассказывать годами',
        'Ты найдёшь своё призвание там, где совсем не искал', 
        'Судьба уже готовит тебе большую встречу', 
        'Твоя идея изменит что-то вокруг. Не откладывай её'
    ],
};

const RARITY_CONFIG = {
    common: { hits: 2, zoneSize: 15, cursorSpeed: 1.1, followRadius: 40, followSpeed: 2, label: 'Обычное', fishIcon: faStar },
    rare:   { hits: 3, zoneSize: 14, cursorSpeed: 1.2, followRadius: 38, followSpeed: 2.5, label: 'Редкое', fishIcon: faGem },
    epic:   { hits: 4, zoneSize: 13, cursorSpeed: 1.3, followRadius: 34, followSpeed: 2.7, label: 'Эпическое', fishIcon: faCrown },
};

const RARITY_CHANCES = { common: 0.5, rare: 0.35, epic: 0.15 };
const GAME_DURATION_SEC = 90;

export default function FishingGamePage() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const gameApi = useRef({});
    
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
            const isSmallScreen = window.innerWidth <= 768;
            setIsMobile(isTouchDevice || isSmallScreen);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) return;

        const container = containerRef.current;
        if (!container) return;

        const $ = (sel) => container.querySelector(sel);
        const $$ = (sel) => container.querySelectorAll(sel);
        const rand = (min, max) => Math.random() * (max - min) + min;
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        const SFX = { 
            click: '/game-assets/click.mp3', 
            cast: '/game-assets/cast.mp3', 
            bite: '/game-assets/bite.mp3', 
            hit: '/game-assets/hit.mp3', 
            miss: '/game-assets/miss.mp3',
            success: '/game-assets/success.mp3', 
            fail: '/game-assets/fail.mp3', 
            rarity_common: '/game-assets/rarity_common.mp3', 
            rarity_rare: '/game-assets/rarity_rare.mp3', 
            rarity_epic: '/game-assets/rarity_epic.mp3' 
        };
        
        const MUSIC = { 
            map: '/game-assets/music_map.mp3', 
            location: '/game-assets/music_location.mp3', 
            river: '/game-assets/music_river.mp3', 
            pond: '/game-assets/music_pond.mp3', 
            marina: '/game-assets/music_marina.mp3', 
            pool: '/game-assets/music_pool.mp3' 
        };
        
        let unlocked = false; 
        let mutedState = false;
        let pendingMusic = null; 
        let currentMusic = null; 
        let currentTrack = null;
        
        const cache = {};
        Object.entries(SFX).forEach(([key, src]) => { 
            const a = new Audio(src); a.preload = 'auto'; cache[key] = a; 
        });

        const unlockAudio = () => { 
            if (unlocked) return; 
            unlocked = true; 
            if (pendingMusic) { 
                const t = pendingMusic; 
                pendingMusic = null; 
                _playMusic(t); 
            } 
        };
        
        window.addEventListener('pointerdown', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });

        const playSfx = (name) => { 
            if (mutedState) return; const base = cache[name]; if (!base) return; const node = base.cloneNode(); node.volume = 0.7; node.play().catch(() => {}); 
        };

        const fade = (audio, target, duration, onDone) => { 
            if (!audio) { onDone && onDone(); return; } 
            const start = audio.volume; 
            const t0 = performance.now(); 
            const step = (now) => { 
                const k = Math.min((now - t0) / duration, 1); 
                audio.volume = Math.max(0, Math.min(1, start + (target - start) * k)); 
                if (k < 1) requestAnimationFrame(step); 
                else onDone && onDone(); 
            }; 
            requestAnimationFrame(step); 
        };

        const _playMusic = (trackName) => { 
            if (mutedState) return; 
            const src = MUSIC[trackName] || MUSIC.location; 
            if (currentTrack === trackName && currentMusic && !currentMusic.paused) return; 
            const next = new Audio(src); 
            next.loop = true; 
            next.volume = 0; 
            next.play().catch(() => {}); 
            const prev = currentMusic; 
            if (prev) { 
                fade(prev, 0, 900, () => { prev.pause(); prev.src = ''; }); 
            } 
            fade(next, 0.35, 900); 
            currentMusic = next; 
            currentTrack = trackName; 
        };

        const playMusic = (track) => { 
            if (!unlocked) { 
                pendingMusic = track; 
                return; 
            } 
            _playMusic(track); 
        };

        const Sound = { 
            click: () => playSfx('click'), cast: () => playSfx('cast'), bite: () => playSfx('bite'), hit: () => playSfx('hit'), miss: () => playSfx('miss'), fail: () => playSfx('fail'), success: () => playSfx('success'), rarity: (lvl) => playSfx('rarity_' + lvl), music: playMusic 
        };

        const state = { screen: 'MAP', location: null, rarity: null, hitsLeft: 0 };
        let timeLeft = GAME_DURATION_SEC;
        let timerInterval = null;
        let timerStarted = false;
        let timingRAF = null, timingPos = 0, timingDir = 1, timingZoneStart = 0, timingZoneSize = 0, lastTimingTime = 0;
        let followRAF = null, followState = null;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const rollRarity = () => { const r = Math.random(); let acc = 0; for (const [key, chance] of Object.entries(RARITY_CHANCES)) { acc += chance; if (r <= acc) return key; } return 'common'; };

        const updateTimerDisplay = () => {
            const el = $('#timerValue'); if (!el) return; el.textContent = timeLeft;
            const wrap = el.closest('.top-bar-timer'); if (wrap) wrap.classList.toggle('low', timeLeft <= 15);
            const fill = $('#timerFill'); if (fill) fill.style.width = (timeLeft / GAME_DURATION_SEC) * 100 + '%';
        };

        const resetGlobalTimer = () => { if (timerInterval) clearInterval(timerInterval); timerInterval = null; timeLeft = GAME_DURATION_SEC; timerStarted = false; updateTimerDisplay(); };
        const startGlobalTimer = () => { if (timerInterval) return; updateTimerDisplay(); timerInterval = setInterval(() => { timeLeft--; updateTimerDisplay(); if (timeLeft <= 0) { clearInterval(timerInterval); endGameByTime(); } }, 1000); };

        const showScreen = (name) => {
            state.screen = name;
            $$('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
            if (name === 'MAP') { 
                resetGlobalTimer(); 
                Sound.music('map');
            }
        };

        const enterLocation = (loc) => {
            Sound.click(); state.location = loc;
            const locName = $('#locationName'); if (locName) locName.textContent = loc.name;
            ['#locationBg', '#castingBg', '#timingBg', '#followingBg', '#resultBg'].forEach(sel => { const el = $(sel); if (el) el.style.backgroundImage = `url('${loc.bg}')`; });
            showScreen('LOCATION');
            Sound.music(loc.music);
        };
        gameApi.current.enterLocation = enterLocation;

        const startCasting = () => {
            Sound.cast(); showScreen('CASTING');
            if (!timerStarted) { timerStarted = true; startGlobalTimer(); }
            setTimeout(() => { if (state.screen !== 'CASTING') return; state.rarity = rollRarity(); Sound.bite(); startTiming(); }, rand(2000, 8000));
        };

        const startTiming = () => {
            const cfg = RARITY_CONFIG[state.rarity];
            state.hitsLeft = cfg.hits; timingZoneSize = cfg.zoneSize; timingZoneStart = rand(10, 90 - timingZoneSize);
            timingPos = 0; timingDir = 1; lastTimingTime = performance.now();
            $('#timingHits').textContent = `Осталось: ${state.hitsLeft}`;
            const zone = $('#timingZone'); zone.style.left = timingZoneStart + '%'; zone.style.width = timingZoneSize + '%';
            showScreen('TIMING'); Sound.rarity(state.rarity);
            if (timingRAF) cancelAnimationFrame(timingRAF);
            timingRAF = requestAnimationFrame(timingLoop);
        };

        const timingLoop = (now) => {
            const dt = Math.min(now - lastTimingTime, 50) / 1000; lastTimingTime = now;
            const speed = 90 * RARITY_CONFIG[state.rarity].cursorSpeed;
            timingPos += timingDir * speed * dt;
            if (timingPos >= 100) { timingPos = 100; timingDir = -1; }
            if (timingPos <= 0) { timingPos = 0; timingDir = 1; }
            $('#timingCursor').style.left = timingPos + '%';
            timingRAF = requestAnimationFrame(timingLoop);
        };

        const flashBar = (color) => { const bar = $('.timing-bar'); bar.style.boxShadow = `0 0 24px ${color}`; setTimeout(() => bar.style.boxShadow = '', 150); };

        const handleTimingTap = () => {
            if (state.screen !== 'TIMING') return;
            const inZone = timingPos >= timingZoneStart && timingPos <= timingZoneStart + timingZoneSize;
            if (inZone) {
                Sound.hit(); state.hitsLeft--; $('#timingHits').textContent = `Осталось: ${state.hitsLeft}`; flashBar('#38d66b');
                if (state.hitsLeft <= 0) { cancelAnimationFrame(timingRAF); startFollowing(); }
            } else { Sound.miss(); flashBar('#ff3b3b'); failCatch(); }
        };

        const startFollowing = () => {
            showScreen('FOLLOWING');
            requestAnimationFrame(() => {
                const wrap = canvas.parentElement;
                const size = Math.min(wrap.clientWidth, wrap.clientHeight) - 10;
                canvas.width = size > 0 ? size : 400;
                canvas.height = size > 0 ? size : 400;

                const cfg = RARITY_CONFIG[state.rarity];
                followState = {
                    player: { x: canvas.width / 2, y: canvas.height / 2 }, mouse: { x: canvas.width / 2, y: canvas.height / 2 },
                    target: { x: canvas.width / 2, y: canvas.height / 2, r: cfg.followRadius, vx: 0, vy: 0, destX: canvas.width / 2, destY: canvas.height / 2, retargetTimer: 0 },
                    progress: 40, speed: cfg.followSpeed, lastTime: performance.now(), trail: [],
                };
                $('#progressFill').style.width = '40%';
                if (followRAF) cancelAnimationFrame(followRAF);
                followRAF = requestAnimationFrame(followLoop);
            });
        };

        const handleMouseMove = (e) => {
            if (!followState) return;
            const rect = canvas.getBoundingClientRect();
            followState.mouse.x = e.clientX - rect.left; followState.mouse.y = e.clientY - rect.top;
        };
        canvas.addEventListener('mousemove', handleMouseMove);

        const followLoop = (now) => {
            if (!followState) return;
            const dt = Math.min(now - followState.lastTime, 50) / 1000; followState.lastTime = now;
            const s = followState;
            s.player.x += (s.mouse.x - s.player.x) * 0.03; s.player.y += (s.mouse.y - s.player.y) * 0.03;
            s.trail.push({ x: s.player.x, y: s.player.y }); if (s.trail.length > 18) s.trail.shift();
            s.target.retargetTimer -= dt;
            if (s.target.retargetTimer <= 0) { s.target.destX = rand(s.target.r, canvas.width - s.target.r); s.target.destY = rand(s.target.r, canvas.height - s.target.r); s.target.retargetTimer = rand(1.5, 2.8) / s.speed; }
            const dxT = s.target.destX - s.target.x; const dyT = s.target.destY - s.target.y;
            const pull = 1.2 * s.speed;
            s.target.vx += dxT * pull * dt; s.target.vy += dyT * pull * dt;
            const damp = Math.pow(0.06, dt); s.target.vx *= damp; s.target.vy *= damp;
            s.target.x += s.target.vx * dt; s.target.y += s.target.vy * dt;
            if (s.target.x < s.target.r) { s.target.x = s.target.r; s.target.vx *= -0.5; }
            if (s.target.x > canvas.width - s.target.r) { s.target.x = canvas.width - s.target.r; s.target.vx *= -0.5; }
            if (s.target.y < s.target.r) { s.target.y = s.target.r; s.target.vy *= -0.5; }
            if (s.target.y > canvas.height - s.target.r) { s.target.y = canvas.height - s.target.r; s.target.vy *= -0.5; }
            const dx = s.player.x - s.target.x; const dy = s.player.y - s.target.y;
            const dist = Math.hypot(dx, dy); const inZone = dist < s.target.r;
            s.progress += inZone ? 20 * dt : -25 * dt; s.progress = Math.max(0, Math.min(100, s.progress));
            if (s.progress <= 0) { followRAF = null; failCatch(); return; }
            $('#progressFill').style.width = s.progress + '%';
            drawFollow(s, inZone);
            if (s.progress >= 100) { cancelAnimationFrame(followRAF); followRAF = null; succeedCatch(); return; }
            followRAF = requestAnimationFrame(followLoop);
        };

        const drawFollow = (s, inZone) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath(); ctx.arc(s.target.x, s.target.y, s.target.r, 0, Math.PI * 2);
            ctx.fillStyle = inZone ? 'rgba(56,214,107,0.25)' : 'rgba(255,60,60,0.18)'; ctx.fill();
            ctx.lineWidth = 3; ctx.strokeStyle = inZone ? '#38d66b' : '#ff3b3b'; ctx.stroke();
            const n = s.trail.length;
            for (let i = 0; i < n; i++) { const t = s.trail[i]; const k = i / n; ctx.beginPath(); ctx.arc(t.x, t.y, 2 + k * 8, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 122, 0, ${0.05 + k * 0.35})`; ctx.fill(); }
            ctx.beginPath(); ctx.arc(s.player.x, s.player.y, 10, 0, Math.PI * 2); ctx.fillStyle = '#ff7a00'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
        };

        const spawnConfetti = (count = 60) => {
            const layer = $('#confettiLayer'); if (!layer) return;
            layer.innerHTML = ''; const colors = ['#ffb84d', '#ff7a00', '#38d66b', '#4da3ff', '#ff3b3b', '#fff'];
            for (let i = 0; i < count; i++) {
                const el = document.createElement('span'); el.className = 'confetti';
                el.style.left = Math.random() * 100 + '%'; el.style.background = colors[Math.floor(Math.random() * colors.length)];
                el.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px'); el.style.setProperty('--rot', (Math.random() * 1080 - 540) + 'deg');
                el.style.setProperty('--delay', (Math.random() * 0.8) + 's'); el.style.setProperty('--dur', (2.5 + Math.random() * 1.5) + 's');
                const shape = Math.random(); if (shape < 0.3) { el.style.borderRadius = '50%'; el.style.width = '8px'; el.style.height = '8px'; } else if (shape < 0.6) { el.style.borderRadius = '2px'; el.style.width = '10px'; el.style.height = '10px'; }
                layer.appendChild(el);
            }
            setTimeout(() => { layer.innerHTML = ''; }, 5000);
        };

        const succeedCatch = () => {
            const cfg = RARITY_CONFIG[state.rarity]; const text = pick(PREDICTIONS[state.rarity]);
            $('#resultRarity').textContent = cfg.label; $('#resultRarity').className = 'result-rarity ' + state.rarity;
            $('#resultText').textContent = text; showScreen('RESULT'); Sound.success(state.rarity); spawnConfetti();
        };

        const failCatch = () => {
            if (timingRAF) { cancelAnimationFrame(timingRAF); timingRAF = null; }
            if (followRAF) { cancelAnimationFrame(followRAF); followRAF = null; }
            followState = null;
            $('#resultRarity').textContent = 'Сорвалась…'; $('#resultRarity').className = 'result-rarity';
            $('#resultText').textContent = 'Попробуй ещё раз!'; showScreen('RESULT'); Sound.fail();
        };

        const endGameByTime = () => {
            if (timingRAF) cancelAnimationFrame(timingRAF);
            if (followRAF) cancelAnimationFrame(followRAF);
            followState = null;
            $('#resultRarity').textContent = 'Время вышло'; $('#resultRarity').className = 'result-rarity';
            $('#resultText').textContent = 'Ты не успел поймать свою удачу. Попробуй ещё раз!';
            showScreen('RESULT'); Sound.fail();
        };

        showScreen('MAP');

        const btnCast = $('#btnCast'); if (btnCast) btnCast.addEventListener('click', () => { Sound.click(); startCasting(); });
        const btnAgain = $('#btnAgain'); if (btnAgain) btnAgain.addEventListener('click', () => { Sound.click(); showScreen('MAP'); });
        const timingBar = $('.timing-bar'); if (timingBar) timingBar.addEventListener('click', handleTimingTap);
        
        const handleKeyDown = (e) => { if (e.code === 'Space') { e.preventDefault(); handleTimingTap(); } };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            if (timerInterval) clearInterval(timerInterval);
            if (timingRAF) cancelAnimationFrame(timingRAF);
            if (followRAF) cancelAnimationFrame(followRAF);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('pointerdown', unlockAudio);
            if (canvas) canvas.removeEventListener('mousemove', handleMouseMove);
            if (currentMusic) { currentMusic.pause(); currentMusic.src = ''; }
        };
    }, [isMobile]);

    if (isMobile) {
        return (
            <div className="fishing-game-page fade-in">
                <Bubbles />
                <div className="mobile-warning-container">
                    <div className="mobile-warning-card">
                        <div className="mobile-icon">
                            <FontAwesomeIcon icon={faDesktop} />
                            <FontAwesomeIcon icon={faTriangleExclamation} className="warning-icon" />
                        </div>
                        <h1>Ой! Игра не для телефона</h1>
                        <p>
                            Эта мини-игра использует управление мышкой. 
                            Пожалуйста, откройте её на компьютере или ноутбуке.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fishing-game-page fade-in">
            <Bubbles />
            <div className="fishing-game-wrapper" ref={containerRef}>

                <div id="app">
                    <div className="top-bar-timer">
                        <FontAwesomeIcon icon={faClock} />
                        <span id="timerValue">90</span>
                        <div className="timer-bar"><div className="timer-bar-fill" id="timerFill"></div></div>
                    </div>

                    <section className="screen" data-screen="MAP">
                        <div className="map-bg"></div>
                        <div className="map-points" id="mapPoints">
                            {LOCATIONS.map(loc => (
                                <div 
                                    key={loc.id} 
                                    className="map-point" 
                                    style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                                    onClick={() => gameApi.current.enterLocation(loc)}
                                >
                                    <div className="map-point-preview" style={{ backgroundImage: `url('${loc.bg}')` }}></div>
                                    <FontAwesomeIcon icon={loc.icon} />
                                    <span className="label">{loc.name}</span>
                                </div>
                            ))}
                        </div>
                        <h1 className="map-title">Выбери место рыбалки</h1>
                    </section>

                    <section className="screen" data-screen="LOCATION">
                        <div className="location-bg" id="locationBg"></div>
                        <div className="location-overlay">
                            <h2 className="location-name" id="locationName"></h2>
                            <button className="btn-cast" id="btnCast">
                                <FontAwesomeIcon icon={faFish} /> Ловить
                            </button>
                        </div>
                    </section>

                    <section className="screen" data-screen="CASTING">
                        <div className="location-bg" id="castingBg"></div>
                        <div className="casting-overlay">
                            <div className="float"><FontAwesomeIcon icon={faFish} /></div>
                            <p className="hint">Ждём поклёвку…</p>
                        </div>
                    </section>

                    <section className="screen" data-screen="TIMING">
                        <div className="location-bg" id="timingBg"></div>
                        <div className="screen-content">
                            <h2 className="mini-title">Подсекай!</h2>
                            <p className="mini-sub" id="timingHits">Осталось: 2</p>
                            <div className="timing-bar">
                                <div className="timing-zone" id="timingZone"></div>
                                <div className="timing-cursor" id="timingCursor"></div>
                            </div>
                            <p className="hint">Жми ПРОБЕЛ или кликай, когда полоска в зелёной зоне</p>
                        </div>
                    </section>

                    <section className="screen" data-screen="FOLLOWING">
                        <div className="location-bg" id="followingBg"></div>
                        <div className="screen-content following-content">
                            <h2 className="mini-title">Не отпускай!</h2>
                            <div className="canvas-wrap">
                                <canvas id="followCanvas" ref={canvasRef}></canvas>
                            </div>
                            <div className="progress-wrap">
                                <div className="progress-fill" id="progressFill"></div>
                            </div>
                        </div>
                    </section>

                    <section className="screen" data-screen="RESULT">
                        <div className="location-bg" id="resultBg"></div>
                        <div className="confetti-layer" id="confettiLayer"></div>
                        <div className="result-card" id="resultCard">
                            <div className="result-rarity" id="resultRarity"></div>
                            <div className="result-fish" id="resultFish">
                                <FontAwesomeIcon icon={faFish} />
                            </div>
                            <div className="result-text" id="resultText"></div>
                            <button className="btn-cast" id="btnAgain">
                                <FontAwesomeIcon icon={faRotateRight} /> На карту
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}