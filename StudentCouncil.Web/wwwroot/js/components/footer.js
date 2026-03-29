function renderFooter() {
    return `
        <footer>
            <div class="container">
                <p>&copy; ${new Date().getFullYear()} Студенческий совет СГН МГТУ им. Н.Э. Баумана</p>
                <p class="footer-links">
                    <a href="/help">Помощь</a>
                </p>
            </div>
        </footer>
    `;
}