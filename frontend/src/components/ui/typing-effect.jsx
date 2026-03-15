'use client';

import React, { useState, useEffect } from 'react';

export function TypingEffect({ 
  text, 
  speed = 50, 
  delay = 0,
  className = "" 
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!isStarted) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, isStarted]);

  return (
    <span className={className}>
      {displayedText}
    </span>
  );
}
