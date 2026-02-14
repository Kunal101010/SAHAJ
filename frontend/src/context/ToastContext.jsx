import { createContext, useContext, useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { useSocket } from './SocketContext';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const socket = useSocket();

    const showToast = (message, type = 'success', duration = 3000) => {
        setToast({ isVisible: true, message, type, duration });
    };

    const closeToast = () => {
        setToast(prev => ({ ...prev, isVisible: false }));
    };

    // Global Socket Listeners for Real-time Feedback
    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data) => {
            // Show info toast for incoming notifications
            showToast(data.title || 'New Notification', 'info');
        };

        const handleRequestUpdated = (data) => {
            // Optional: specific messages for request updates
            // But notification service usually covers this.
            // Let's stick to 'new_notification' which aggregates them.
        };

        socket.on('new_notification', handleNotification);

        return () => {
            socket.off('new_notification', handleNotification);
        };
    }, [socket]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={closeToast}
                duration={toast.duration}
            />
        </ToastContext.Provider>
    );
};
