import React, {useState, useContext, useRef, useEffect} from 'react';
import './App.css';
import bone from './am335-boneblack.json';
import { useWindowDimensions } from './hooks/windows.js';

const SelectedPinContext = React.createContext({
  selectedPins: {},
  select: (_) => {},
  unselect: (_) => {},
});

const isSelected = (ctx, id, protocol, _) => {
  return ctx.selectedPins[id] && ctx.selectedPins[id].protocol === protocol;
}

const ClickableLegend = ({id, type, desc}) => {
  const ctx = useContext(SelectedPinContext);

  const selected = isSelected(ctx, id, type, desc);

  const onClick = () => {
    if (selected) {
      ctx.unselect(id, type, desc);
    } else {
      ctx.select(id, type, desc);
    }
  };

  const className = `pin-desc ${type}${selected ? '-selected' : ''}`
  const name = type === 'gpio' ? 
    `${type.toUpperCase()}${desc.port}_${desc.number}` :
    `${type.toUpperCase()}${desc.bus}_${desc.function}${desc.number !== undefined ? desc.number : ''}`

  return (
    <span onClick={onClick} className={className}>
      {name}
    </span>
  );
}

const Legend = ({ align, id, desc }) => (
  <td style={{ textAlign: align }}>
    {typeof desc === 'string' ? (
      <span className={`pin-desc ${desc}`}>{desc}</span>
    ) : desc.style ? (
      <span className={`pin-desc ${desc.style}`}>{desc.name}</span>
    ) : align === 'right' ? (
      desc.tags.toReversed().map(tag => (
        <ClickableLegend key={id + tag} id={id} type={tag} desc={desc[tag]}/>
      ))) : (
      desc.tags.map(tag => (
        <ClickableLegend key={id + tag} id={id} type={tag} desc={desc[tag]}/>
      ))
    )}
  </td>
);

function Pin({ pin, shown }) {
  const FemalePin = ({ id, justify }) => {
    const desc = (align) => (bone.pins[id] ?
      (<Legend id={id} align={align} desc={bone.pins[id]}/>) : (
      <td>{id}</td>
    ));

    return (
      <>
        { justify === "left" && shown ? desc('right') : null }
        <td className="female-pin"/>
        { justify === "right" && shown ? desc('left') : null }
      </>
    );
  };

  if (Array.isArray(pin)) {
    const [first, ...pins] = pin.slice(0,-1);
    const last = pin.slice(-1)
    return (
      <tr className="pin-row">
        <FemalePin shown={shown} key={first} id={first} justify="left" />
        {pins ? (
            pins.map(id => <FemalePin shown={shown} key={id} id={id} />)
        ) : null}
        <FemalePin shown={shown} key={last} id={last} justify="right" />
      </tr>
    )
  } else {
    return (
      <FemalePin key={pin} id={pin} justify="left" />
    );
  }
}

function Header({ header, shown, setShown }) {
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState();

  const tableRef = useRef(null);

  useEffect(() => {
    if (!tableRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if(tableRef.current.offsetWidth !== width) {
        setWidth(tableRef.current.offsetWidth); 
      }
    });
    
    resizeObserver.observe(tableRef.current);

    return function cleanup() {
      resizeObserver.disconnect();
    }
  }, [width]);

  return (
    <div style={{top: header.position.y - 58, left: ((windowWidth - width) / 2) - 192 + header.position.x }} className="header-connector">
      <h3 className="pin-header-title"><span onClick={setShown}>{header.name}</span></h3>
      <table ref={tableRef}>
        <tbody>
          {header.contents.map((pin, index) => (
            <Pin shown={shown} key={`pin-header-line-${header.name}-${index}`} pin={pin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviceTreeOutput() {
  const { selectedPins } = useContext(SelectedPinContext);

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
            out += `\t\t\tAM33XX_IOPAD(${address}, PIN_INPUT_PULLUP | MUX_MODE${mode}); /* ${proto.toUpperCase()}${bus}_${func ? func.toUpperCase() : number} */\n`;
          })

          out += `\t\t>;\n\t};\n\n`;
        });

      return out;
    } else {
      return ''
    }
  }

  return (
    <textarea className="device-tree" readOnly value={`&am33xx_pinmux {\n${pinmux('i2c')}${pinmux('spi')}${pinmux('uart')}${pinmux('gpio', 'port')}};\n`}/>
  )
}

function App() {
  const [selectedPins, setSelectedPins] = useState({});
  const [shownPinHeader, setShownPinHeader] = useState(bone.headers[0].name);

  const updateUnselected = (id, protocol, _) => {
    setSelectedPins({...selectedPins, [id]: undefined });
    if (protocol !== 'gpio') {

    }
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

      const muxablePins = Object.keys(bone.pins)
        .filter(k => (typeof bone.pins[k] !== 'string' && bone.pins[k].tags))
        .reduce((previous, k) => ({ ...previous, [k]: bone.pins[k] }),{});

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
    <SelectedPinContext.Provider value={{ selectedPins, select: updateSelected, unselect: updateUnselected }}>
      <div>
        <div className="header">
          <li>
            <ul>PinMux</ul>
            <ul>
              <button onClick={() => setSelectedPins({})}>
                {'🔄'}
              </button>
            </ul>
          </li>
        </div>
        <div className="wrapper">
          <img src={require(`./assets/images/${bone.metadata.image}`)} alt={bone.metadata.name}/>
          <div className="pin-overlay">
            {bone.headers.map(header =>
              <Header 
                shown={header.name === shownPinHeader} 
                setShown={() => setShownPinHeader(header.name)}
                key={`pin-header-${header.name}`} 
                header={header}
              />
            )}
          </div>
        </div>
        <div className="device-tree">
          <DeviceTreeOutput/>
        </div>
      </div>
    </SelectedPinContext.Provider>
  );
}

export default App;
