import React from "react";
import Plot from "react-plotly.js";

export default function StressHeatmap({ data }) {

  if (!data || data.length === 0) return null;

  const dates = data.map(d => d.Date);
  const values = data.map(d => d.HSI);

  return (
    <div className="mt-10 bg-[#111827] p-6 rounded-2xl border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">
        Calendar View of Hospital Stress
      </h2>

      <Plot
        data={[
          {
            z: [values],
            x: dates,
            y: ["Stress Index"],
            type: "heatmap",
            colorscale: "RdOrYl"
          }
        ]}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "white" },
          height: 300
        }}
        style={{ width: "100%" }}
      />
    </div>
  );
}