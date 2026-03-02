const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction,
  className = "",
  darkMode = false 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mb-6">
        {typeof icon === 'string' ? (
          <span className="text-6xl">{icon}</span>
        ) : (
          <div className="w-24 h-24 mx-auto flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
            {icon}
          </div>
        )}
      </div>
      
      <h3 className={`text-xl font-semibold mb-3 ${
        darkMode ? 'text-gray-200' : 'text-gray-900'
      }`}>
        {title}
      </h3>
      
      <p className={`text-lg mb-6 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {description}
      </p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
