import React, { useState, useContext } from 'react'

const SelectedHeaderContext = React.createContext({
  selectedHeader: '',
  select: () => {},
});

export function useSelectedHeaderContext () {
  const context = useContext(SelectedHeaderContext);
  if (context === undefined) {
    throw new Error("useSelectedHeaderContext must be used within a SelectedHeaderProvider");
  }
  return context;
}

export function SelectedHeaderProvider ({ children }) {
  const [selectedHeader, setSelectedHeader] = useState('');

  const select = (name) => {
    if (name === selectedHeader) {
      return setSelectedHeader('');
    } else {
      setSelectedHeader(name);
    }
  }

  return (
    <SelectedHeaderContext.Provider value={{ selectedHeader, select }}>
      {children}
    </SelectedHeaderContext.Provider>
  );
}
