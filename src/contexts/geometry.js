import React, { useRef, useContext } from 'react'
import { useBoardContext } from './board'
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
  }],
  board: {
    headers: {},
    container: {
      ref: undefined,
      /**
       * Container dimensions set by the CSS. This can't be computed and need
       * to be fetched at run-time from a reference to that container.
       */
      size: {
        width: 0,
        height: 0,
      }
    },
    image: {
      ref: undefined,
      /**
       * Image margin from the container.
       */
      margin: 0,
      /**
       * Original board image dimensions.
       */
      original: {
        width: 0,
        height: 0,
      },
      /**
       * Force the board image dimensions to fit the container.
       */
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
      ref: undefined,
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

const _boardOverlayHeadersGeometryDefault = {
  ref: undefined,
  header: {
    size: {
      width: 0,
      height: 0,
    },
    pos: {
      top: 0,
      left: 0,
    },
  },
  pins: {
    size: {
      width: 0,
      height: 0,
    },
    pos: {
      top: 0,
      left: 0,
    },
    rows: [0],
    columns: [0],
  }
}

function _boardOverlayHeadersGeometry (ref, boardImg) {
  const { headers } = useBoardContext()

  if (ref.current === undefined) {
    return headers.reduce((obj, x) => ({
      ...obj,
      [x.name]: _boardOverlayHeadersGeometryDefault
    }), {})
  }

  return Array.from(ref.current.children).reduce((obj, x) => {
    const { position: headerOriginalPosition, pitch: headerOriginalPitch } = headers.find(h => h.name === x.id)
    const pinHeaderLabel = x.firstChild // div -> span
    const pinHeader = x.lastChild.firstChild // div -> table -> tbody 

    return {
      ...obj,
      [x.id]: {
        ref: x,
        header: {
          // TODO change size based on the window size.
          size: {
            width: pinHeaderLabel.offsetWidth,
            height: pinHeaderLabel.offsetHeight,
          },
          pos: {
            top: boardImg.pos.top + (boardImg.ratio * headerOriginalPosition.y) - x.firstChild.offsetHeight - 18,
            left: boardImg.pos.left + (boardImg.ratio * headerOriginalPosition.x),
          }
        },
        pins: {
          pitch: boardImg.ratio * headerOriginalPitch,
          pos: {
            top: boardImg.pos.top + (boardImg.ratio * headerOriginalPosition.y),
            // TODO this depends on the ping legend justification
            left: boardImg.pos.left + (boardImg.ratio * headerOriginalPosition.x) - pinHeader.firstChild.firstChild.offsetWidth, // tbody -> tr -> td -> offsetWidth
          },
          size: {
            width: x.offsetWidth,
            height: x.offsetHeight,
          },
          rows: Array.from(pinHeader.children).map(x => x.offsetHeight),
          columns: Array.from(pinHeader.firstChild.children).map(x => x.offsetWidth),
        }
      }
    }
  }, {})
}

const _boardImageGeometryProviderDefault = {
  ref: undefined,
  original: {
    width: 0,
    height: 0
  },
  size: {
    width: 0,
    height: 0,
  },
  ratio: 1,
  pos: {
    top: 0,
    left: 0,
  }
}

function _boardImageGeometryProvider (ref, windowDimensions, headerSize, containerSize) {
  if (ref.current === undefined) {
    return {
      ..._boardImageGeometryProviderDefault,
      ref,
    }
  }

  const boardMargin = 40
  const boardImgHeight = windowDimensions.height - (headerSize.height + (2 * boardMargin))
  const ratio = (ref.current.naturalHeight > 1) ? (boardImgHeight / ref.current.naturalHeight) : 1

  const boardImgWidth = ref.current.naturalWidth * ratio

  return {
    ref,
    margin: boardMargin,
    original: {
      width: ref.current ? ref.current.naturalWidth : 0,
      height: ref.current ? ref.current.naturalHeight: 0,
    },
    size: {
      width: boardImgWidth,
      height: boardImgHeight,
    },
    ratio,
    pos: {
      left: (containerSize.width - boardImgWidth) / 2,
      top: (containerSize.height - boardImgHeight) / 2,
    }
  }
}

export function AppGeometryProvider ({ children }) {
  const windowDimensions = useWindowDimensions()

  const headerRef = useRef()
  const containerRef = useRef()
  const imgRef = useRef()
  const overlayRef = useRef()

  const boardContainerSize = useResizeObserver(containerRef)
  const headerSize = useResizeObserver(headerRef)

  const boardImageGeometry = _boardImageGeometryProvider(imgRef, windowDimensions, headerSize, boardContainerSize)

  const boardOverlayHeadersGeometry = _boardOverlayHeadersGeometry(overlayRef, boardImageGeometry)

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
          size: boardContainerSize,
        },
        overlay: {
          ref: overlayRef,
          headers: boardOverlayHeadersGeometry,
        },
        image: boardImageGeometry,
      },
    }}>
      {children}
    </AppGeometryContext.Provider>
  );
}
