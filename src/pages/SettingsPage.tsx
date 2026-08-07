import { Send, Trash2 } from "lucide-react";
import { BinaryAction } from "../ui/BinaryAction";
import { formatMatchLabel } from "../util/matchUtil";
import type { MatchScoutingForm } from "../models/MatchScouting";

type SettingsPageProps = {
  tbaKey: string;
  tbaKeyResponse: string | null;
  onTbaKeyChange: (tbaKey: string) => void;
  offlineFormQueue: MatchScoutingForm[];
  onOfflineFormYes: (form: MatchScoutingForm) => void;
  onOfflineFormNo: (form: MatchScoutingForm) => void;
};

export function SettingsPage({
  tbaKey,
  tbaKeyResponse,
  onTbaKeyChange,
  offlineFormQueue,
  onOfflineFormYes,
  onOfflineFormNo,
}: SettingsPageProps) {
  return (
    <div>
      <div className="card">
        <h1>TBA API Key</h1>
        <input
          id="tba-api-key-form"
          type="text"
          value={tbaKey}
          onChange={(e) => {
            const tbaKey = e.target.value;
            onTbaKeyChange(tbaKey);
          }}
          placeholder="Enter your TBA API key"
        />
        <span>
          {tbaKey === ""
            ? null
            : tbaKeyResponse === null
              ? "Verified!"
              : tbaKeyResponse}
        </span>
      </div>
      {offlineFormQueue.length > 0 && (
        <div className="card">
          <h1>Offline Form Queue</h1>
          {offlineFormQueue.map((form, index) => (
            <BinaryAction
              key={`offline-form-item-${index}`}
              label={`${form.matchScoutingMetadata.eventCode}, ${formatMatchLabel(form.matchScoutingMetadata.match)}, ${form.matchScoutingMetadata.team.substring(3)}`}
              onYes={() => {
                onOfflineFormYes(form);
              }}
              onNo={() => {
                onOfflineFormNo(form);
              }}
              yesIcon={Send}
              noIcon={Trash2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
