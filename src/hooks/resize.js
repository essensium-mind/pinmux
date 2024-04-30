import { useState, useEffect } from 'react';

export function useResizeObserver (ref) {
  const [width, setWidth] = useState();
  const [height, setHeight] = useState();

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if(ref.current.offsetWidth !== width) {
        setWidth(ref.current.offsetWidth); 
      }

      if(ref.current.offsetHeight !== height) {
        setHeight(ref.current.offsetHeight); 
      }
    });
    
    resizeObserver.observe(ref.current);

    return function cleanup() {
      resizeObserver.disconnect();
    }
  }, [ref, width, height]);

  return { width, height };
}
