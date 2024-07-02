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
    metadata: {},
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
      },
      src: '',
    },
    overlay: {
      headers: []
    },
    variants: [],
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
  definition: [],
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

function _getBoardMetadata(board, variant) {
  if (Array.isArray(board.metadata)) {
    if (variant === undefined) {
      return board.metadata.find(Boolean)
    }

    return board.metadata.find(x => x.id === variant)
  } else {
    return board.metadata
  }
}

function _filterHeaders (board, metadata, side) {
  return board.headers.map(h => {
    if (h["side"] !== undefined && h["side"] !== side) {
      return undefined
    }
    if (typeof h.pitch === "object"
      && h.pitch[metadata.id] !== undefined
      && h.position[metadata.id] !== undefined
    ) {
      return {
        ...h,
        pitch: h.pitch[metadata.id],
        position: h.position[metadata.id]
      }
    } else if (!Array.isArray(board.metadata)) {
      // Single board variant definition
      return h
    } else {
      // Multiple board variant definition and no definitions for the headers.
      // TODO Throw error
      return undefined
    }
  }).filter(x => x !== undefined)
}

function _boardHasSide (metadata, side) {
  return typeof metadata.image === "object" && metadata.image[side]
}

function _getBoardImage (metadata, side) {
  return _boardHasSide(metadata, side)
    ? metadata.image[side]
    : metadata.image

}

function _getBoardVariant (board) {
  if (Array.isArray(board.metadata)) {
    return board.metadata.map(({ id, name, image }) => ({
      id,
      name,
      image: typeof image === 'string' ?  image : image['front']
    }))
  } else {
    return {
      id: board.metadata.id,
      name: board.metadata.name,
      image: typeof board.metadata.image === 'string'
        ? board.metadata.image
        : board.metadata.image['front']
    }
  }
}

function _boardOverlayHeaderGeometry (ref, definition, boardImg) {
  const { position: headerOriginalPosition, pitch: headerOriginalPitch } = definition
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
    },
    definition,
  }

}

function _boardOverlayHeadersGeometry (previousState, headersDefinitions, boardImg) {
  // if (headersDefinitions.length === 0 || boardImg.loading) {
    /**
     * The tricky thing with the Header Geometry computation is that we must
     * pass a default dumb state to start the computation of the sizing before
     * placing it correctly
     */
    // return {}
  // }

  return headersDefinitions.reduce((obj, x) => {
    if (previousState[x.name] && previousState[x.name].ref) {
      return {
        ...obj,
        [x.name]: _boardOverlayHeaderGeometry(previousState[x.name].ref, x, boardImg)
      }
    } else {
      return {
        ...obj,
        [x.name]: {
          ..._boardOverlayHeaderGeometryDefault,
          definition: x, // TODO More detail could be added directly
          id: x.name,
        }
      }
    }
  }, {})
}

