import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function LineChartComponent({ data = [], title = "Request Trends (Monthly)", lineName = "Requests" }) {
  // Data key wrapper to handle different backend responses if needed, 
  // but based on controller: _id is date string, count is value
  const chartData = data.map(item => ({
    name: item.name || item._id, // Date string (YYYY-MM) or formatted name
    value: item.value || item.count || item.bookings // Handle different key names from backend
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            strokeWidth={2}
            name={lineName}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChartComponent;