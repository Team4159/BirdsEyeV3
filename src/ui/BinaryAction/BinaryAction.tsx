import type { LucideIcon } from "lucide-react";
import styles from "./BinaryAction.module.css";

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
    <div className="data-table">
      <button
        onClick={onNo}
        className={`${styles["square-button"]} ${styles["binary-action-button"]} ${styles["no"]}`}
      >
        {NoIcon ? <NoIcon /> : "No"}
      </button>

      <span style={{ flexGrow: 1, textAlign: "center" }}>{label}</span>

      <button
        onClick={onYes}
        className={`${styles["square-button"]} ${styles["binary-action-button"]} ${styles["yes"]}`}
      >
        {YesIcon ? <YesIcon /> : "Yes"}
      </button>
    </div>
  );
}
