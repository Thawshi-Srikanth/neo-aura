import type { MouseEventHandler } from "react";
import type { ZoomApi } from "./CameraZoomApi";

export default function ZoomDolly({ api }: { api?: ZoomApi | null }) {
  const onIn: MouseEventHandler<HTMLButtonElement> = () => api?.zoomIn();
  const onOut: MouseEventHandler<HTMLButtonElement> = () => api?.zoomOut();
  const onReset: MouseEventHandler<HTMLButtonElement> = () => api?.reset();

  return (
    <div className="fixed right-4 bottom-20 z-50 flex flex-col items-center gap-2 select-none">
      <button
        onClick={onIn}
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 hover:text-2xl text-white font-bold backdrop-blur-md"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={onReset}
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 hover:text-2xl text-white font-bold backdrop-blur-md"
        title="Reset zoom"
      >
        ↺
      </button>
      <button
        onClick={onOut}
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 hover:text-2xl text-white font-bold backdrop-blur-md"
        title="Zoom out"
      >
        –
      </button>
    </div>
  );
}
