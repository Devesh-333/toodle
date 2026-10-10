export type PixelIconName = "quote" | "report" | "problem" | "market" | "competition" | "money" | "build" | "arrow" | "check" | "spark";

const shapes: Record<PixelIconName, string> = {
  quote: "M3 4h18v13H13l-5 4v-4H3V4zm4 4v3h4V8H7zm7 0v3h4V8h-4z",
  report: "M5 2h10l5 5v15H5V2zm3 9h8v2H8v-2zm0 4h8v2H8v-2zm0 4h5v2H8v-2zm6-15v4h4l-4-4z",
  problem: "M10 2h4v2h3v2h2v3h2v5h-2v3h-2v2h-3v2h-4v-2H7v-2H5v-3H3V9h2V6h2V4h3V2zm2 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm8 10 2 2-4 4-2-2 4-4z",
  market: "M3 20h18v2H3v-2zm2-3h3V9H5v8zm5 0h3V4h-3v13zm5 0h3v-6h-3v6z",
  competition: "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
  money: "M12 2h2v2h3v2h2v4h-4V8h-6v2h7v2h2v6h-2v2h-4v2h-2v-2H7v-2H5v-4h4v2h6v-2H8v-2H6V6h2V4h4V2z",
  build: "M4 4h16v3h2v13H2V7h2V4zm3 3h10V6H7v1zm-2 4v6h3v-6H5zm6 0v6h3v-6h-3zm6 0v6h2v-6h-2z",
  arrow: "M3 11h13L11 6l2-2 9 8-9 8-2-2 5-5H3v-2z",
  check: "M2 12h4v4H2v-4zm4 4h4v4H6v-4zm4-4h4v4h-4v-4zm4-4h4v4h-4V8zm4-4h4v4h-4V4z",
  spark: "M11 2h2v7h-2V2zm0 13h2v7h-2v-7zM2 11h7v2H2v-2zm13 0h7v2h-7v-2zm-1.4-5 1.4 1.4-3.1 3.1-1.4-1.4L13.6 6zm-3.2 7.8 1.4 1.4-3.2 3.2-1.4-1.4 3.2-3.2zm4.6 0 3.2 3.2-1.4 1.4-3.2-3.2 1.4-1.4zM8.2 6l3.2 3.2-1.4 1.4-3.2-3.2L8.2 6z",
};

export function PixelIcon({ name, size = 20, className }: { name: PixelIconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" shapeRendering="crispEdges"><path fill="currentColor" d={shapes[name]} /></svg>;
}
