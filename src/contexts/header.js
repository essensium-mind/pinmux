import React, { useState, useContext } from 'react'

const SelectedHeaderContext = React.createContext({
  selectedHeader: '',
  select: (_) => {},
});

export function useSelectedHeaderContext () {
  const context = useContext(SelectedHeaderContext);
  if (context === undefined) {
    throw new Error("useSelectedHeaderContext must be used within a SelectedHeaderProvider");
  }
  return context;
};

export function SelectedHeaderProvider ({ headerInit, children }) {
  const [selectedHeader, setSelectedHeader] = useState(headerInit ? headerInit : '');

  const selectFunc = (name) => {
    if (name === selectedHeader) {
      return setSelectedHeader('');
    } else {
      setSelectedHeader(name);
    }
  }

  return (
    <SelectedHeaderContext.Provider value={{ selectedHeader: selectedHeader, select: selectFunc }}>
      {children}
    </SelectedHeaderContext.Provider>
  );
}
