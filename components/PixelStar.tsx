import type { SVGProps } from "react";

interface PixelStarProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function PixelStar({ size = 16, className = "", ...props }: PixelStarProps) {
  return (
    <svg
      className={`pixel-star ${className}`}
      width={size}
      height={size}
      viewBox="0 0 15 15"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Center cross and body */}
      <path d="M7 0h1v15H7z" />
      <path d="M0 7h15v1H0z" />
      <path d="M6 3h3v9H6z" />
      <path d="M5 5h5v5H5z" />
      <path d="M4 6h7v3H4z" />
      {/* 4-corner pixel twinkle motes */}
      <path d="M3 3h1v1H3z" />
      <path d="M11 3h1v1H11z" />
      <path d="M3 11h1v1H3z" />
      <path d="M11 11h1v1H11z" />
    </svg>
  );
}
