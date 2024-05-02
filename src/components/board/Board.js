import { useRef } from 'react';
import { useSelectedPinContext } from '../../contexts/pins.js';
import { useSelectedHeaderContext, SelectedHeaderProvider } from '../../contexts/header.js';
import { useResizeObserver, useTableSizeObserver } from '../../hooks/resize.js';
import bone from '../../am335-boneblack.json';
import './Board.css';

const isSelected = (ctx, id, protocol, _) => {
  return ctx.selectedPins[id] && ctx.selectedPins[id].protocol === protocol;
};

const ClickableLegend = ({id, type, desc}) => {
  const ctx = useSelectedPinContext();

  const selected = isSelected(ctx, id, type, desc);

  const onClick = () => {
    if (selected) {
      ctx.unselect(id, type, desc);
    } else {
      ctx.select(id, type, desc);
    }
  };

  const className = `pin-desc pin-desc-clickable ${type}${selected ? '-selected' : ''}`
  const name = type === 'gpio' ? 
    `${type.toUpperCase()}${desc.port}_${desc.number}` :
    `${type.toUpperCase()}${desc.bus}_${desc.function}${desc.number !== undefined ? desc.number : ''}`

  return (
    <span onClick={onClick} className={className}>
      {name}
    </span>
  );
}

const Legend = ({ align, id, desc, shown }) => (
  <td style={{ textAlign: align, visibility: shown ? 'visible' : 'hidden' }}>
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
  const UnwrappedPin = ({ shown, id, justify }) => {
    const desc = (align) => (bone.pins[id] ? (
      <Legend shown={shown} id={id} align={align} desc={bone.pins[id]}/>) : (
      <td>{id}</td>));

    return (
      <>
        { justify === "left" ? desc('right') : null }
        <td className="female-pin"/>
        { justify === "right" ? desc('left') : null }
      </>
    );
  };

  if (Array.isArray(pin)) {
    const [first, ...pins] = pin.slice(0,-1);
    const last = pin.slice(-1);
    return (
      <tr className="pin-row">
        <UnwrappedPin shown={shown} key={first} id={first} justify="left" />
        {pins ? (
            pins.map(id => <UnwrappedPin shown={shown} key={id} id={id} />)
        ) : null}
        <UnwrappedPin shown={shown} key={last} id={last} justify="right" />
      </tr>
    )
  } else {
    return (
      <tr className="pin-row">
        <UnwrappedPin key={pin} shown={shown} id={pin} justify="left" />
      </tr>
    );
  }
}

function Header({ containerWidth, header, imageSize }) {
  const { select, selectedHeader } = useSelectedHeaderContext()
  const shown = selectedHeader === header.name;

  const headerRef = useRef(null);
  const tableRef = useRef(null);

  const { height: headerHeight } = useResizeObserver(headerRef);
  const { size, columnSize } = useTableSizeObserver(tableRef);

  let xOffset;
  if (size.column === 0 || size.row === 0) {
    xOffset = 0;
  } else {
    xOffset = header.justify === 'vertical' ?
      (imageSize.imageLeft + header.position.x) :
      (imageSize.imageLeft + header.position.x - columnSize[0])
  }

  return (
    <div
      style={{
        zIndex: shown ? 10 : 5
      }}
      className="header-connector"
    >
      <div 
        style={{
          position: 'absolute',
          top: imageSize.imageTop + header.position.y - headerHeight - 18,
          left: imageSize.imageLeft + header.position.x,
        }} 
        ref={headerRef}
        className={`pin-header-title pin-header-title-${shown ? 'selected' : 'hidden'}`}
      >
        <span onClick={() => select(header.name)}>{header.name}</span>
      </div>
      <table
        style={{
          position: 'absolute',
          top: imageSize.imageTop + header.position.y,
          left: xOffset,
          zIndex: shown ? 10 : 5
        }}
      >
        <tbody ref={tableRef}>
          {header.contents.map((pin, index) => (
            <Pin key={`pin-header-line-${header.name}-${index}`} shown={shown} pin={pin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Board () {
  const containerRef = useRef(null);
  const { width, height } = useResizeObserver(containerRef);
  const { imgWidth, imgHeight } = {
    imgWidth: 421,
    imgHeight: 697,
  }; // TODO Get this information dynamically

  const { imageTop, imageLeft } = { 
    imageLeft: (width - imgWidth) / 2,
    imageTop: (height - imgHeight) / 2,
  }

  return (
    <SelectedHeaderProvider headerInit={bone.headers.length ? bone.headers[0].name : ''}>
      <div className="board-container" style={{ minWidth: width }} ref={containerRef}>
        <img src={require(`../../assets/images/${bone.metadata.image}`)} alt={bone.metadata.name}/>
        <div className="pin-overlay">
          {bone.headers.map(header =>
            <Header 
                imageSize={{ imageTop: imageTop, imageLeft: imageLeft }}
                containerWidth={width}
                key={`pin-header-${header.name}`} 
                header={header}
            />
          )}
        </div>
      </div>
    </SelectedHeaderProvider>
  );
}

