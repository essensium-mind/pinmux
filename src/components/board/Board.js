import { useRef, useEffect, useLayoutEffect } from 'react';
import { useSelectedPinContext } from '../../contexts/pins.js';
import { useAppGeometryContext } from '../../contexts/geometry.js'
import { useSelectedHeaderContext } from '../../contexts/header.js';
import { useResizeObserver } from '../../hooks/resize.js';

import './Board.css';

const isSelected = (ctx, id, protocol) => {
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

const Legend = ({ align, desc, id, maxHeight, shown, }) => (
  <td style={{ textAlign: align, visibility: shown ? 'visible' : 'hidden' }}>
    <span style={{ fontSize: maxHeight > 30 ? Math.floor(maxHeight / 2) : Math.floor(maxHeight * 0.6) }}>
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
    </span>
  </td>
);

function Pin({ offset, innerSize, borderSize, pin, shown }) {
  const { board: { definition: { pins: boardPinsDef } } } = useAppGeometryContext()
  const UnwrappedPin = ({ shown, id, justify }) => {
    const desc = (align) => (boardPinsDef[id] ? (
      <Legend maxHeight={innerSize + 2 * borderSize} shown={shown} id={id} align={align} desc={boardPinsDef[id]}/>) : (
      <td>{id}</td>));

    return (
      <>
        { justify === "left" ? desc('right') : null }
        <td style={{ height: innerSize + offset, width: innerSize, borderWidth: borderSize }} className="female-pin"/>
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

function Header({ header, pins, pos }) {
  const { select, selectedHeader } = useSelectedHeaderContext()
  const { board: { image: { loading } }, onOverlayHeaderResize } = useAppGeometryContext()

  const headerRef = useRef();
  const pinRef = useRef();
  const { width: hWidth, height: hHeight } = useResizeObserver(pinRef)
  useLayoutEffect(() => {
    if (pinRef.current && headerRef.current) {
      onOverlayHeaderResize(headerRef.current)
    }
  }, [hWidth, hHeight, pinRef, headerRef])

  const shown = (selectedHeader === header.name) && !loading;

  // FIXME Only vertical header are supported so far.
  const headerLength = header.contents.length;

  // Because pixels are not precise enough to perfectly match with the header
  // representation in the image. We need to add a pixel offset on a regular
  // basis to compensate the mismatch in length.

  // The following variable are computed based on a visual representation
  // I found pleasing and does not follow any guidelines.
  const _borderPixelGrow = 1; // How much bigger in pixel the border is relative to innerSize
  const _pinSize = (Math.floor(pins.pitch) - (2 * _borderPixelGrow)) / 3;
  const innerSize = Math.floor(_pinSize) + Math.round((_pinSize - Math.floor(_pinSize)) * 3);
  const borderSize = Math.floor(_pinSize + _borderPixelGrow);

  // Based on the rounded header pixel height, compute how many pixels we have
  // to compensate to match the representation of the header in the image.
  const _headerRepresentationTotalHeight = innerSize + (2 * borderSize);
  const missingPixels = Math.round(pins.pitch * headerLength) - (_headerRepresentationTotalHeight * headerLength)

  // Create an evenly distribution of the offsets.
  const offsetIndex = (missingPixels < (headerLength / 2)) ?
    Array.apply(null, Array(headerLength)).map((_, i) => {
      return Number((i % Math.floor(headerLength / missingPixels)) === 0)
    }) :
    Array.apply(null, Array(headerLength)).map((_, i) => {
      return Number((i % Math.floor(headerLength / (headerLength - missingPixels))) > 0)
    });

  return (
    <div
      style={{
        zIndex: shown ? 10 : 5
      }}
      className="header-connector"
      id={header.name}
      ref={headerRef}
    >
      <div 
        style={{
          position: 'absolute',
          ...pos,
        }} 
        className={`pin-header-title pin-header-title-${shown ? 'selected' : 'hidden'}`}
      >
        <span onClick={() => select(header.name)}>{header.name}</span>
      </div>
      <table
        ref={pinRef}
        style={{
          position: 'absolute',
          zIndex: shown ? 10 : 5,
          ...pins.pos,
        }}
      >
        <tbody>
          {header.contents.map((pin, index) => (
            <Pin offset={offsetIndex[index]} innerSize={innerSize} borderSize={borderSize} key={`pin-header-line-${header.name}-${index}`} shown={shown} pin={pin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Board () {
  const {
    board: {
      metadata: {
        name,
      },
      container: {
        size: cSize,
      },
      overlay: {
        headers,
      },
      image: {
        src,
        margin,
        loading,
        size: { height: imgHeight },
      },
      side,
    },
    onImgLoad,
    onContainerResize,
  } = useAppGeometryContext()
  const { selectedHeader, select } = useSelectedHeaderContext()

  const containerRef = useRef()
  const { width: cWidth, height: cHeight } = useResizeObserver(containerRef)

  useLayoutEffect(() => {
    if (cSize.width !== cWidth || cSize.height !== cHeight) {
      onContainerResize({ width: cWidth, height: cHeight })
    }
  }, [cWidth, cHeight])

  useEffect(() => {
    if (Object.values(headers).length) {
      const newHeader = Object.values(headers)[0].id
      if (newHeader != selectedHeader) {
        select(newHeader)
      }
    } else {
      select('')
    }
  }, [name, side])

  return (
    <div ref={containerRef} className="board-container" style={{ visibility: loading ? 'hidden' : 'visible', margin, minWidth: cSize.width }}>
      <img onLoad={({ target }) => onImgLoad({ width: target.naturalWidth, height: target.naturalHeight })} style={{ height: imgHeight }} src={src && require(`../../assets/images/${src}`)} alt={name}/>
      <div className="pin-overlay">
        {
          !loading && Object.values(headers).map(header => {
            return (
              <Header
                pins={header.pins}
                pos={header.header.pos}
                key={`pin-header-${header.id}`}
                header={header.definition}
              />
          )})
        }
      </div>
    </div>
  );
}
