// @/components/utils/VideoViewerModal.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Download,
  PictureInPicture2,
  Repeat,
  Link2,
  Camera,
  Check,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { any } from "zod";

interface VideoViewerModalProps {
  open: boolean;
  videoUrl: string;
  title?: string;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoViewerModal({
  open,
  videoUrl,
  title,
  onClose,
}: VideoViewerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [loop, setLoop] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [screenshotTaken, setScreenshotTaken] = useState(false);

  // ── Download state ──
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null); // null = idle, 0-100 = downloading
  const [downloadDone, setDownloadDone] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Open/Close animation ──
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setIsClosing(false);
      setPlaying(false);
      setCurrentTime(0);
      setSpeed(1);
      setLoop(false);
      setShowControls(true);
      setShowMoreMenu(false);
      setShowSpeedMenu(false);
      document.body.style.overflow = "hidden";
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, shouldRender]);

  const handleClose = () => {
    // Cancel any in-progress download
    abortControllerRef.current?.abort();
    setIsClosing(true);
    setTimeout(() => onClose(), 250);
  };

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { handleClose(); return; }
      if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
      if (e.key === "m") toggleMute();
      if (e.key === "f") toggleFullscreen();
      if (e.key === "l") toggleLoop();
      if (e.key === "ArrowRight") skip(10);
      if (e.key === "ArrowLeft") skip(-10);
      if (e.key === "ArrowUp") { e.preventDefault(); changeVolume(0.1); }
      if (e.key === "ArrowDown") { e.preventDefault(); changeVolume(-0.1); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, playing, volume, loop]);

  // ── PiP listeners ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnter = () => setIsPiP(true);
    const onLeave = () => setIsPiP(false);
    v.addEventListener("enterpictureinpicture", onEnter);
    v.addEventListener("leavepictureinpicture", onLeave);
    return () => {
      v.removeEventListener("enterpictureinpicture", onEnter);
      v.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const newVol = Math.max(0, Math.min(1, v.volume + delta));
    v.volume = newVol;
    setVolume(newVol);
    setMuted(newVol === 0);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleLoop = () => {
    const v = videoRef.current;
    if (!v) return;
    const newLoop = !loop;
    v.loop = newLoop;
    setLoop(newLoop);
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch (err) {
      console.error("PiP error:", err);
    }
  };

  const skip = (secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + secs, v.duration));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setMuted(val === 0);
    }
  };

  const handleSpeedChange = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setShowSpeedMenu(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * duration;
  };

  // ── Download with progress ──
  const handleDownload = async () => {
    if (downloadProgress !== null) return; // already downloading

    setDownloadProgress(0);
    setDownloadDone(false);
    setShowMoreMenu(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(videoUrl, { signal: controller.signal });

      if (!response.ok) throw new Error("Download failed");

      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : null;
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) {
          setDownloadProgress(Math.round((received / total) * 100));
        } else {
          // No content-length — show indeterminate by cycling 0–90
          setDownloadProgress((prev) => Math.min((prev ?? 0) + 5, 90));
        }
      }

      // Merge chunks into blob
      const blob = new Blob(chunks as any, { type: "video/mp4" }  );
      const url = URL.createObjectURL(blob);

      // Get extension from videoUrl
      const urlExt = videoUrl.split("?")[0].split(".").pop() ?? "mp4";
      const fileName = title
        ? `${title.replace(/[^a-zA-Z0-9_\-. ]/g, "_")}.${urlExt}`
        : `video.${urlExt}`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setDownloadDone(true);
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadDone(false);
      }, 2500);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // cancelled — silently reset
      } else {
        console.error("Download error:", err);
      }
      setDownloadProgress(null);
      setDownloadDone(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = videoUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMoreMenu(false);
  };

  const handleScreenshot = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.download = `${title || "screenshot"}_${Math.floor(v.currentTime)}s.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setScreenshotTaken(true);
    setTimeout(() => setScreenshotTaken(false), 2000);
    setShowMoreMenu(false);
  };

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (playing) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  if (!shouldRender) return null;

  const isDownloading = downloadProgress !== null && !downloadDone;

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[999999]
        backdrop-blur-sm
        flex items-center justify-center
        transition-all duration-200
        ${isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"}
      `}
      style={{ pointerEvents: "auto" }}
    >
      {/* ── Video Container ── */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-black shadow-2xl w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[75vw] max-w-7xl"
        onMouseMove={resetHideTimer}
        onMouseLeave={() => playing && setShowControls(false)}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 bg-white p-1.5 sm:p-2 rounded-md"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
        </button>

        {/* ── Top Bar ── */}
        <div
          className={`
            absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-8
            bg-gradient-to-b from-black/70 to-transparent
            flex items-center gap-3
            transition-opacity duration-300
            ${showControls ? "opacity-100" : "opacity-0"}
          `}
        >
          <p className="text-sm font-medium text-white truncate max-w-[70%]">
            {title || "Video"}
          </p>
          <div className="flex items-center gap-2">
            {loop && (
              <span className="text-[10px] text-white/60 border border-white/20 px-1.5 py-0.5 rounded">
                LOOP
              </span>
            )}
            {isPiP && (
              <span className="text-[10px] text-white/60 border border-white/20 px-1.5 py-0.5 rounded">
                PiP
              </span>
            )}
          </div>
        </div>

        {/* ── Download Progress Bar (top of video) ── */}
        {downloadProgress !== null && (
          <div className="absolute top-0 left-0 right-0 z-40 h-1 bg-white/10">
            <div
              className={`h-full transition-all duration-300 ${downloadDone ? "bg-green-400" : "bg-primary"}`}
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}

        {/* ── Video ── */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video object-contain bg-black"
          onClick={togglePlay}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v) return;
            setCurrentTime(v.currentTime);
            if (v.buffered.length > 0) {
              setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onEnded={() => { if (!loop) setPlaying(false); }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {/* ── Center Play overlay ── */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center pointer-events-none
            transition-opacity duration-300
            ${showControls ? "opacity-100" : "opacity-0"}
          `}
        >
          {!playing && (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-5 h-5 sm:w-7 sm:h-7 text-white fill-white ml-0.5 sm:ml-1" />
            </div>
          )}
        </div>

        {/* ── Bottom Controls ── */}
        <div
          className={`
            absolute bottom-0 left-0 right-0 z-20 px-2 pb-1.5 pt-6 sm:px-4 sm:pb-4 sm:pt-8
            bg-gradient-to-t from-black/80 to-transparent
            transition-opacity duration-300
            ${showControls ? "opacity-100" : "opacity-0"}
          `}
        >
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="relative w-full h-1.5 rounded-full bg-white/20 cursor-pointer mb-1.5 sm:mb-3 group/progress"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full rounded-full bg-white/30"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute h-full rounded-full bg-primary"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div
              className="absolute w-3 h-3 rounded-full bg-white opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{
                left: `${duration ? (currentTime / duration) * 100 : 0}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => skip(-10)}
                className="hidden sm:block p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                title="Rewind 10s (←)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                {playing
                  ? <Pause className="w-5 h-5 fill-white" />
                  : <Play className="w-5 h-5 fill-white ml-0.5" />
                }
              </button>

              <button
                onClick={() => skip(10)}
                className="hidden sm:block p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                title="Forward 10s (→)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                  title="Mute (M)"
                >
                  {muted || volume === 0
                    ? <VolumeX className="w-4 h-4" />
                    : <Volume2 className="w-4 h-4" />
                  }
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-white h-1 cursor-pointer hidden sm:block"
                />
              </div>

              <span className="text-xs text-white/70 tabular-nums ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5">
              {/* Loop */}
              <button
                onClick={toggleLoop}
                className={`hidden sm:block p-1.5 rounded-full transition-colors ${
                  loop
                    ? "bg-white/20 text-white"
                    : "hover:bg-white/10 text-white/50 hover:text-white"
                }`}
                title="Loop (L)"
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* PiP */}
              <button
                onClick={togglePiP}
                className={`hidden sm:block p-1.5 rounded-full transition-colors ${
                  isPiP
                    ? "bg-white/20 text-white"
                    : "hover:bg-white/10 text-white/50 hover:text-white"
                }`}
                title="Picture in Picture"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

              {/* Download button with progress */}
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`relative p-1.5 rounded-full transition-colors ${
                  downloadDone
                    ? "bg-green-500/30 text-green-400"
                    : isDownloading
                      ? "bg-white/10 text-white/50 cursor-not-allowed"
                      : "hover:bg-white/10 text-white/80 hover:text-white"
                }`}
                title="Download"
              >
                {downloadDone ? (
                  <Check className="w-4 h-4" />
                ) : isDownloading ? (
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {/* Percentage tooltip */}
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white/80 bg-black/60 px-1 py-0.5 rounded whitespace-nowrap">
                      {downloadProgress}%
                    </span>
                  </div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>

              {/* Speed */}
              <div className="relative">
                <button
                  onClick={() => { setShowSpeedMenu((p) => !p); setShowMoreMenu(false); }}
                  className="px-2 py-1 rounded-md text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {speed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-9 right-0 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[90px] z-30">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`
                          w-full text-left px-3 py-1.5 text-xs transition-colors
                          ${speed === s
                            ? "text-primary font-semibold bg-primary/10"
                            : "text-foreground hover:bg-muted"
                          }
                        `}
                      >
                        {s === 1 ? "Normal" : `${s}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* More options */}
              <div className="relative">
                <button
                  onClick={() => { setShowMoreMenu((p) => !p); setShowSpeedMenu(false); }}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <div className="absolute bottom-9 right-0 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[160px] z-30">
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      {copied
                        ? <Check className="w-3.5 h-3.5 text-green-500" />
                        : <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                      onClick={handleScreenshot}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      {screenshotTaken
                        ? <Check className="w-3.5 h-3.5 text-green-500" />
                        : <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                      {screenshotTaken ? "Saved!" : "Screenshot"}
                    </button>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="hidden sm:block p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                title="Fullscreen (F)"
              >
                {isFullscreen
                  ? <Minimize className="w-4 h-4" />
                  : <Maximize className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3  text-[10px] pointer-events-none select-none whitespace-nowrap">
        <span>Space — Play/Pause</span>
        <span>·</span>
        <span>← → — Skip 10s</span>
        <span>·</span>
        <span>↑ ↓ — Volume</span>
        <span>·</span>
        <span>M — Mute</span>
        <span>·</span>
        <span>L — Loop</span>
        <span>·</span>
        <span>F — Fullscreen</span>
      </div>
    </div>,
    document.body
  );
}