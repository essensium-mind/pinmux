function pin(protocol, bus, { address, mode, func, number }) {
  const direction = func === 'SCLK'
    ? 'PIN_OUTPUT_PULLUP'
    : func === 'TXD'
      ? 'PIN_OUTPUT_PULLDOWN'
      : 'PIN_INPUT_PULLUP'

  return `AM33XX_IOPAD(${address}, ${direction} | MUX_MODE${mode}); /* ${protocol.toUpperCase()}${bus}_${func ? func.toUpperCase() : number} */`
}

function bus(proto, bus, pins) {
  return [
    `${proto}${bus}_pins: pinmux_${proto}${bus}_pins {`,
    `\tpinctrl-single,pins = <`,
    ...pins.map(p => `\t\t${pin(proto, bus, p)}`),
    '\t>;',
    '};',
  ]
}

function top_node(definitions) {
  return [
      '&am33xx_pinmux {',
     ...definitions,
     '};'
  ]
}

export default {
    top_node,
    bus,
}
