"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";

interface TaskItem {
  id: string;
  status: "done" | "running";
  label: string;
  task: string;
}

const TASK_POOL: TaskItem[] = [
  { id: "t1", status: "done",    label: "[SYS:OK]",  task: "Pain point verified"    },
  { id: "t2", status: "running", label: "[SYS:RUN]", task: "Market demand check"    },
  { id: "t3", status: "done",    label: "[SYS:OK]",  task: "Competitors scanned"    },
  { id: "t4", status: "done",    label: "[SYS:OK]",  task: "Reddit signals parsed"  },
  { id: "t5", status: "running", label: "[SYS:RUN]", task: "Willingness-to-pay"     },
  { id: "t6", status: "done",    label: "[SYS:OK]",  task: "Zombie ideas filtered"  },
];

export function HeroTaskStream() {
  const bobRef   = useRef<HTMLDivElement>(null);
  const card0Ref = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const animLock = useRef<boolean>(false);

  const [offset, setOffset] = useState(0);

  // 3 currently visible cards based on offset
  const cards = [0, 1, 2].map((i) => TASK_POOL[(offset + i) % TASK_POOL.length]);

  // 1. Idle breathing bob on the bobRef container (gentle 3px sine wave)
  useEffect(() => {
    if (!bobRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(bobRef.current, {
        y: -3,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, bobRef);

    return () => ctx.revert();
  }, []);

  // 2. Smooth in-place conveyor cycle (continuous loop, 0.75s duration, power2.out ease)
  const advance = useCallback(() => {
    if (animLock.current) return;
    if (typeof document !== "undefined" && document.hidden) return;

    const c0 = card0Ref.current;
    const c1 = card1Ref.current;
    const c2 = card2Ref.current;
    if (!c0 || !c1 || !c2) return;

    animLock.current = true;

    // Shift distance is exact distance from Slot 1 to Slot 0
    const shift = (c1.offsetTop - c0.offsetTop) || 52;

    // 1. Slot 0 glides out and fades softly
    gsap.to(c0, {
      y: -10,
      opacity: 0,
      duration: 0.75,
      ease: "power2.out",
    });

    // 2. Slot 1 smoothly glides up into Slot 0
    gsap.to(c1, {
      y: -shift,
      duration: 0.75,
      ease: "power2.out",
    });

    // 3. Slot 2 smoothly glides up into Slot 1
    gsap.to(c2, {
      y: -shift,
      duration: 0.75,
      ease: "power2.out",
      onComplete: () => {
        // Synchronously update React state to eliminate any 1-frame render gap
        flushSync(() => {
          setOffset((prev) => (prev + 1) % TASK_POOL.length);
        });

        // Reset transforms on Slot 0 and Slot 1 immediately in the same frame
        gsap.set([c0, c1], { clearProps: "transform,opacity" });

        // Glide new card into Slot 2 smoothly from 10px below
        gsap.fromTo(
          c2,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power2.out",
            onComplete: () => {
              animLock.current = false;
            },
          }
        );
      },
    });
  }, []);

  // Continuous loop: relaxed 4.8s interval, never pauses on hover
  useEffect(() => {
    const id = setInterval(advance, 4800);
    return () => clearInterval(id);
  }, [advance]);

  return (
    <div
      className="htask-anchor"
      role="region"
      aria-label="Idea validation status feed"
      onClick={(e) => e.stopPropagation()}
    >
      <div ref={bobRef} className="htask-bob">
        <div className="htask-stack">
          {cards.map((card, i) => (
            <div
              key={i}
              ref={i === 0 ? card0Ref : i === 1 ? card1Ref : card2Ref}
              className={`htask-card htask-card--${card.status}`}
              aria-label={`${card.label}: ${card.task}`}
            >
              <div className="htask-left">
                <span
                  className={`htask-dot htask-dot--${card.status}`}
                  aria-hidden="true"
                />
                <span className="htask-label">{card.label}</span>
              </div>
              <span className="htask-task">{card.task}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
