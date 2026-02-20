import Plot from "react-plotly.js";

export default function HSIHeatmap({ data }) {

  const zValues = data.map(d => d.yhat);

  return (
    <Plot
      data={[
        {
          z: [zValues],
          type: "heatmap",
          colorscale: "YlOrRd"
        }
      ]}
      layout={{
        title: "5-Day Risk Heatmap",
        paper_bgcolor: "#0b0f1a",
        plot_bgcolor: "#0b0f1a",
        font: { color: "white" }
      }}
    />
  );
}