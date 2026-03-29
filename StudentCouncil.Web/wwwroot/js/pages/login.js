window.renderLogin = function () {
    return `
        <div class="login-page">
            <audio id="bg-music" loop><source src="/music/background.mp3" type="audio/mpeg"></audio>

            <!-- 20 маленьких кругов -->
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
            <div class="circle circle-3"></div>
            <div class="circle circle-4"></div>
            <div class="circle circle-5"></div>
            <div class="circle circle-6"></div>
            <div class="circle circle-7"></div>
            <div class="circle circle-8"></div>
            <div class="circle circle-9"></div>
            <div class="circle circle-10"></div>
            <div class="circle circle-11"></div>
            <div class="circle circle-12"></div>
            <div class="circle circle-13"></div>
            <div class="circle circle-14"></div>
            <div class="circle circle-15"></div>
            <div class="circle circle-16"></div>
            <div class="circle circle-17"></div>
            <div class="circle circle-18"></div>
            <div class="circle circle-19"></div>
            <div class="circle circle-20"></div>

            <!-- 8 больших кругов -->
            <div class="circle-large large-1"></div>
            <div class="circle-large large-2"></div>
            <div class="circle-large large-3"></div>
            <div class="circle-large large-4"></div>
            <div class="circle-large large-5"></div>
            <div class="circle-large large-6"></div>
            <div class="circle-large large-7"></div>
            <div class="circle-large large-8"></div>

            <div class="login-container">
                <div class="login-logo">
                    <img src="/images/logo.svg" alt="Лого" style="width: 80px;">
                </div>
                <h1>Студенческий совет СГН</h1>
                <form id="loginForm">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" id="email" required autofocus>
                    </div>
                    <div class="form-group">
                        <label>Пароль</label>
                        <input type="password" name="password" id="password" required>
                    </div>
                    <div id="errorMessage" class="error-message" style="display: none;"></div>
                    <button type="submit">Войти</button>
                </form>
                <div class="help-row">
                    <div class="music-control" onclick="window.toggleMusic()">🔊</div>
                    <div class="help-link"><a href="/help">Помощь</a></div>
                </div>
            </div>
        </div>
    `;
};

window.initLogin = function () {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('errorMessage');
    const music = document.getElementById('bg-music');
    const musicBtn = document.querySelector('.music-control');

    if (musicBtn && music) musicBtn.textContent = music.paused ? '🔇' : '🔊';

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('input[name="email"]').value;
            const password = form.querySelector('input[name="password"]').value;
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            }

            submitBtn.innerHTML = '<span class="spinner-border-sm"></span> Вход...';
            submitBtn.disabled = true;

            const result = await API.login(email, password);
            if (result.ok) {
                setTimeout(() => {
                    window.location.href = '/home';
                }, 300);
                window.location.href = '/home';
            }
            else {
                if (errorDiv) {
                    errorDiv.textContent = result.data?.error || 'Неверный email или пароль';
                    errorDiv.style.display = 'block';
                }
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
};

window.toggleMusic = function () {
    const music = document.getElementById('bg-music');
    const musicBtn = document.querySelector('.music-control');
    if (music) {
        if (music.paused) {
            music.play();
            if (musicBtn) musicBtn.textContent = '🔊';
        } else {
            music.pause();
            if (musicBtn) musicBtn.textContent = '🔇';
        }
    }
};