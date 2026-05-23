import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCircleExclamation, faTriangleExclamation, 
    faCircleInfo, faCircleCheck 
} from '@fortawesome/free-solid-svg-icons';

const alertConfig = {
    danger: { icon: faCircleExclamation, className: 'alert-danger' },
    warning: { icon: faTriangleExclamation, className: 'alert-warning' },
    info: { icon: faCircleInfo, className: 'alert-info' },
    success: { icon: faCircleCheck, className: 'alert-success' }
};

export default function Alert({ type = 'danger', message, className = '' }) {
    const config = alertConfig[type] || alertConfig.danger;
    return (
        <div className={`alert ${config.className} ${className}`}>
            <FontAwesomeIcon icon={config.icon} />
            <span>{message}</span>
        </div>
    );
}