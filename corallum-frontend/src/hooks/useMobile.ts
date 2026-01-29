import { useState, useEffect } from 'react';

/**
 * 📱 Hook для определения мобильного устройства
 * Оптимизирован для производительности с debounce
 */
export const useMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    // 🚀 Debounce для оптимизации производительности
    let timeoutId: number;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        setScreenSize({ width, height });
        setIsMobile(width < breakpoint);
        setIsTablet(width >= breakpoint && width < 1024);
      }, 150);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    orientation: screenSize.width > screenSize.height ? 'landscape' : 'portrait'
  };
};

/**
 * 🎯 Hook для адаптивных значений
 */
export const useResponsiveValue = <T>(
  mobile: T,
  tablet: T,
  desktop: T
): T => {
  const { isMobile, isTablet } = useMobile();
  
  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
};

/**
 * 📊 Hook для медиа-запросов
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Initial check
    setMatches(media.matches);
    
    // Listener for changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    media.addEventListener('change', listener);
    
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};

/**
 * 🚀 Оптимизированные breakpoints
 */
export const breakpoints = {
  xs: '(max-width: 640px)',
  sm: '(min-width: 641px) and (max-width: 768px)',
  md: '(min-width: 769px) and (max-width: 1024px)',
  lg: '(min-width: 1025px) and (max-width: 1280px)',
  xl: '(min-width: 1281px)'
};

export const useBreakpoint = () => {
  const isXs = useMediaQuery(breakpoints.xs);
  const isSm = useMediaQuery(breakpoints.sm);
  const isMd = useMediaQuery(breakpoints.md);
  const isLg = useMediaQuery(breakpoints.lg);
  const isXl = useMediaQuery(breakpoints.xl);

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    current: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : 'xl'
  };
};

export default useMobile;
