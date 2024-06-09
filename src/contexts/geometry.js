import React, { useRef, useContext } from 'react'
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
      margin: 0,
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
      /**
       * Ratio between the rendered image size and its original size.
       */
      ratio: 0,
      /**
       * Offset relative to the container the image is wrapped in.
       * The image is centered inside that container.
       */
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

  const boardContainerSize = useResizeObserver(containerRef) 
  const headerSize = useResizeObserver(headerRef) 

  const boardMargin = 40
  const boardImgHeight = windowDimensions.height - (headerSize.height + (2 * boardMargin))
  const ratio = (imgRef.current && imgRef.current.naturalHeight > 1) ? (boardImgHeight / imgRef.current.naturalHeight) : 1
  const boardImgWidth = imgRef.current ? imgRef.current.naturalWidth * ratio : 0

  return (
    <AppGeometryContext.Provider value={{
      browserWindow: windowDimensions,
      header: {
        ref: headerRef,
        size: headerSize,
      },
      board: {
        container: {
          ref: containerRef,
          margin: boardMargin,
          size: boardContainerSize,
        },
        image: {
          ref: imgRef,
          original: {
            width: imgRef.current ? imgRef.current.naturalWidth : 0,
            height: imgRef.current ? imgRef.current.naturalHeight: 0,
          },
          size: {
            width: boardImgWidth,
            height: boardImgHeight,
          },
          ratio,
          pos: {
            left: (boardContainerSize.width - boardImgWidth) / 2,
            top: (boardContainerSize.height - boardImgHeight) / 2,
          }
        }
      },
    }}>
      {children}
    </AppGeometryContext.Provider>
  );
}
