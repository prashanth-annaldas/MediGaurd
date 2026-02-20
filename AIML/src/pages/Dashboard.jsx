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
  /* ================= STATES ================= */

  // Original datasets
  const [history, setHistory] = useState([]);
  const [hsiTrend, setHsiTrend] = useState([]);
  const [forecastData, setForecastData] = useState([]);

  // Filtered datasets
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filteredHSI, setFilteredHSI] = useState([]);

  // Resource values
  const [beds, setBeds] = useState(0);
  const [icu, setIcu] = useState(0);
  const [ventilator, setVentilator] = useState(0);
  const [hsi, setHsi] = useState(0);

  const [tempBeds, setTempBeds] = useState(0);
  const [tempIcu, setTempIcu] = useState(0);
  const [tempVentilator, setTempVentilator] = useState(0);

  // Date ranges
  const [usageFrom, setUsageFrom] = useState("");
  const [usageTo, setUsageTo] = useState("");

  const [hsiFrom, setHsiFrom] = useState("");
  const [hsiTo, setHsiTo] = useState("");

  const [inputs, setInputs] = useState({});

  const safeNumber = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  /* ================= LOAD USAGE TREND ================= */

  useEffect(() => {
  fetch("http://127.0.0.1:8000/trend")
    .then(res => res.json())
    .then(data => {

      const formatted = data.map(item => ({
        day: item.day || item.Date,
        beds: item.beds || item.Beds,
        icu: item.icu || item.ICU,
        ventilator: item.ventilator || item.Vent
      }));

      setHistory(formatted);
      setFilteredHistory(formatted);
    });
}, []);

  /* ================= LOAD HSI TREND ================= */

  useEffect(() => {
    fetch("http://127.0.0.1:8000/hsi_trend")
      .then((res) => res.json())
      .then((data) => {
        setHsiTrend(data);
        setFilteredHSI(data);
      });
  }, []);

  useEffect(() => {
  fetch("http://127.0.0.1:8000/forecast")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setForecastData(data);
      }
    })
    .catch(err => console.error(err));
}, []);

  /* ================= AUTO CALCULATE HSI ================= */

  useEffect(() => {
    const value = 0.35 * beds + 0.25 * icu + 0.2 * ventilator + 0.2 * 50;

    setHsi(Number(value.toFixed(2)));
  }, [beds, icu, ventilator]);

  /* ================= USAGE FILTER ================= */

  const applyUsageFilter = () => {
    if (!usageFrom || !usageTo) {
      alert("Select both usage dates");
      return;
    }

    const filtered = history.filter(
      (row) => row.day >= usageFrom && row.day <= usageTo,
    );

    setFilteredHistory(filtered);
  };

  /* ================= HSI FILTER ================= */

  const applyHSIFilter = () => {
    if (!hsiFrom || !hsiTo) {
      alert("Select both HSI dates");
      return;
    }

    const filtered = hsiTrend.filter(
      (row) => row.Date >= hsiFrom && row.Date <= hsiTo,
    );

    setFilteredHSI(filtered);
  };

  /* ================= MANUAL INPUT UPDATE ================= */

  const handleManualUpdate = () => {
    const bedsUsage = safeNumber(inputs.bedRate ?? beds);
    const icuUsage = safeNumber(inputs.icuRate ?? icu);
    const ventUsage = safeNumber(inputs.ventRate ?? ventilator);

    setBeds(bedsUsage);
    setIcu(icuUsage);
    setVentilator(ventUsage);

    setTempBeds(bedsUsage);
    setTempIcu(icuUsage);
    setTempVentilator(ventUsage);

    setFilteredHistory((prev) => [
      ...prev,
      {
        day: "Manual",
        beds: bedsUsage,
        icu: icuUsage,
        ventilator: ventUsage,
      },
    ]);
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white px-6 py-8">
      <h1 className="text-4xl font-bold">Hospital Resource Dashboard</h1>

      {/* INPUT CARD */}
      <div className="mt-8">
        <InputCard
          inputs={inputs}
          setInputs={setInputs}
          onUpdate={handleManualUpdate}
        />
      </div>

      {/* RESOURCE CARDS */}
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        <ResourceCard
          title="Beds Usage"
          tempValue={tempBeds}
          setTempValue={setTempBeds}
          actualValue={beds}
          icon={BedDouble}
          color="bg-yellow-500"
        />
        <ResourceCard
          title="ICU Usage"
          tempValue={tempIcu}
          setTempValue={setTempIcu}
          actualValue={icu}
          icon={HeartPulse}
          color="bg-orange-500"
        />
        <ResourceCard
          title="Ventilator Usage"
          tempValue={tempVentilator}
          setTempValue={setTempVentilator}
          actualValue={ventilator}
          icon={Wind}
          color="bg-blue-500"
        />
      </div>

      {/* GAUGE */}
      <HSIGauge value={hsi} />

      {/* ALERT */}
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

      {/* USAGE FILTER */}
      <div className="mt-10 bg-[#111827] p-6 rounded-2xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Filter Usage Trend</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="date"
            value={usageFrom}
            onChange={(e) => setUsageFrom(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          />
          <input
            type="date"
            value={usageTo}
            onChange={(e) => setUsageTo(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          />
          <button
            onClick={applyUsageFilter}
            className="bg-purple-600 hover:bg-purple-700 p-2 rounded font-semibold"
          >
            Apply Range5
          </button>
        </div>
      </div>

      <UsageChart history={filteredHistory} />

      {/* HSI FILTER */}
      <div className="mt-10 bg-[#111827] p-6 rounded-2xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Filter HSI Trend</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="date"
            value={hsiFrom}
            onChange={(e) => setHsiFrom(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          />
          <input
            type="date"
            value={hsiTo}
            onChange={(e) => setHsiTo(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          />
          <button
            onClick={applyHSIFilter}
            className="bg-purple-600 hover:bg-purple-700 p-2 rounded font-semibold"
          >
            Apply Range
          </button>
        </div>
      </div>

      <HSIChart data={filteredHSI} />
      <ForecastChart data={forecastData} />
      <div className="grid md:grid-cols-5 gap-4 mt-6">
        {forecastData.map((day, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl text-center ${
              day.Risk_Level === "CRITICAL"
                ? "bg-red-600"
                : day.Risk_Level === "HIGH"
                  ? "bg-orange-500"
                  : "bg-green-500"
            }`}
          >
            <div className="text-sm">
              {new Date(day.ds).toLocaleDateString()}
            </div>
            <div className="text-2xl font-bold">{day.yhat.toFixed(1)}</div>
            <div className="text-sm font-semibold">{day.Risk_Level}</div>
          </div>
        ))}
      </div>
      <StressHeatmap data={filteredHSI} />
      
    </div>
  );
}
