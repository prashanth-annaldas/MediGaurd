import { Plus, Minus } from "lucide-react";

export default function ResourceCard({
  title,
  tempValue,
  setTempValue,
  actualValue,
  icon: Icon,
  color,
}) {
  const increase = () => {
    if (tempValue < 100) setTempValue((prev) => prev + 1);
  };

  const decrease = () => {
    if (tempValue > 0) setTempValue((prev) => prev - 1);
  };

  return (
    <div className="bg-gradient-to-br from-[#1c1c1f] to-[#141417] border border-yellow-600/30 rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="p-3 rounded-xl bg-yellow-600/10 border border-yellow-600/30">
          <Icon className="text-yellow-500" size={24} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={decrease}
            className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition"
          >
            <Minus size={16} />
          </button>

          <button
            onClick={increase}
            className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-gray-400 text-sm">{title}</p>
        <h2 className="text-4xl font-bold text-white mt-2">
          {tempValue}%
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Current: {actualValue}%
        </p>
      </div>

      <div className="mt-6 h-2 w-full bg-gray-700 rounded-full">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${tempValue}%` }}
        />
      </div>
    </div>
  );
}