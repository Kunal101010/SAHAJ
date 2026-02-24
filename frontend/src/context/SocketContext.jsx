import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getCurrentUser } from '../utils/auth';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const user = getCurrentUser();

    useEffect(() => {
        // Only connect if user is logged in
        if (user) {
            const newSocket = io('http://localhost:5000', {
                withCredentials: true,
                // Match server preference — connect via WebSocket directly,
                // skipping the HTTP polling → upgrade round-trip
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                // Join a room with User ID for private notifications
                newSocket.emit('join', user.id || user._id);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user?.id]); // Re-connect if user changes

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
