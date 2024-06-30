import React, { useState, useContext } from 'react'
import { useAppGeometryContext } from './geometry.js';

const SelectedPinContext = React.createContext({
  selectedPins: {},
  select: () => {},
  unselect: () => {},
  clear: () => {},
});

export function useSelectedPinContext () {
  const context = useContext(SelectedPinContext);
  if (context === undefined) {
    throw new Error("useSelectedPinContext must be used within a SelectedPinProvider");
  }
  return context;
}

export function SelectedPinProvider ({ children }) {
  const [selectedPins, setSelectedPins] = useState({});
  const { board: { definition: { pins } } } = useAppGeometryContext()

  const clear = () => setSelectedPins({});

  const updateUnselected = (id) => {
    setSelectedPins({...selectedPins, [id]: undefined });
  };

  const updateSelected = (id, protocol, details) => {
    if (selectedPins[id] !== null && selectedPins[id] !== undefined) {
      // TODO If already selected deselect a whole protocol
      const previous = selectedPins[id];
      updateUnselected(id, previous.protocol, previous);
    }

    const newState = {
      [id]: {
        ...details,
        protocol
      }
    };

    if (protocol !== 'gpio') {
      const isFuncAlreadySelected = (func) => (
        Object.keys(selectedPins).find(x => (
          selectedPins[x] !== undefined 
            && selectedPins[x].function === func 
            && selectedPins[x].bus === details.bus
        ))
      ); // TODO add support for CS0/1

      const pinClash = isFuncAlreadySelected(details.function);
      if (pinClash) {
        newState[pinClash] = undefined;
      }

      const muxablePins = Object.keys(pins)
        .filter(k => (typeof pins[k] !== 'string' && pins[k].tags))
        .reduce((previous, k) => ({ ...previous, [k]: pins[k] }),{});

      const pinsRelatedToProtocol = Object.keys(muxablePins)
        .filter(k => muxablePins[k].tags.includes(protocol))
        .reduce((previous, k) => ({ ...previous, [k]: muxablePins[k] }),{});

      const functions = [...new Set(Object.keys(pinsRelatedToProtocol)
        .map(k => muxablePins[k][protocol].function)
      )].filter(func => func !== details.function)

      functions.forEach(func => {
        if (!isFuncAlreadySelected(func)) {
          const pinOptions = Object.keys(pinsRelatedToProtocol)
            .filter(k => (
              pinsRelatedToProtocol[k][protocol].function === func
                && pinsRelatedToProtocol[k][protocol].bus === details.bus
            ));

          pinOptions.find(pin => {
            if (selectedPins[pin] === undefined) {
              newState[pin] = {
                ...muxablePins[pin][protocol],
                protocol
              };
              return true;
            }
            return false;
          });
        }
      });
    }

    setSelectedPins({
      ...selectedPins, 
      ...newState,
    });
  }

  return (
    <SelectedPinContext.Provider value={{ selectedPins, select: updateSelected, unselect: updateUnselected, clear: clear }}>
      {children}
    </SelectedPinContext.Provider>
  );
}
