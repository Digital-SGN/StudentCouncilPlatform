import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCircleCheck, 
    faCircleExclamation, 
    faCircleInfo, 
    faXmark 
} from '@fortawesome/free-solid-svg-icons';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return faCircleCheck;
            case 'error': return faCircleExclamation;
            case 'info': return faCircleInfo;
            default: return faCircleInfo;
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'info': return '#3b82f6';
            default: return '#3b82f6';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {createPortal(
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            <div className="toast-content">
                                <FontAwesomeIcon 
                                    icon={getIcon(toast.type)} 
                                    className="toast-icon" 
                                    style={{ color: getIconColor(toast.type) }} 
                                />
                                <span>{toast.message}</span>
                            </div>
                            <button className="toast-close" onClick={() => removeToast(toast.id)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                            <div className="toast-progress"></div>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}