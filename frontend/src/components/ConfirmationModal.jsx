import React from 'react';
import ModalWrapper from './ModalWrapper';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false }) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
            <h3 className={`text-xl font-bold mb-4 ${isDangerous ? 'text-red-600' : 'text-gray-800'}`}>
                {title}
            </h3>
            <p className="text-gray-600 mb-8 text-base leading-relaxed">
                {message}
            </p>
            <div className="flex justify-end space-x-4">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={`px-4 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 ${isDangerous
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                >
                    {confirmText}
                </button>
            </div>
        </ModalWrapper>
    );
};

export default ConfirmationModal;
