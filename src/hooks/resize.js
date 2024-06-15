import { useState, useEffect } from 'react';

export function useResizeObserver (ref) {
  const [width, setWidth] = useState(ref.current ? ref.current.offsetWidth : 0);
  const [height, setHeight] = useState(ref.current ? ref.current.offsetHeight : 0);

  // FIXME Have to force setting the state outside of the observer to verify it
  // on useResizeObserver call.
  // On some case when changing the page the width & height state would be set
  // to 0 but the ResizeObserver wouldn't trigger a recalc and the width &
  // height would remain equals to 0.
  // With this solution for now we can double check the value is updated
  if (ref.current) {
      if(ref.current.offsetWidth !== width) {
        setWidth(ref.current.offsetWidth)
      }

      if(ref.current.offsetHeight !== height) {
        setHeight(ref.current.offsetHeight)
      }
  }

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if(ref.current.offsetWidth !== width) {
        setWidth(ref.current.offsetWidth)
      }

      if(ref.current.offsetHeight !== height) {
        setHeight(ref.current.offsetHeight)
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
        const column = ref.current.firstChild.length;
        if (row !== size.row || column !== size.column) {
          setSize({
            row,
            column
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
