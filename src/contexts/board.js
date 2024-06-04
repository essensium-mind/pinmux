import React, { useState, useContext } from 'react'

const BoardContext = React.createContext({
  name: "",
  image: "",
  headers: [],
  pins: {},
  setBoard: undefined
});

export function useBoardContext () {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoardContext must be used within a BoardProvider");
  }
  return context;
};

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
  const [metadata, setMetadata] = useState(_getBoardMetadata(board))

  return (
    <BoardContext.Provider value={{
      name: metadata.name,
      image: metadata.image,
      headers: board.headers.map(h => ({
        ...h,
        pitch: h.pitch[metadata.id],
        position: h.position[metadata.id]
      })),
      pins: board.pins,
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
        setMetadata(_getBoardMetadata(board, variant));
      },
      setBoard: (board, variant) => {
        setMetadata(_getBoardMetadata(board, variant));
        setBoard(board);
      },
    }}>
      {children}
    </BoardContext.Provider>
  );
}
