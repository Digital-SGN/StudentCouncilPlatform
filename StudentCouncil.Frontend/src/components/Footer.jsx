export default function Footer() {
    return (
        <footer>
            <div className="container">
                <p>&copy; {new Date().getFullYear()} Студенческий совет СГН МГТУ им. Н.Э. Баумана</p>
                <p className="footer-links">
                    <a href="/help">Помощь</a>
                </p>
            </div>
        </footer>
    );
}