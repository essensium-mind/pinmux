/**
 * Separate the selected pins into their own bus entries.
 *
 * @param boardPinsDef Board pins definition.
 * @param selectedPins Object with pin name as key and pin definition as value.
 * @param busName
 */
function separateSelectedPinsIntoBusses (boardPinsDef, selectedPins, busName) {
  return Object.entries(selectedPins).reduce((obj, [key, value]) => {
    const currBus = value[busName];

    if (!obj[currBus]) {
      // If the bus number didn't get it's own list yet. Create a basic list.
      obj[currBus] = []
    }

    obj[currBus].push({
      address: boardPinsDef[key].address,
      mode: value.mode,
      func: value.function,
      number: value.number
    })

    return obj
  }, {})
}

/**
 * Filter the given set of selected pin passed as argument to
 * only include the protocol passed as argument and split the filtered selected
 * pins into different object entries based on the different bus/port.
 *
 * @param boardPinsDef Board pins definition.
 * @param selectedPins Object with pin name as key and pin definition as value.
 * @param protocol Only returns the selectedPins for this given protocol.
 */
export function splitProtocolIntoBusNumber(boardPinsDef, selectedPins, protocol) {
  return separateSelectedPinsIntoBusses(
    boardPinsDef,
    Object.entries(selectedPins).reduce((obj, [key, value]) => {
      if (value && value.protocol === protocol) {
        obj[key] = value
      }
      return obj
    }, {}),
    protocol === 'gpio' ? 'port' : 'bus'
  )
} 
