import { useEffect, useRef, useState } from "react";

export default function useScrollDirection() {
  const [direction, setDirection] = useState("up");
  const [isAtTop, setIsAtTop] = useState(true);

  const lastScrollY = useRef(0);
  const accumulatedDelta = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      setIsAtTop(currentScrollY <= 10);

      if (currentScrollY <= 10) {
        setDirection("up");
        accumulatedDelta.current = 0;
        lastScrollY.current = currentScrollY;
        return;
      }

      accumulatedDelta.current += delta;

      // Ignore tiny direction changes
      if (Math.abs(accumulatedDelta.current) < 12) {
        lastScrollY.current = currentScrollY;
        return;
      }

      if (accumulatedDelta.current > 0) {
        setDirection("down");
      } else {
        setDirection("up");
      }

      accumulatedDelta.current = 0;
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { direction, isAtTop };
}