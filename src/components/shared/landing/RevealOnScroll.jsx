import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export default function RevealOnScroll({
  children,
  className,
  delay = 0,
  direction = 'up',
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      {
        threshold: 0.15,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const hiddenPosition = {
    up: 'translate-y-5',
    left: '-translate-x-5',
    right: 'translate-x-5',
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible
          ? 'translate-x-0 translate-y-0 opacity-100'
          : `opacity-0 ${hiddenPosition[direction] ?? hiddenPosition.up}`,
        className,
      )}
    >
      {children}
    </div>
  );
}