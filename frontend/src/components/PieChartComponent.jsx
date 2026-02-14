import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function PieChartComponent({ data = [], title = "Status Distribution" }) {
  const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#6366f1']; // Completed, Pending, In Progress, etc.

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex justify-center space-x-6 mt-4 flex-wrap">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center my-1">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="text-sm text-gray-700">{entry.name}: {entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PieChartComponent;