import React from "react";
import Plot from "react-plotly.js";

export default function HSIGauge({ value }) {

  return (
    <div className="mt-8 bg-[#111827] p-6 rounded-2xl border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">
        Hospital Stress Index
      </h2>

      <Plot
        data={[
          {
            type: "indicator",
            mode: "gauge+number",
            value: value,
            gauge: {
              axis: { range: [0, 100] },
              bar: { color: "cyan" },
              steps: [
                { range: [0, 50], color: "green" },
                { range: [50, 70], color: "yellow" },
                { range: [70, 85], color: "orange" },
                { range: [85, 100], color: "red" }
              ]
            }
          }
        ]}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "white" },
          height: 350
        }}
        style={{ width: "100%" }}
      />
    </div>
  );
}