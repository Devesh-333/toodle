"use client";

import React from "react";

export function QuestionnaireAtmosphere() {
  return (
    <div className="quest-atmosphere-root" aria-hidden="true">
      {/* 1. Cinematic Pixel Meadow Scenery Layer */}
      <div className="quest-meadow-scenery" />

      {/* 2. Deep Midnight & Moss Vignette Overlay */}
      <div className="quest-vignette-overlay" />

      {/* 3. Multi-Layered Radial Spotlight Behind Workstation */}
      <div className="quest-radial-spotlight" />

      {/* 4. Ambient Floating Meadow Fireflies */}
      <div className="quest-fireflies">
        <span className="quest-firefly quest-firefly-1" />
        <span className="quest-firefly quest-firefly-2" />
        <span className="quest-firefly quest-firefly-3" />
        <span className="quest-firefly quest-firefly-4" />
        <span className="quest-firefly quest-firefly-5" />
      </div>

      {/* 5. Micro-Texture / Grain Overlay */}
      <div className="quest-grain-overlay" />

      {/* 6. Subtle Retro HUD Corner Brackets */}
      <div className="quest-corner quest-corner-tl" />
      <div className="quest-corner quest-corner-tr" />
      <div className="quest-corner quest-corner-bl" />
      <div className="quest-corner quest-corner-br" />
    </div>
  );
}
