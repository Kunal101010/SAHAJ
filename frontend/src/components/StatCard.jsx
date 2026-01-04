function StatCard({ title, value, change, color }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-sm text-gray-600">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      <p className={`text-sm ${color} mt-1`}>{change}</p>
    </div>
  );
}

export default StatCard;