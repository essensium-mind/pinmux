import { useRef, useState } from 'react';
import { useBoardContext } from '../../contexts/board.js'
import { useSelectedPinContext } from '../../contexts/pins.js';
import { useSelectedHeaderContext, SelectedHeaderProvider } from '../../contexts/header.js';
import { useResizeObserver, useTableSizeObserver } from '../../hooks/resize.js';
import { useWindowDimensions } from '../../hooks/windows.js';
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

function Pin({ offset, innerSize, borderSize, pin, shown }) {
  const { pins: boardPinsDef } = useBoardContext()
  const UnwrappedPin = ({ shown, id, justify }) => {
    const desc = (align) => (boardPinsDef[id] ? (
      <Legend shown={shown} id={id} align={align} desc={boardPinsDef[id]}/>) : (
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

function Header({ ratio, pitch, header, imagePos }) {
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
      (imagePos.left + (ratio * header.position.x)) :
      (imagePos.left + (ratio * header.position.x) - columnSize[0])
  }

  // FIXME Only vertical header are supported so far.
  const headerLength = header.contents.length;
  const adjustedPitch = ratio * pitch;

  // Because pixels are not precise enough to perfectly match with the header
  // representation in the image. We need to add a pixel offset on a regular
  // basis to compensate the mismatch in length.

  // The following variable are computed based on a visual representation
  // I found pleasing and does not follow any guidelines.
  const _borderPixelGrow = 1; // How much bigger in pixel the border is relative to innerSize
  const _pinSize = (Math.floor(adjustedPitch) - (2 * _borderPixelGrow)) / 3;
  const innerSize = Math.floor(_pinSize) + Math.round((_pinSize - Math.floor(_pinSize)) * 3);
  const borderSize = Math.floor(_pinSize + _borderPixelGrow);

  // Based on the rounded header pixel height, compute how many pixels we have
  // to compensate to match the representation of the header in the image.
  const _headerRepresentationTotalHeight = innerSize + (2 * borderSize);
  const missingPixels = Math.round(adjustedPitch * headerLength) - (_headerRepresentationTotalHeight * headerLength)

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
    >
      <div 
        style={{
          position: 'absolute',
          top: imagePos.top + (ratio * header.position.y) - headerHeight - 18,
          left: imagePos.left + (ratio * header.position.x),
        }} 
        ref={headerRef}
        className={`pin-header-title pin-header-title-${shown ? 'selected' : 'hidden'}`}
      >
        <span onClick={() => select(header.name)}>{header.name}</span>
      </div>
      <table
        style={{
          position: 'absolute',
          top: imagePos.top + (ratio * header.position.y),
          left: xOffset,
          zIndex: shown ? 10 : 5
        }}
      >
        <tbody ref={tableRef}>
          {header.contents.map((pin, index) => (
            <Pin offset={offsetIndex[index]} innerSize={innerSize} borderSize={borderSize} key={`pin-header-line-${header.name}-${index}`} shown={shown} pin={pin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Board () {
  const { name: boardName, image: boardImage, headers: boardHeadersDef } = useBoardContext()
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const { height: windowHeight } = useWindowDimensions();
  const { width: containerWidth, height: containerHeight } = useResizeObserver(containerRef);
  const { width: imgWidth, height: imgHeight } = useResizeObserver(imgRef);
  const [ imgOriginalDimension, setImgOriginalDimension ] = useState({
    originalWidth: undefined,
    originalHeight: undefined,
  });

  const onImgLoad = ({ target }) => {
    setImgOriginalDimension({
      originalWidth: target.naturalWidth,
      originalHeight: target.naturalHeigh
    });
  }

  const _margin = 40;
  const _headerHeight = 103; // TODO Compute this directly from the header
  const boardImgHeight = windowHeight - (_headerHeight + 2 * _margin);

  // Offset relative to the container the image is wrapped in.
  // The image is centered inside that container.
  const imagePos = { 
    left: (containerWidth - imgWidth) / 2,
    top: (containerHeight - imgHeight) / 2,
  }

  return (
    <SelectedHeaderProvider headerInit={boardHeadersDef.length ? boardHeadersDef[0].name : ''}>
      <div className="board-container" style={{ marginTop: _margin, minWidth: containerWidth }} ref={containerRef}>
        <img style={{ height: boardImgHeight }} onLoad={onImgLoad} ref={imgRef} src={require(`../../assets/images/${boardImage}`)} alt={boardName}/>
        <div className="pin-overlay">
          {boardHeadersDef.map(header =>
            <Header 
              ratio={(imgOriginalDimension.originalWidth && containerWidth) ? (imgWidth / imgOriginalDimension.originalWidth) : 1}
              pitch={header.pitch}
              imagePos={imagePos}
              key={`pin-header-${header.name}`} 
              header={header}
            />
          )}
        </div>
      </div>
    </SelectedHeaderProvider>
  );
}
