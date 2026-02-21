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

  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filteredHSI, setFilteredHSI] = useState([]);

  const [beds, setBeds] = useState(0);
  const [icu, setIcu] = useState(0);
  const [ventilator, setVentilator] = useState(0);
  const [hsi, setHsi] = useState(0);

  const [tempBeds, setTempBeds] = useState(0);
  const [tempIcu, setTempIcu] = useState(0);
  const [tempVentilator, setTempVentilator] = useState(0);

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
    fetch(`${BASE_URL}/trend`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(item => ({
          day: item.day,
          beds: item.beds,
          icu: item.icu,
          ventilator: item.ventilator
        }));

        setHistory(formatted);
        setFilteredHistory(formatted);
      })
      .catch(err => console.error("Trend error:", err));
  }, []);

  /* ================= LOAD HSI TREND ================= */

  useEffect(() => {
    fetch(`${BASE_URL}/hsi_trend`)
      .then(res => res.json())
      .then(data => {
        setHsiTrend(data);
        setFilteredHSI(data);
      })
      .catch(err => console.error("HSI error:", err));
  }, []);

  /* ================= LOAD FORECAST ================= */

  useEffect(() => {
    fetch(`${BASE_URL}/forecast`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setForecastData(data);
        }
      })
      .catch(err => console.error("Forecast error:", err));
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

  /* ================= USAGE FILTER ================= */

  const applyUsageFilter = () => {
    if (!usageFrom || !usageTo) {
      alert("Select both usage dates");
      return;
    }

    const filtered = history.filter(
      row => row.day >= usageFrom && row.day <= usageTo
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
      row => row.Date >= hsiFrom && row.Date <= hsiTo
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

    setFilteredHistory(prev => [
      ...prev,
      {
        day: "Manual",
        beds: bedsUsage,
        icu: icuUsage,
        ventilator: ventUsage
      }
    ]);
  };

  /* ================= MERGE HISTORY + FORECAST ================= */

  const combinedUsage = [
    ...filteredHistory,
    ...forecastData.map(d => ({
      day: d.ds,
      beds: d.beds,
      icu: d.icu,
      ventilator: d.ventilator
    }))
  ];

  const combinedHSI = [
    ...filteredHSI,
    ...forecastData.map(d => ({
      Date: d.ds,
      HSI: d.yhat
    }))
  ];

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white px-6 py-8">
      <h1 className="text-4xl font-bold">
        Hospital Resource Dashboard
      </h1>

      <div className="mt-8">
        <InputCard
          inputs={inputs}
          setInputs={setInputs}
          onUpdate={handleManualUpdate}
        />
      </div>

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

      <UsageChart history={combinedUsage} />

      <HSIChart data={combinedHSI} />

      <ForecastChart data={forecastData} />

      <StressHeatmap data={forecastData} />
    </div>
  );
}