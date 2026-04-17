import { useEffect, useState } from "react";

export function useLiveTimer(initialSeconds, running) {
  const [seconds, setSeconds] = useState(initialSeconds || 0);

  useEffect(() => {
    setSeconds(initialSeconds || 0);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) return undefined;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  return seconds;
}
