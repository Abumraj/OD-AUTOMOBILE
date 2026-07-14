import React, { useEffect } from 'react';

function Toast({ message, type = 'info', onClose, duration = 4000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-500',
                    icon: 'check_circle',
                    border: 'border-green-600'
                };
            case 'error':
                return {
                    bg: 'bg-red-500',
                    icon: 'error',
                    border: 'border-red-600'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-500',
                    icon: 'warning',
                    border: 'border-yellow-600'
                };
            case 'info':
            default:
                return {
                    bg: 'bg-blue-500',
                    icon: 'info',
                    border: 'border-blue-600'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed top-4 right-4 z-50 animate-slideInRight">
            <div className={`${styles.bg} ${styles.border} border-l-4 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md flex items-start gap-3`}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {styles.icon}
                </span>
                <div className="flex-1">
                    <p className="font-medium text-sm leading-relaxed">{message}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors ml-2"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>
        </div>
    );
}

export default Toast;
