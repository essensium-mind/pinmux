import { useSelectedPinContext } from '../../contexts/pins.js';
import bone from '../../am335-boneblack.json';
import './DeviceTree.css';

export function DeviceTreeOutput() {
  const { selectedPins } = useSelectedPinContext();

  const separateBusses = (pins, busName) => (
    pins.reduce((prev, curr) => {
      const currBus = selectedPins[curr][busName];
      if (!prev[currBus]) {
        prev[currBus] = [];
      }
      prev[currBus].push({
        address: bone.pins[curr].address,
        mode: selectedPins[curr].mode,
        func: selectedPins[curr].function,
        number: selectedPins[curr].number
      })
      return prev;
    }, {})

  );

  const pinmux = (proto, busName = 'bus') => {
    const busses = separateBusses(
      Object.keys(selectedPins).filter(k => selectedPins[k] !== undefined && selectedPins[k].protocol === proto),
      busName
    );

    if (Object.keys(busses).length) {
      let out = ''

      Object.keys(busses)
        .forEach(bus => {
          out += `\t${proto}${bus}_pins: pinmux_${proto}${bus}_pins {\n\t\tpinctrl-single,pins = <\n`;

          busses[bus].forEach(({address, mode, func, number }) => {
            const direction = func === 'SCLK' ?
              'PIN_OUTPUT_PULLUP'
                : func === 'TXD' ? 
              'PIN_OUTPUT_PULLDOWN'
                : 
              'PIN_INPUT_PULLUP'

            out += `\t\t\tAM33XX_IOPAD(${address}, ${direction} | MUX_MODE${mode}); /* ${proto.toUpperCase()}${bus}_${func ? func.toUpperCase() : number} */\n`;
          })

          out += `\t\t>;\n\t};\n\n`;
        });

      return out;
    } else {
      return ''
    }
  }

  return (
    <div className="device-tree">
      <textarea className="device-tree" readOnly value={`&am33xx_pinmux {\n${pinmux('i2c')}${pinmux('spi')}${pinmux('uart')}${pinmux('gpio', 'port')}};\n`}/>
    </div>
  )
}

