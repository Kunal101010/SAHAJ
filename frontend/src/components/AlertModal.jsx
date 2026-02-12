import React from 'react';

function AlertModal({ isOpen, message, type = 'error', onClose }) {
    if (!isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm mx-4 transform transition-all scale-100">
                <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                        {isSuccess ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>

                    {/* Title & Message */}
                    <h3 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
                        {isSuccess ? 'Success' : 'Error'}
                    </h3>
                    <p className="text-gray-600 mb-6">{message}</p>

                    {/* Button */}
                    <button
                        onClick={onClose}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition transform active:scale-95 ${isSuccess
                            ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                            : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                            } shadow-lg`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AlertModal;
