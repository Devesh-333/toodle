"use client";

import React, { useState, useEffect, useRef } from "react";
import { HeroTaskStream } from "@/components/HeroTaskStream";

export function PixelFrogInteractive() {
  const [frame, setFrame] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const animRef = useRef<NodeJS.Timeout | null>(null);

  const startAnim = (forward: boolean) => {
    if (animRef.current) clearInterval(animRef.current);

    animRef.current = setInterval(() => {
      setFrame((prev) => {
        if (forward) {
          if (prev >= 3) {
            if (animRef.current) clearInterval(animRef.current);
            return 3;
          }
          return prev + 1;
        } else {
          if (prev <= 0) {
            if (animRef.current) clearInterval(animRef.current);
            return 0;
          }
          return prev - 1;
        }
      });
    }, 45);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    startAnim(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    startAnim(false);
  };

  const handleClick = () => {
    setIsHovered(true);
    startAnim(true);
    setTimeout(() => {
      setIsHovered(false);
      startAnim(false);
    }, 650);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  return (
    <div
      className={`pixel-creature pixel-frog ${isHovered ? "is-active" : ""}`}
      role="img"
      aria-label="Pixel frog sitting in the meadow grass. Hover or click to see its tongue catch a fly!"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      data-frame={frame}
    >
      <HeroTaskStream />
      <div
        className="pixel-frog-sprite"
        style={{
          backgroundPosition: `${(frame / 3) * 100}% 0%`,
        }}
      />
    </div>
  );
}
