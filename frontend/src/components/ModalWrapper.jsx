import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ModalWrapper = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', zIndex = 'z-50' }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 ${zIndex} flex items-center justify-center`}>
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/70 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className={`relative bg-white p-8 rounded-2xl shadow-2xl w-full ${maxWidth} mx-4 max-h-[90vh] overflow-y-auto`}
                    >
                        {title && (
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
                        )}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ModalWrapper;
