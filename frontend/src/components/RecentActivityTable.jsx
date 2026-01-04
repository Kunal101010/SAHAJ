function RecentActivityTable({ data }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-gray-600 border-b">
            {/* <th className="pb-2">Request ID</th> */}
            <th className="pb-2">Title</th>
            <th className="pb-2">Type</th>
            <th className="pb-2">Technician</th>
            <th className="pb-2">Priority</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((activity) => (
            <tr key={activity.id} className="border-b">
              {/* <td className="py-2">{activity.id}</td> */}
              <td className="py-2">{activity.title}</td>
              <td className="py-2">{activity.type}</td>
              <td className="py-2">{activity.assignedTo ? `${activity.assignedTo.firstName} ${activity.assignedTo.lastName}` : 'Unassigned'}</td>
              <td className="py-2">
                <span className={`px-2 py-1 rounded ${activity.priority === 'High' ? 'bg-red-200 text-red-800' : activity.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                  {activity.priority}
                </span>
              </td>
              <td className="py-2">
                <span className={`px-2 py-1 rounded ${activity.status === 'Completed' ? 'bg-green-200 text-green-800' : activity.status === 'Pending' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                  {activity.status}
                </span>
              </td>
              <td className="py-2">{new Date(activity.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-4 text-gray-600">No recent activity</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RecentActivityTable;