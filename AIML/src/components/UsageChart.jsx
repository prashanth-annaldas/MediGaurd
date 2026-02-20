import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function UsageChart({ history }) {

  if (!history || history.length === 0) return null;

  return (
    <div className="mt-14 bg-[#111827] border border-gray-700 rounded-2xl p-8 shadow-lg">
      <h2 className="text-2xl font-semibold">Usage Trends</h2>

      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>

            <CartesianGrid stroke="#333" />

            <XAxis
              dataKey="day"
              stroke="#ccc"
              tickFormatter={(value) =>
                value === "Manual"
                  ? "Manual"
                  : new Date(value).toLocaleDateString()
              }
            />

            <YAxis domain={[0, 100]} stroke="#ccc" />

            <Tooltip
              labelFormatter={(value) =>
                value === "Manual"
                  ? "Manual Entry"
                  : new Date(value).toLocaleDateString()
              }
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="beds"
              stroke="#facc15"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />

            <Line
              type="monotone"
              dataKey="icu"
              stroke="#fb923c"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />

            <Line
              type="monotone"
              dataKey="ventilator"
              stroke="#60a5fa"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}