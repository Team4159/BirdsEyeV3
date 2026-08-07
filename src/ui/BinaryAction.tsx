import type { LucideIcon } from "lucide-react";

type BinaryActionProps = {
  label: string;
  onYes: () => void;
  onNo: () => void;
  yesIcon: LucideIcon;
  noIcon: LucideIcon;
};

export function BinaryAction({
  label,
  onYes,
  onNo,
  yesIcon: YesIcon,
  noIcon: NoIcon,
}: BinaryActionProps) {
  return (
    <div className="datatable">
      <button onClick={onNo} className="square-button binary-action-button no">
        {NoIcon ? <NoIcon /> : "No"}
      </button>

      <span style={{ flexGrow: 1, textAlign: "center" }}>{label}</span>

      <button
        onClick={onYes}
        className="square-button binary-action-button yes"
      >
        {YesIcon ? <YesIcon /> : "Yes"}
      </button>
    </div>
  );
}
