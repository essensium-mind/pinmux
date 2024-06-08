import React, { useState, useRef, useContext } from 'react'
import { useResizeObserver } from '../hooks/resize'
import { useWindowDimensions } from '../hooks/windows.js';

const AppGeometryContext = React.createContext({
  browserWindow: {
    width: 0,
    height: 0,
  },
  header: [{
    ref: undefined,
    size: {
      width: 0,
      height: 0,
    },
    pos: {
      top: 0,
      left: 0,
    }
  }],
  board: {
    container: {
      ref: undefined,
      size: {
        width: 0,
        height: 0,
      }
    },
    image: {
      ref: undefined,
      original: {
        width: 0,
        height: 0,
      },
      size: {
        width: 0,
        height: 0,
      },
      ratio: 0,
      pos: {
        top: 0,
        left: 0,
      }
    },
    overlay: {
      width: 0,
      height: 0,
    }
  },
  setBoardReferences: undefined,
});

export function useAppGeometryContext () {
  const context = useContext(AppGeometryContext)

  if (context === undefined) {
    throw new Error("useAppGeometryContext must be used within a AppGeometryContext");
  }

  return context;
}

export function AppGeometryProvider ({ children }) {
  const windowDimensions = useWindowDimensions();

  const imgRef = useRef()
  const containerRef = useRef()
  const headerRef = useRef()

  const boardImageSize = useResizeObserver(imgRef) 
  const boardContainerSize = useResizeObserver(containerRef) 

  return (
    <AppGeometryContext.Provider value={{
      browserWindow: windowDimensions,
      header: {
        ref: headerRef,
      },
      board: {
        container: {
          ref: containerRef,
          size: boardContainerSize,
        },
        image: {
          ref: imgRef,
          original: {
            width: imgRef.current ? imgRef.current.naturalWidth : 0,
            height: imgRef.current ? imgRef.current.naturalHeight: 0,
          },
          size: boardImageSize,
          ratio: (imgRef.current && boardContainerSize.width) ? (imgRef.current.naturalWidth / boardContainerSize.width) : 1,
          // Offset relative to the container the image is wrapped in.
          // The image is centered inside that container.
          pos: {
            left: (boardContainerSize.width - boardImageSize.width) / 2,
            top: (boardContainerSize.height - boardImageSize.height) / 2,
          }
        }
      },
    }}>
      {children}
    </AppGeometryContext.Provider>
  );
}