const _boardImageGeometryProviderDefault = {
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
const BOARD_CONTEXT_FLIP_BOARD = 'BoardContextFlipBoard'
const BOARD_CONTEXT_CHANGE_BOARD_VARIANT = 'BoardContextChangeBoardVariant'

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
      const headers = _boardOverlayHeadersGeometry(state.board.overlay.headers, _filterHeaders(state.board.definition, state.board.metadata, state.board.side), image)
      return {
        ...state,
        browserWindow,
        header: {
          ...state.header,
          size: action.data,
        },
        board: {
          ...state.board,
          image: {
            ...state.board.image,
            ...image,
          },
          overlay: {
            ...state.board.overlay,
            headers,
          }
        }
      }
    }
    //   const definition = action.data
    //   const image = _boardImageGeometryProvider(state.board.image.original, state.browserWindow, state.header.size, state.board.container.size)
    //   const headers = _boardOverlayHeadersGeometry({}, definition.headers, image)
    //   return {
    //     ...state,
    //     board: {
    //       ...state.board,
    //       definition,
    //       image,
    //       overlay: {
    //         ...state.board.overlay,
    //         headers,
    //       }
    //     }
    //   }
    // }
    // case BOARD_CONTEXT_CHANGE_BOARD_DEFINITION: {
    case GEOMETRY_BOARD_DEFINITION_CHANGE: {
      const metadata = _getBoardMetadata(action.data.board, action.data.variant)
      const side = 'front'

      if (JSON.stringify(metadata) !== JSON.stringify(state.board.metadata)) {
        return {
          ...state,
          board: {
            ...state.board,
            definition: action.data.board,
            metadata,
            overlay: {
              ...state.board.overlay,
              headers: _boardOverlayHeadersGeometry({}, _filterHeaders(action.data.board, metadata, side), undefined) // TODO Apply default geometry
            },
            variants: _getBoardVariant(action.data.board),
            image: {
              ...state.board.image,
              ..._boardImageGeometryProviderDefault,
              src: _getBoardImage(metadata, side),
            },
            side,
          }
        }
      } else {
        return state
      }
    }
    case BOARD_CONTEXT_FLIP_BOARD: {
      const newSide = state.board.side === 'front' ? 'back' : 'front'

      if (_boardHasSide(state.board.metadata, newSide)) {
        return {
          ...state,
          board: {
            ...state.board,
            overlay: {
              ...state.board.overlay,
              headers: _boardOverlayHeadersGeometry({}, _filterHeaders(state.board.definition, state.board.metadata, newSide), undefined)
            },
            image: {
              ...state.board.image,
              ..._boardImageGeometryProviderDefault,
              src: _getBoardImage(state.board.metadata, newSide),
            },
            side: newSide,
          }
        }
      } else {
        return state
      }
    }
    case BOARD_CONTEXT_CHANGE_BOARD_VARIANT: {
      const metadata = _getBoardMetadata(state.board.definition, action.data)
      const side = 'front'

      if (JSON.stringify(metadata) !== JSON.stringify(state.board.metadata)) {
        return {
          ...state,
          board: {
            ...state.board,
            metadata,
            overlay: {
              ...state.board.overlay,
              headers: _boardOverlayHeadersGeometry({}, _filterHeaders(state.board.definition, metadata, side), undefined) // TODO Apply default geometry
            },
            variants: _getBoardVariant(action.data.board),
            image: {
              ...state.board.image,
              ..._boardImageGeometryProviderDefault,
              src: _getBoardImage(metadata, side),
            },
            side,
          }
        }
      } else {
        return state
      }
    }
    case GEOMETRY_IMG_LOADED: {
      const image = _boardImageGeometryProvider(action.data, state.browserWindow, state.header.size, state.board.container.size)
      const headers = _boardOverlayHeadersGeometry(state.board.overlay.headers, _filterHeaders(state.board.definition, state.board.metadata, state.board.side), image)
      return {
        ...state,
        board: {
          ...state.board,
          image: {
            ...state.board.image,
            ...image,
          },
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
      const headers = _boardOverlayHeadersGeometry(state.board.overlay.headers, _filterHeaders(state.board.definition, state.board.metadata, state.board.side), image)
      return {
        ...state,
        browserWindow,
        board: {
          ...state.board,
          container: {
            ...state.board.container,
            size: action.data,
          },
          image: {
            ...state.board.image,
            ...image,
          },
          overlay: {
            ...state.board.overlay,
            headers,
          }
        },
      }
    }
    case GEOMETRY_BOARD_HEADER_OVERLAY_RESIZE: {
      if (state.board.image.loading) {
        return state
      }
      const ref = action.data
      const definition = state.board.overlay.headers[ref.id].definition
      const headers = {
        ...state.board.overlay.headers,
        [ref.id]: _boardOverlayHeaderGeometry(ref, definition, state.board.image),
      }
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

  // const onBoardDefinitionChange = useMemo(() => (
  //   (definition) => dispatch({
  //     type: GEOMETRY_BOARD_DEFINITION_CHANGE,
  //     data: definition,
  //   })
  // ), [])

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

  const flipSide = useMemo(() => (
    () => dispatch({
      type: BOARD_CONTEXT_FLIP_BOARD,
    })
  ), [])

  const setVariant = useMemo(() => (
    (variant) => dispatch({
      type: BOARD_CONTEXT_CHANGE_BOARD_VARIANT,
      data: variant,
    })
  ), [])

  const onBoardDefinitionChange = useMemo(() => (
    (board, variant) => dispatch({
      type: GEOMETRY_BOARD_DEFINITION_CHANGE,
      data: { board, variant },
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
      flipSide,
      setVariant,
      // setBoard,
    }}>
      {children}
    </AppGeometryContext.Provider>
  );
}
