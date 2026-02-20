import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function ForecastChart({ data }) {

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-[#111827] p-6 rounded-2xl mt-8 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">
        5-Day Future HSI Forecast
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#333" />

          <XAxis
            dataKey="ds"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString()
            }
          />

          <YAxis domain={[0, 100]} />

          <Tooltip
            labelFormatter={(value) =>
              new Date(value).toLocaleDateString()
            }
          />

          <Line
            type="monotone"
            dataKey="yhat"
            stroke="#00c6ff"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}