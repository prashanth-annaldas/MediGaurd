import React, { useState, useEffect } from "react";
import { BedDouble, HeartPulse, Wind } from "lucide-react";
import ResourceCard from "../components/ResourceCard";
import UsageChart from "../components/UsageChart";
import InputCard from "../components/InputCard";
import StressHeatmap from "../components/StressHeatmap";
import HSIChart from "../components/HSIChart";
import HSIGauge from "../components/HSIGauge";
import ForecastChart from "../components/ForecastChart";

export default function Dashboard() {
  const BASE_URL = import.meta.env.VITE_API_URL;

  /* ================= STATES ================= */

  const [history, setHistory] = useState([]);
  const [hsiTrend, setHsiTrend] = useState([]);
  const [forecastData, setForecastData] = useState([]);

  const [beds, setBeds] = useState(0);
  const [icu, setIcu] = useState(0);
  const [ventilator, setVentilator] = useState(0);
  const [hsi, setHsi] = useState(0);

  const [usageFrom, setUsageFrom] = useState("");
  const [usageTo, setUsageTo] = useState("");

  const [hsiFrom, setHsiFrom] = useState("");
  const [hsiTo, setHsiTo] = useState("");

  const [inputs, setInputs] = useState({});

  const safeNumber = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  /* ================= LOAD INITIAL DATA ================= */

  useEffect(() => {
    fetch(`${BASE_URL}/trend`)
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error("Trend error:", err));

    fetch(`${BASE_URL}/hsi_trend`)
      .then((res) => res.json())
      .then((data) => setHsiTrend(data))
      .catch((err) => console.error("HSI error:", err));

    fetch(`${BASE_URL}/forecast`)
      .then((res) => res.json())
      .then((data) => setForecastData(data))
      .catch((err) => console.error("Forecast error:", err));
  }, []);

  /* ================= AUTO CALCULATE HSI ================= */

  useEffect(() => {
    const value =
      0.35 * beds +
      0.25 * icu +
      0.2 * ventilator +
      0.2 * 50;

    setHsi(Number(value.toFixed(2)));
  }, [beds, icu, ventilator]);

  /* ================= USAGE DATE FILTER ================= */

  useEffect(() => {
    if (usageFrom && usageTo) {
      fetch(
        `${BASE_URL}/trend?from_date=${usageFrom}&to_date=${usageTo}`
      )
        .then((res) => res.json())
        .then((data) => setHistory(data))
        .catch((err) => console.error("Usage filter error:", err));
    }
  }, [usageFrom, usageTo]);

  /* ================= HSI DATE FILTER ================= */

  useEffect(() => {
    if (hsiFrom && hsiTo) {
      fetch(
        `${BASE_URL}/hsi_trend?from_date=${hsiFrom}&to_date=${hsiTo}`
      )
        .then((res) => res.json())
        .then((data) => setHsiTrend(data))
        .catch((err) => console.error("HSI filter error:", err));
    }
  }, [hsiFrom, hsiTo]);

  /* ================= MANUAL INPUT UPDATE ================= */

  const handleManualUpdate = () => {
    const bedsUsage = safeNumber(inputs.bedRate ?? beds);
    const icuUsage = safeNumber(inputs.icuRate ?? icu);
    const ventUsage = safeNumber(inputs.ventRate ?? ventilator);

    setBeds(bedsUsage);
    setIcu(icuUsage);
    setVentilator(ventUsage);

    setHistory((prev) => [
      ...prev,
      {
        day: "Manual",
        beds: bedsUsage,
        icu: icuUsage,
        ventilator: ventUsage,
      },
    ]);
  };

  /* ================= MERGE HISTORY + FORECAST ================= */

  const combinedUsage = [
    ...history,
    ...forecastData.map((d) => ({
      day: d.ds,
      beds: d.beds,
      icu: d.icu,
      ventilator: d.ventilator,
    })),
  ];

  const combinedHSI = [
    ...hsiTrend,
    ...forecastData.map((d) => ({
      day: d.ds,
      HSI: d.yhat,
    })),
  ];

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white px-6 py-8">
      <h1 className="text-4xl font-bold">
        Hospital Resource Dashboard
      </h1>

      {/* ================= INPUT SECTION ================= */}
      <div className="mt-8">
        <InputCard
          inputs={inputs}
          setInputs={setInputs}
          onUpdate={handleManualUpdate}
        />
      </div>

      {/* ================= RESOURCE CARDS ================= */}
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        <ResourceCard
          title="Beds Usage"
          actualValue={beds}
          icon={BedDouble}
          color="bg-yellow-500"
        />
        <ResourceCard
          title="ICU Usage"
          actualValue={icu}
          icon={HeartPulse}
          color="bg-orange-500"
        />
        <ResourceCard
          title="Ventilator Usage"
          actualValue={ventilator}
          icon={Wind}
          color="bg-blue-500"
        />
      </div>

      {/* ================= HSI GAUGE ================= */}
      <HSIGauge value={hsi} />

      {hsi > 80 && (
        <div className="mt-4 text-red-500 font-bold animate-pulse">
          CRITICAL SHORTAGE RISK
        </div>
      )}
      {hsi > 60 && hsi <= 80 && (
        <div className="mt-4 text-orange-400 font-bold animate-pulse">
          HIGH STRESS LEVEL
        </div>
      )}
      {hsi <= 60 && (
        <div className="mt-4 text-green-400 font-semibold">
          System operating within normal limits
        </div>
      )}

      {/* ================= USAGE DATE RANGE ================= */}
      <div className="mt-10 flex gap-4 items-center">
        <div>
          <label className="text-sm">Usage From</label>
          <input
            type="date"
            value={usageFrom}
            onChange={(e) => setUsageFrom(e.target.value)}
            className="ml-2 text-black p-1 rounded"
          />
        </div>

        <div>
          <label className="text-sm">Usage To</label>
          <input
            type="date"
            value={usageTo}
            onChange={(e) => setUsageTo(e.target.value)}
            className="ml-2 text-black p-1 rounded"
          />
        </div>
      </div>

      <UsageChart history={combinedUsage} />

      {/* ================= HSI DATE RANGE ================= */}
      <div className="mt-10 flex gap-4 items-center">
        <div>
          <label className="text-sm">HSI From</label>
          <input
            type="date"
            value={hsiFrom}
            onChange={(e) => setHsiFrom(e.target.value)}
            className="ml-2 text-black p-1 rounded"
          />
        </div>

        <div>
          <label className="text-sm">HSI To</label>
          <input
            type="date"
            value={hsiTo}
            onChange={(e) => setHsiTo(e.target.value)}
            className="ml-2 text-black p-1 rounded"
          />
        </div>
      </div>

      <HSIChart data={combinedHSI} />

      {/* ================= FORECAST ================= */}
      <ForecastChart data={forecastData} />

      <StressHeatmap data={forecastData} />
    </div>
  );
}