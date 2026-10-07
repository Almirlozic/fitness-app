"use client";

import { useEffect, useRef, useState } from "react";
import { TextField } from "../TextField";

// Stregkoder på dagligvarer
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"] as const;
const SCAN_INTERVAL_MS = 250;

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type Status = "starting" | "scanning" | "denied" | "no_camera" | "insecure" | "error";

/**
 * Bruger telefonens indbyggede BarcodeDetector, hvor den findes (Android Chrome).
 * Ellers (fx iPhone) ZXing som WebAssembly – filen ligger i public/zxing/.
 */
async function createDetector(): Promise<Detector> {
  const Native = (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector as
    | (new (o: { formats: string[] }) => Detector) & { getSupportedFormats(): Promise<string[]> }
    | undefined;
  if (Native) {
    try {
      const supported = await Native.getSupportedFormats();
      const formats = FORMATS.filter((f) => supported.includes(f));
      if (formats.length > 0) return new Native({ formats });
    } catch {
      // Falder tilbage til ZXing
    }
  }
  const { BarcodeDetector, setZXingModuleOverrides } = await import("barcode-detector/ponyfill");
  setZXingModuleOverrides({
    locateFile: (path: string, prefix: string) =>
      path.endsWith(".wasm") ? "/zxing/zxing_reader.wasm" : prefix + path,
  });
  return new BarcodeDetector({ formats: [...FORMATS] });
}

const MESSAGES: Record<Exclude<Status, "starting" | "scanning">, string> = {
  denied:
    "Kameraet er ikke tilladt. Giv adgang i browserens indstillinger (på iPhone: Indstillinger → Safari → Kamera), eller skriv stregkoden herunder.",
  no_camera: "Der blev ikke fundet et kamera. Skriv stregkoden herunder.",
  insecure: "Kameraet kræver en sikker forbindelse (HTTPS). Skriv stregkoden herunder.",
  error: "Kameraet kunne ikke startes. Skriv stregkoden herunder.",
};

export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("starting");
  const [manual, setManual] = useState("");
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;

    // Stopper kameraet – kaldes, når fanen forlades, eller en kode er fundet
    const stop = () => {
      stopped = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      if (!window.isSecureContext) return setStatus("insecure");
      if (!navigator.mediaDevices?.getUserMedia) return setStatus("no_camera");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        if (stopped) return stop();
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        const detector = await createDetector();
        if (stopped) return;
        setStatus("scanning");

        let busy = false;
        timer = setInterval(async () => {
          if (busy || video.readyState < 2) return;
          busy = true;
          try {
            const [code] = await detector.detect(video);
            if (code?.rawValue && !stopped) {
              stop();
              navigator.vibrate?.(50);
              onDetectedRef.current(code.rawValue);
            }
          } catch {
            // Enkelte billeder kan fejle; prøv igen ved næste interval
          } finally {
            busy = false;
          }
        }, SCAN_INTERVAL_MS);
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        setStatus(
          name === "NotAllowedError" || name === "SecurityError"
            ? "denied"
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "no_camera"
              : "error",
        );
        stop();
      }
    })();

    return stop;
  }, []);

  const failed = status !== "starting" && status !== "scanning";

  return (
    <div className="flex flex-col gap-space-lg">
      {!failed && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary">
          <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />
          {/* Sigtelinje */}
          <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-24 -translate-y-1/2 border-2 border-on-primary/80" />
          <p className="absolute inset-x-0 bottom-0 bg-primary/70 py-space-xs text-center font-mono text-caption-mono uppercase text-on-primary">
            {status === "starting" ? "Starter kamera …" : "Hold stregkoden inden for rammen"}
          </p>
        </div>
      )}

      {failed && (
        <p role="alert" className="border-l-2 border-error py-space-xs pl-space-sm font-mono text-caption-mono text-error">
          {MESSAGES[status]}
        </p>
      )}

      <form
        className="flex items-end gap-space-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const code = manual.replace(/\D/g, "");
          if (code) onDetected(code);
        }}
      >
        <div className="flex-1">
          <TextField
            id="manual-barcode"
            label="Eller skriv stregkoden"
            inputMode="numeric"
            autoComplete="off"
            placeholder="fx 5701211015703"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 border border-primary px-space-md text-label-caps uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary"
        >
          Slå op
        </button>
      </form>
    </div>
  );
}
