export function PixelSloth({ size = 68 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      fill="none"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <rect x="7" y="1" width="3" height="3" fill="#2A1B12" />
      <rect x="21" y="1" width="3" height="3" fill="#2A1B12" />
      <rect x="8" y="0" width="1" height="2" fill="#160D08" />
      <rect x="22" y="0" width="1" height="2" fill="#160D08" />
      <rect x="6" y="3" width="4" height="8" fill="#9A6B43" />
      <rect x="21" y="3" width="4" height="8" fill="#9A6B43" />
      <rect x="7" y="4" width="2" height="6" fill="#D9A673" />
      <rect x="22" y="4" width="2" height="6" fill="#D9A673" />
      <rect x="6" y="9" width="20" height="15" fill="#9A6B43" />
      <rect x="4" y="12" width="24" height="9" fill="#9A6B43" />
      <rect x="7" y="10" width="18" height="14" fill="#B88555" />
      <rect x="9" y="11" width="14" height="12" fill="#D9A673" />
      <rect x="6" y="23" width="20" height="3" fill="#9A6B43" />
      <rect x="9" y="26" width="14" height="2" fill="#2A1B12" />
      <rect x="10" y="12" width="12" height="8" fill="#EFE3C8" />
      <rect x="9" y="14" width="14" height="4" fill="#EFE3C8" />
      <rect x="11" y="13" width="3" height="3" fill="#9A6B43" />
      <rect x="18" y="13" width="3" height="3" fill="#9A6B43" />
      <path d="M11 15h1v-1h1v1h1M18 15h1v-1h1v1h1" stroke="#2A1B12" strokeWidth="1" />
      <rect x="15" y="16" width="2" height="2" fill="#B88555" />
      <rect x="15" y="16" width="1" height="1" fill="#2A1B12" />
      <path d="M15 19h1v1h1" stroke="#2A1B12" strokeWidth="1" />
      <rect x="8" y="17" width="2" height="1" fill="#D9A673" />
      <rect x="22" y="17" width="2" height="1" fill="#D9A673" />
    </svg>
  );
}
