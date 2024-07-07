import { useParams } from "react-router-dom";
import { useAppGeometryContext } from '../../contexts/geometry'
import { useSelectedPinContext } from '../../contexts/pins'
import { splitProtocolIntoBusNumber } from '../../common'

import './DeviceTree.css'

export function DeviceTreeOutput() {
  const params = useParams()
  const { board: { definition: { pins: boardPinsDef } } } = useAppGeometryContext()
  const { selectedPins } = useSelectedPinContext();

  const { top_node, bus } = require(`../../assets/boards/${params.arch}/${params.vendor}/`).default

  const pinmux = (proto) => {
    const busses = splitProtocolIntoBusNumber(boardPinsDef, selectedPins, proto)

    return Object.entries(busses).flatMap(([k, pins]) => {
      const ret = bus(proto, k, pins)

      return ret.map(x => `\t${x}`)
    }) || []
  }

  const dts = top_node(
    ['i2c', 'spi', 'uart', 'gpio'].flatMap(proto => pinmux(proto))
  ).join('\n')

  return (
    <div className="device-tree">
      <textarea className="device-tree" readOnly value={dts}/>
    </div>
  )
}

