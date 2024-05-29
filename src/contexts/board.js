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

export function BoardProvider ({ boardDefinition, children }) {
  const [board, setBoard] = useState(boardDefinition)

  return (
    <BoardContext.Provider value={{
      name: board.metadata.name,
      image: board.metadata.image,
      headers: board.headers,
      pins: board.pins,
      setBoard,
    }}>
      {children}
    </BoardContext.Provider>
  );
}
