import React, { useRef, useContext, useState } from 'react'
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

function _boardOverlayHeadersGeometry (ref, headers, boardImg) {
  if (headers.length === 0 || ref.current === undefined || Array.from(ref.current.children).length === 0 || boardImg.loading) {
    /**
     * The tricky thing with the Header Geometry computation is that we must
     * pass a default dumb state to start the computation of the sizing before
     * placing it correctly
     */
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
  loading: true,
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

function _boardImageGeometryProvider (imgNaturalSize, windowDimensions, headerSize, containerSize) {
  if (imgNaturalSize.height < 1 || imgNaturalSize.width < 1) {
    return _boardImageGeometryProviderDefault
  }

  const boardMargin = 40
  const boardImgHeight = windowDimensions.height - (headerSize.height + (2 * boardMargin))
  const ratio = (boardImgHeight / imgNaturalSize.height)

  const boardImgWidth = imgNaturalSize.width * ratio

  return {
    loading: false,
    margin: boardMargin,
    original: imgNaturalSize,
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
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 })
  const windowDimensions = useWindowDimensions()

  const headerRef = useRef()
  const containerRef = useRef()
  const overlayRef = useRef()

  const boardContainerSize = useResizeObserver(containerRef)
  const headerSize = useResizeObserver(headerRef)

  const boardImageGeometry = _boardImageGeometryProvider(imgNaturalSize, windowDimensions, headerSize, boardContainerSize)

  const { headers } = useBoardContext()
  const boardOverlayHeadersGeometry = _boardOverlayHeadersGeometry(overlayRef, headers, boardImageGeometry)

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
        image: {
          onLoad: ({ target }) => setImgNaturalSize({
            width: target.naturalWidth,
            height: target.naturalHeight,
          }),
          ...boardImageGeometry,
        }
      },
    }}>
      {children}
    </AppGeometryContext.Provider>
  );
}
