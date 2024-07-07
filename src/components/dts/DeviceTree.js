import { useAppGeometryContext } from '../../contexts/geometry'
import { useSelectedPinContext } from '../../contexts/pins'
import { splitProtocolIntoBusNumber } from '../../common'

import './DeviceTree.css'

export function DeviceTreeOutput() {
  const { board: { definition: { pins: boardPinsDef } } } = useAppGeometryContext()
  const { selectedPins } = useSelectedPinContext();

  const pinmux = (proto) => {
    const busses = splitProtocolIntoBusNumber(boardPinsDef, selectedPins, proto)

    if (Object.keys(busses).length) {
      let out = ''

      Object.keys(busses)
        .forEach(bus => {
          out += `\t${proto}${bus}_pins: pinmux_${proto}${bus}_pins {\n\t\tpinctrl-single,pins = <\n`

          busses[bus].forEach(({address, mode, func, number }) => {
            const direction = func === 'SCLK' ?
              'PIN_OUTPUT_PULLUP'
                : func === 'TXD' ? 
              'PIN_OUTPUT_PULLDOWN'
                : 
              'PIN_INPUT_PULLUP'

            out += `\t\t\tAM33XX_IOPAD(${address}, ${direction} | MUX_MODE${mode}); /* ${proto.toUpperCase()}${bus}_${func ? func.toUpperCase() : number} */\n`
          })

          out += `\t\t>;\n\t};\n\n`
        });

      return out
    } else {
      return ''
    }
  }

  return (
    <div className="device-tree">
      <textarea className="device-tree" readOnly value={`&am33xx_pinmux {\n${pinmux('i2c')}${pinmux('spi')}${pinmux('uart')}${pinmux('gpio')}};\n`}/>
    </div>
  )
}

