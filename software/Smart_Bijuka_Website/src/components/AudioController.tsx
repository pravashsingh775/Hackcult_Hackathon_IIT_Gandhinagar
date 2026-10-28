import * as React from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Radio,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AudioControllerProps {
  apiBaseUrl: string;
  selectedFile: string;
  availableFiles: string[];
  audioEnabled: boolean;
  volume: number;
  onRefresh: () => void;
}

export const AudioController: React.FC<AudioControllerProps> = ({
  apiBaseUrl,
  selectedFile,
  availableFiles,
  audioEnabled,
  volume,
  onRefresh,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentVolume, setCurrentVolume] = React.useState(volume);
  const [enabled, setEnabled] = React.useState(audioEnabled);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setCurrentVolume(volume);
    setEnabled(audioEnabled);
  }, [volume, audioEnabled]);

  const handlePlayPreview = async () => {
    try {
      setIsPlaying(true);
      const res = await fetch(`${apiBaseUrl}/api/audio/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Playing pre-recorded voice: ${selectedFile}`);
      } else {
        toast.error("Could not play audio track.");
      }
    } catch (err) {
      toast.error(`Audio service error: ${err}`);
    } finally {
      setTimeout(() => setIsPlaying(false), 2500);
    }
  };

  const handleStopAudio = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/audio/stop`, { method: "POST" });
      setIsPlaying(false);
      toast.info("Audio playback stopped.");
    } catch (err) {
      toast.error(`Error stopping audio: ${err}`);
    }
  };

  const handleSelectTrack = async (filename: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/audio/select?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Active deterrent voice set to ${filename}`);
        onRefresh();
      }
    } catch (err) {
      toast.error(`Error setting audio file: ${err}`);
    }
  };

  const handleToggleEnabled = async (checked: boolean) => {
    setEnabled(checked);
    try {
      await fetch(`${apiBaseUrl}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_enabled: checked }),
      });
      toast.success(checked ? "Bioacoustic deterrent audio enabled" : "Audio deterrent muted");
      onRefresh();
    } catch (err) {
      toast.error(`Failed to update setting: ${err}`);
    }
  };

  const handleVolumeChange = async (vals: number[]) => {
    const newVol = vals[0];
    setCurrentVolume(newVol);
    try {
      await fetch(`${apiBaseUrl}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_volume: newVol }),
      });
    } catch (err) {
      // silent
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const res = await fetch(`${apiBaseUrl}/api/audio/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Uploaded and selected: ${data.filename}`);
        onRefresh();
      } else {
        toast.error(data.detail || "Upload failed");
      }
    } catch (err) {
      toast.error(`Upload error: ${err}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-[#d6e4d2] bg-white/90 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#e5efe1]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#eaf4e7] text-[#2d6a4f]">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-stone-800">Pre-Recorded Deterrent Voice</CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Acoustic distress frequencies & human calls authorized only for animals
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="audio-toggle" className="text-xs text-stone-600 font-medium">
              {enabled ? "Active" : "Muted"}
            </Label>
            <Switch
              id="audio-toggle"
              checked={enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Track Selection & Upload */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
            <span>Select Recorded Audio Track</span>
            <span className="text-[11px] font-normal text-stone-500">
              {availableFiles.length} file(s) available
            </span>
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableFiles.map((fname) => (
              <button
                key={fname}
                onClick={() => handleSelectTrack(fname)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-all ${
                  selectedFile === fname
                    ? "border-[#2d6a4f] bg-[#eef7ec] text-[#1b4332] font-semibold ring-1 ring-[#2d6a4f]/20"
                    : "border-stone-200 hover:border-stone-300 text-stone-600 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileAudio className={`h-3.5 w-3.5 shrink-0 ${selectedFile === fname ? "text-[#2d6a4f]" : "text-stone-400"}`} />
                  <span className="truncate">{fname}</span>
                </div>
                {selectedFile === fname && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Volume Slider & Playback Controls */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-1/2 flex items-center gap-3">
            <span className="text-xs text-stone-500 font-medium">Volume:</span>
            <Slider
              value={[currentVolume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
            <span className="text-xs font-mono text-stone-600 w-9 text-right">
              {(currentVolume * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadFile}
              accept=".mp3,.wav,.ogg"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs border-stone-200 text-stone-700 hover:bg-stone-50"
            >
              <Upload className="h-3.5 w-3.5 mr-1 text-stone-500" />
              Upload Audio
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleStopAudio}
              disabled={!isPlaying}
              className="text-xs text-stone-600"
            >
              <Square className="h-3 w-3 mr-1 text-stone-500" />
              Stop
            </Button>

            <Button
              size="sm"
              onClick={handlePlayPreview}
              disabled={!enabled || isPlaying}
              className="text-xs bg-[#2d6a4f] hover:bg-[#1b4332] text-white"
            >
              <Play className="h-3 w-3 mr-1 fill-white" />
              Test Voice
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

