import React, { useReducer, useContext, useMemo } from 'react'

const _appGeometryDefault = {
  browserWindow: {
    width: 0,
    height: 0,
  },
  header: {
    size: {
      width: 0,
      height: 0,
    },
  },
  board: {
    definition: {
      headers: []
    },
    headers: {},
    container: {
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
      headers: []
    }
  },
}

const AppGeometryContext = React.createContext(_appGeometryDefault);

export function useAppGeometryContext () {
  const context = useContext(AppGeometryContext)

  if (context === undefined) {
    throw new Error("useAppGeometryContext must be used within a AppGeometryContext");
  }

  return context;
}

const _boardOverlayHeaderGeometryDefault = {
  id: undefined,
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

function _boardOverlayHeaderGeometry (ref, headers, boardImg) {
  const { position: headerOriginalPosition, pitch: headerOriginalPitch } = headers.find(h => h.name === ref.id)
  const pinHeaderLabel = ref.firstChild // div -> span
  const pinHeader = ref.lastChild.firstChild // div -> table -> tbody 

  return {
    id: ref.id,
    ref,
    header: {
      // TODO change size based on the window size.
      size: {
        width: pinHeaderLabel.offsetWidth,
        height: pinHeaderLabel.offsetHeight,
      },
      pos: {
        top: boardImg.pos.top + (boardImg.ratio * headerOriginalPosition.y) - pinHeaderLabel.offsetHeight - 18,
        left: boardImg.pos.left + (boardImg.ratio * headerOriginalPosition.x),
      }
    },
    pins: {
      pitch: boardImg.ratio * headerOriginalPitch,
      pos: {
        top: boardImg.pos.top + (boardImg.ratio * headerOriginalPosition.y),
        // TODO this depends on the pin legend justification
        left: boardImg.pos.left + (boardImg.ratio * headerOriginalPosition.x) - pinHeader.firstChild.firstChild.offsetWidth, // tbody -> tr -> td -> offsetWidth
      },
      size: {
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      },
      // TODO Move header contents here to already do the size calculation here.
      // rows: Array.from(pinHeader.children).map(x => x.offsetHeight),
      // columns: Array.from(pinHeader.firstChild.children).map(x => x.offsetWidth),
    }
  }

}

function _boardOverlayHeadersGeometry (previousState, headersDefinitions, boardImg) {
  if (headersDefinitions.length === 0 || boardImg.loading) {
    /**
     * The tricky thing with the Header Geometry computation is that we must
     * pass a default dumb state to start the computation of the sizing before
     * placing it correctly
     */
    return {}
  }

  return headersDefinitions.reduce((obj, x) => {
    if (previousState[x.name] && previousState[x.name].ref) {
      return {
        ...obj,
        [x.name]: _boardOverlayHeaderGeometry(previousState[x.name].ref, headersDefinitions, boardImg)
      }
    } else {
      return {
        ...obj,
        [x.name]: {
          ..._boardOverlayHeaderGeometryDefault,
          id: x.name,
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

const GEOMETRY_WINDOW_HEADER_RESIZE = "GeometryContextWindowHeaderResize"
const GEOMETRY_IMG_LOADED = "GeometryContextBoardImgLoaded"
const GEOMETRY_BOARD_CONTAINER_RESIZE = "GeometryContextBoardContainerResize"
const GEOMETRY_BOARD_HEADER_OVERLAY_RESIZE = "GeometryContextBoardHeaderOverlayResize"
const GEOMETRY_BOARD_DEFINITION_CHANGE = "GeometryContextBoardDefinitionChange"

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function reducer(state, action) {
  console.debug(`[Geometry Ctx - ${action.type}]`, action.data);
  switch (action.type) {
    case GEOMETRY_WINDOW_HEADER_RESIZE: {
      const browserWindow = getWindowDimensions()
      const image = _boardImageGeometryProvider(state.board.image.original, browserWindow, action.data, state.board.container.size)
      const headers = _boardOverlayHeadersGeometry(state.board.overlay.headers, state.board.definition.headers, image)
      return {
        ...state,
        browserWindow,
        header: {
          ...state.header,
          size: action.data,
        },
        board: {
          ...state.board,
          image,
          overlay: {
            ...state.board.overlay,
            headers,
          }
        }
      }
    }
    case GEOMETRY_BOARD_DEFINITION_CHANGE: {
      const definition = action.data
      const image = _boardImageGeometryProvider(state.board.image.original, state.browserWindow, state.header.size, state.board.container.size)
      const headers = _boardOverlayHeadersGeometry({}, definition.headers, image)
      return {
        ...state,
        board: {
          ...state.board,
          definition,
          image,
          overlay: {
            ...state.board.overlay,
            headers,
          }
        }
      }
    }
    case GEOMETRY_IMG_LOADED: {
      const image = _boardImageGeometryProvider(action.data, state.browserWindow, state.header.size, state.board.container.size)
      const headers = _boardOverlayHeadersGeometry(state.board.overlay.headers, state.board.definition.headers, image)
      return {
        ...state,
        board: {
          ...state.board,
          image,
          overlay: {
            ...state.board.overlay,
            headers,
          }
        },
      }
    }
    case GEOMETRY_BOARD_CONTAINER_RESIZE: {
      const browserWindow = getWindowDimensions()
      const image = _boardImageGeometryProvider(state.board.image.original, browserWindow, state.header.size, action.data)
      const headers = _boardOverlayHeadersGeometry(state.board.overlay.headers, state.board.definition.headers || [], image)
      return {
        ...state,
        browserWindow,
        board: {
          ...state.board,
          container: {
            ...state.board.container,
            size: action.data,
          },
          image,
          overlay: {
            ...state.board.overlay,
            headers,
          }
        },
      }
    }
    case GEOMETRY_BOARD_HEADER_OVERLAY_RESIZE: {
      const ref = action.data
      const definition = state.board.definition.headers
      const headers = {
        ...state.board.overlay.headers,
        [ref.id]: _boardOverlayHeaderGeometry(ref, definition, state.board.image),
      }
      console.log(state, headers);
      return {
        ...state,
        board: {
          ...state.board,
           overlay: {
            ...state.board.overlay,
            headers,
          }
        },
      }
    }
    default: {
      console.error('[Geometry Ctx] Reducer should not enter the default state.')
      return _appGeometryDefault 
    }
  }
}

export function AppGeometryProvider ({ children }) {
  const [state, dispatch] = useReducer(reducer, _appGeometryDefault)

  const onOverlayHeaderResize = useMemo(() => (
    (ref) => dispatch({
      type: GEOMETRY_BOARD_HEADER_OVERLAY_RESIZE,
      data: ref,
    })
  ), [])

  const onHeaderResize = useMemo(() => (
    (size) => dispatch({
      type: GEOMETRY_WINDOW_HEADER_RESIZE,
      data: size,
    })
  ), [])

  const onBoardDefinitionChange = useMemo(() => (
    (definition) => dispatch({
      type: GEOMETRY_BOARD_DEFINITION_CHANGE,
      data: definition,
    })
  ), [])

  const onImgLoad = useMemo(() => (
    (size) => dispatch({
      type: GEOMETRY_IMG_LOADED,
      data: size,
    })
  ), [])

  const onContainerResize = useMemo(() => (
    (size) => dispatch({
      type: GEOMETRY_BOARD_CONTAINER_RESIZE,
      data: size,
    })
  ), [])

  return (
    <AppGeometryContext.Provider value={{
      ...state,
      onBoardDefinitionChange,
      onContainerResize,
      onHeaderResize,
      onImgLoad,
      onOverlayHeaderResize,
    }}>
      {children}
    </AppGeometryContext.Provider>
  );
}
