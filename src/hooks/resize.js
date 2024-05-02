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

export function useTableSizeObserver (ref) {
  const [size, setSize] = useState({ row: 0, column: 0 });
  const [rowSize, setRowSize] = useState([]);
  const [columnSize, setColumnSize] = useState([]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (ref.current.children.length) {
        const row = ref.current.children.length;
        const column = ref.current.children[0].length;
        if (row !== size.row || column !== size.column) {
          setSize({
            row: ref.current.children.length,
            column: ref.current.children[0].length
          });
        }

        const newRowSize = Array(row).map((_, i) => ref.current.children[i].offsetHeight);
        const newColumnSize = Array(column).map((_, i) => ref.current.children[0].children[i].offsetWidth);

        if (JSON.stringify(rowSize) !== JSON.stringify(newRowSize)) {
          setRowSize(newRowSize);
        }

        if (JSON.stringify(columnSize) !== JSON.stringify(newColumnSize)) {
          setColumnSize(newColumnSize);
        }
      }
    });
    
    resizeObserver.observe(ref.current);

    return function cleanup() {
      resizeObserver.disconnect();
    }
  }, [ref, size, rowSize, columnSize]);

  return { size, rowSize, columnSize };
}
