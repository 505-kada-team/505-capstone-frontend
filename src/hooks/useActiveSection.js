import { useEffect, useState } from 'react';

export default function useActiveSection(sectionIds = []) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? '');

  useEffect(() => {
    const handleScroll = () => {
      const offset = 140;

      let currentSection = sectionIds[0] ?? '';

      sectionIds.forEach((id) => {
        const element = document.getElementById(id);

        if (!element) return;

        const rect = element.getBoundingClientRect();

        if (rect.top <= offset) {
          currentSection = id;
        }
      });

      setActiveSection(currentSection);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionIds.join('|')]);

  return activeSection;
}