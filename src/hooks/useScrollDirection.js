import { useEffect, useRef, useState } from "react";

export default function useScrollDirection() {
  const [direction, setDirection] = useState("up");
  const [isAtTop, setIsAtTop] = useState(true);

  const lastScrollY = useRef(0);
  const accumulatedDelta = useRef(0);
  const lastDirectionChange = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      setIsAtTop(currentScrollY <= 10);

      // Always show the normal header state at the very top
      if (currentScrollY <= 10) {
        setDirection("up");
        accumulatedDelta.current = 0;
        lastScrollY.current = currentScrollY;
        return;
      }

      accumulatedDelta.current += delta;

      // Require a meaningful scroll before changing direction
      if (Math.abs(accumulatedDelta.current) < 25) {
        lastScrollY.current = currentScrollY;
        return;
      }

      // Prevent rapid direction flipping
      const now = Date.now();

      if (now - lastDirectionChange.current < 180) {
        lastScrollY.current = currentScrollY;
        return;
      }

      const nextDirection =
        accumulatedDelta.current > 0 ? "down" : "up";

      setDirection(nextDirection);

      accumulatedDelta.current = 0;
      lastDirectionChange.current = now;
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { direction, isAtTop };
}