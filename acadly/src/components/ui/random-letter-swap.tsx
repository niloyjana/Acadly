"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export interface RandomLetterSwapProps {
  label: string;
  className?: string;
  staggerDuration?: number;
  transition?: any; // To match the props they provided
  isHovering?: boolean;
}

export function RandomLetterSwap({
  label,
  className,
  staggerDuration = 0.025,
  isHovering: externalIsHovering,
}: RandomLetterSwapProps) {
  const [displayText, setDisplayText] = useState(label);
  const [internalIsHovering, setInternalIsHovering] = useState(false);
  const isHovering = externalIsHovering !== undefined ? externalIsHovering : internalIsHovering;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isHovering) {
      let iteration = 0;
      
      interval = setInterval(() => {
        setDisplayText((currentText) =>
          label
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) {
                return label[index];
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("")
        );
        
        // Use staggerDuration to control how fast the correct letters reveal
        // Smaller staggerDuration = faster reveal
        iteration += 1 / (staggerDuration * 40); 
        
        if (iteration >= label.length) {
          clearInterval(interval);
          setDisplayText(label);
        }
      }, 30);
    } else {
      // Instantly reset when mouse leaves
      setDisplayText(label);
    }

    return () => clearInterval(interval);
  }, [isHovering, label, staggerDuration]);

  return (
    <span
      className={cn("inline-block", className)}
      onMouseEnter={() => setInternalIsHovering(true)}
      onMouseLeave={() => setInternalIsHovering(false)}
    >
      {displayText}
    </span>
  );
}
