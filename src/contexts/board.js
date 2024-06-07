import React, { useState, useContext } from 'react'

const BoardContext = React.createContext({
  side: "front",
  name: "",
  image: "",
  headers: [],
  pins: {},
  setBoard: undefined
})

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

export function BoardProvider ({ boardDefinition, children }) {
  const [board, setBoard] = useState(boardDefinition)
  const [side, setSide] = useState("front")
  const [metadata, setMetadata] = useState(_getBoardMetadata(board))

  return (
    <BoardContext.Provider value={{
      name: metadata.name,
      side: side,
      image: typeof metadata.image === "object"
        ? metadata.image[side]
        : metadata.image,
      headers: board.headers.map(h => {
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
      }).filter(x => x !== undefined),
      pins: board.pins,
      flipSide: () => {
        if (side === "front") {
          setSide("back")
        } else {
          setSide("front")
        }
      },
      getVariants: () => {
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
      },
      setVariant: (variant) => {
        setSide("front")
        setMetadata(_getBoardMetadata(board, variant));
      },
      setBoard: (board, variant) => {
        setSide("front")
        setMetadata(_getBoardMetadata(board, variant));
        setBoard(board);
      },
    }}>
      {children}
    </BoardContext.Provider>
  )
}
