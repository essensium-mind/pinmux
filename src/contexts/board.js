import React, { useContext, useReducer } from 'react'

const BoardContext = React.createContext({ })

export function useBoardContext () {
  const context = useContext(BoardContext)
  if (context === undefined) {
    throw new Error("useBoardContext must be used within a BoardProvider")
  }
  return context
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
    return board.metadata.map(({ id, name }) => ({
      id,
      name
    }))
  } else {
    return {
      id: board.metadata.id,
      name: board.metadata.name
    }
  }
}

const BOARD_CONTEXT_CHANGE_BOARD_DEFINITION = 'BoardContextChangeBoardDefinition'
const BOARD_CONTEXT_FLIP_BOARD = 'BoardContextFlipBoard'
const BOARD_CONTEXT_CHANGE_BOARD_VARIANT = 'BoardContextChangeBoardVariant'

function reducer(state, action) {
  switch (action.type) {
    case BOARD_CONTEXT_CHANGE_BOARD_DEFINITION: {
      const metadata = _getBoardMetadata(action.data.board, action.data.variant)
      const side = 'front'

      return {
        board: action.data.board,
        metadata,
        headers: _filterHeaders(action.data.board, metadata, side),
        variants: _getBoardVariant(action.data.board),
        image: _getBoardImage(metadata, side),
        side,
      }
    }
    case BOARD_CONTEXT_FLIP_BOARD: {
      const newSide = state.side === 'front' ? 'back' : 'front'

      if (_boardHasSide(state.metadata, newSide)) {
        return {
          ...state,
          headers: _filterHeaders(state.board, state.metadata, newSide),
          image: _getBoardImage(state.metadata, newSide),
          side: newSide,
        }
      } else {
        return state
      }
    }
    case BOARD_CONTEXT_CHANGE_BOARD_VARIANT: {
      const metadata = _getBoardMetadata(state.board, action.data)
      const side = 'front'

      return {
        ...state,
        metadata,
        headers: _filterHeaders(state.board, metadata, side),
        image: _getBoardImage(metadata, side),
        side,
      }
    }
    default: {
      return {
        ...state
      }
    }
  }
}

export function BoardProvider ({ boardDefinition, children }) {
  const [{ board, variants, metadata, headers, image, side }, dispatch] = useReducer(reducer, reducer({}, { type: BOARD_CONTEXT_CHANGE_BOARD_DEFINITION, data: { board: boardDefinition } }))

  return (
    <BoardContext.Provider value={{
      name: metadata.name,
      side: side,
      image,
      headers,
      pins: board.pins,
      variants,
      flipSide: () => dispatch({ type: BOARD_CONTEXT_FLIP_BOARD }),
      setVariant: (variant) => dispatch({ type: BOARD_CONTEXT_CHANGE_BOARD_VARIANT, data: variant }),
      setBoard: (board, variant) => dispatch({ type: BOARD_CONTEXT_CHANGE_BOARD_DEFINITION, data: { board, variant } }),
    }}>
      {children}
    </BoardContext.Provider>
  )
}
