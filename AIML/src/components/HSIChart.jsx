import React from "react";
import Plot from "react-plotly.js";

export default function HSIChart({ data }) {

  if (!data || data.length === 0) return null;

  const dates = data.map(d => d.Date || d.ds);
  const values = data.map(d => d.HSI || d.yhat);

  return (
    <div className="mt-10 bg-[#111827] p-6 rounded-2xl border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">
        Hospital Stress Index Trend
      </h2>

      <Plot
        data={[
          {
            x: dates,
            y: values,
            type: "scatter",
            mode: "lines+markers",
            line: { color: "#00c6ff" }
          }
        ]}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "white" },
          height: 400
        }}
        style={{ width: "100%" }}
      />
    </div>
  );
}