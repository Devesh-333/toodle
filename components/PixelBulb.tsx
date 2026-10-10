export function PixelBulb({ size = 22 }: { size?: number }) {
  return (
    <svg className="pixel-bulb" aria-hidden="true" width={size} height={size} viewBox="0 0 16 18" shapeRendering="crispEdges" fill="none">
      <path d="M5 0h6v2h2v2h2v5h-2v2h-2v2H5v-2H3V11H1V4h2V2h2V0Z" fill="#F7C948" />
      <path d="M6 13h4v2H6zm1 2h2v2H7z" fill="#68717B" />
      <path d="M7 4h2v3h2v2H9v2H7V9H5V7h2z" fill="#FFF4C2" />
      <path d="M5 17h6v1H5z" fill="#343C46" />
    </svg>
  );
}
