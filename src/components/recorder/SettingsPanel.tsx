import { Mic, MicOff, Timer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SettingsPanelProps {
  includeMic: boolean;
  onMicChange: (val: boolean) => void;
  maxDuration: number;
  onMaxDurationChange: (val: number) => void;
  disabled?: boolean;
}

const DURATION_OPTIONS = [
  { value: 0, label: "No limit" },
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
];

export function SettingsPanel({
  includeMic,
  onMicChange,
  maxDuration,
  onMaxDurationChange,
  disabled = false,
}: SettingsPanelProps) {
  const currentDurationLabel = DURATION_OPTIONS.find((d) => d.value === maxDuration)?.label || "Custom";

  return (
    <div className="glass rounded-xl p-5 space-y-5">
      <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-muted-foreground">Settings</h3>

      {/* Mic toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {includeMic ? (
            <Mic className="h-4 w-4 text-primary" />
          ) : (
            <MicOff className="h-4 w-4 text-muted-foreground" />
          )}
          <Label htmlFor="mic-toggle" className="text-sm cursor-pointer">
            Microphone audio
          </Label>
        </div>
        <Switch id="mic-toggle" checked={includeMic} onCheckedChange={onMicChange} disabled={disabled} />
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Max duration</Label>
          </div>
          <span className="text-sm font-medium text-primary">{currentDurationLabel}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onMaxDurationChange(opt.value)}
              disabled={disabled}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                maxDuration === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
