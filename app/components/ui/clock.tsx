'use client';

import { useState, useEffect } from 'react';

interface Props {
  className?: string;
}

export function Clock({ className }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={className}>{time.toLocaleTimeString('ja-JP')}</div>
  );
} 