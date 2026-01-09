import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ message, type = 'success', isVisible, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  }[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-8 right-8 z-50 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md`}
        >
          <span className="text-2xl font-bold">{icon}</span>
          <span className="text-base font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
