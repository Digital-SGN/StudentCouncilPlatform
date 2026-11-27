import { createRoot } from 'react-dom/client';
import App from './App';

document.documentElement.dataset.theme =
    localStorage.getItem('site-theme') === 'dark' ? 'dark' : 'light';

createRoot(document.getElementById('root')).render(<App />);