function bus(proto, bus, pins) {
  const gpio = Math.min(...pins.map(p => p.address))
  return [
    `${proto}${bus}_gpio${gpio}: ${proto}${bus}_gpio${gpio} {`,
    `\tbrcm,pins = <${pins.map(p => p.address).sort().join(' ')}>;`,
    `\tbrcm,function = <${pins.find(p => p.mode).mode}>;`,
    `};`,
  ]
}

function top_node(definitions) {
  return [
      '&gpio {',
     ...definitions,
     '};'
  ]
}

export default {
    top_node,
    bus,
}
