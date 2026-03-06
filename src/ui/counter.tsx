import { Minus, Plus } from "lucide-react";

type CounterProps = {
  label: string;
  value: number;
  increments: number[];
  onChange: (newValue: number) => void;
};

export const Counter: React.FC<CounterProps> = ({
  label,
  value,
  increments,
  onChange,
}) => (
  <div
  >
    <span className="text-sm font-medium">{label}</span>

    <div className="datatable">
      {/* Decrement buttons */}
      {increments.map((inc) => (
        <button
          key={`minus-${inc}`}
          onClick={() => onChange(Math.max(0, value - inc))}
        >
          <Minus size={14} /> {inc}
        </button>
      ))}

      <span>{value}</span>

      {/* Increment buttons */}
      {increments.map((inc) => (
        <button
          key={`plus-${inc}`}
          onClick={() => onChange(value + inc)}
        >
          <Plus size={14} /> {inc}
        </button>
      ))}
    </div>
  </div>
);