import { useCallback, useEffect, useState } from 'react';

export function UseSize() {
  const [size, setSize] = useState({
    width:
      typeof window !== 'undefined'
        ? window.document.documentElement.clientWidth
        : 0,
    height:
      typeof window !== 'undefined'
        ? window.document.documentElement.clientHeight
        : 0,
  });
  const onResize = useCallback(() => {
    setSize({
      width: window.document.documentElement.clientWidth,
      height: window.document.documentElement.clientHeight,
    });
  }, []);
  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
  return size;
}
