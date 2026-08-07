type CounterProps = {
  label: string;
  value: number;
  increments: number[];
  onChange: (newValue: number) => void;
};

export function Counter({ label, value, increments, onChange }: CounterProps) {
  return (
    <div>
      <span className="text-sm font-medium">{label}</span>

      <div className="datatable">
        {/* Decrement buttons */}
        {increments.map((inc) => (
          <button
            key={`minus-${inc}`}
            onClick={() => onChange(Math.max(0, value - inc))}
          >
            {`-${inc}`}
          </button>
        ))}

        <span>{value}</span>

        {/* Increment buttons */}
        {increments.reverse().map((inc) => (
          <button key={`plus-${inc}`} onClick={() => onChange(value + inc)}>
            {`+${inc}`}
          </button>
        ))}
      </div>
    </div>
  );
}
