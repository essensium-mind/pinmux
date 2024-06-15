import { useBoardContext } from '../../contexts/board.js'
import { useSelectedPinContext } from '../../contexts/pins.js';
import { useAppGeometryContext } from '../../contexts/geometry.js'
import { useSelectedHeaderContext, SelectedHeaderProvider } from '../../contexts/header.js';
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
  const { pins: boardPinsDef } = useBoardContext()
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

function Header({ header }) {
  const { select, selectedHeader } = useSelectedHeaderContext()
  const { board: { image: { loading } } } = useAppGeometryContext()

  const shown = (selectedHeader === header.name) && !loading;

  const { board: {
    overlay: {
      headers: headersGeometry
    },
  } } = useAppGeometryContext();

  const {
    pins: {
      pitch,
      pos: pinsPos,
    },
    header: {
      pos: headerPos,
    }
  } = headersGeometry[header.name];

  // FIXME Only vertical header are supported so far.
  const headerLength = header.contents.length;

  // Because pixels are not precise enough to perfectly match with the header
  // representation in the image. We need to add a pixel offset on a regular
  // basis to compensate the mismatch in length.

  // The following variable are computed based on a visual representation
  // I found pleasing and does not follow any guidelines.
  const _borderPixelGrow = 1; // How much bigger in pixel the border is relative to innerSize
  const _pinSize = (Math.floor(pitch) - (2 * _borderPixelGrow)) / 3;
  const innerSize = Math.floor(_pinSize) + Math.round((_pinSize - Math.floor(_pinSize)) * 3);
  const borderSize = Math.floor(_pinSize + _borderPixelGrow);

  // Based on the rounded header pixel height, compute how many pixels we have
  // to compensate to match the representation of the header in the image.
  const _headerRepresentationTotalHeight = innerSize + (2 * borderSize);
  const missingPixels = Math.round(pitch * headerLength) - (_headerRepresentationTotalHeight * headerLength)

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
    >
      <div 
        style={{
          position: 'absolute',
          ...headerPos,
        }} 
        className={`pin-header-title pin-header-title-${shown ? 'selected' : 'hidden'}`}
      >
        <span onClick={() => select(header.name)}>{header.name}</span>
      </div>
      <table
        style={{
          position: 'absolute',
          zIndex: shown ? 10 : 5,
          ...pinsPos,
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
  const { name: boardName, image: boardImage, headers: boardHeadersDef } = useBoardContext()
  const { board: {
    container: { 
      ref: containerRef,
      size: { width: containerWidth }
    },
    overlay: {
      ref: overlayRef
    },
    image: {
      margin,
      loading,
      size: { height: imgHeight },
      onLoad
    }
  } } = useAppGeometryContext();

  return (
    <SelectedHeaderProvider headerInit={boardHeadersDef.length ? boardHeadersDef[0].name : ''}>
      <div ref={containerRef} className="board-container" style={{ visibility: loading ? 'hidden' : 'visible', margin, minWidth: containerWidth }}>
        <img onLoad={onLoad} style={{ height: imgHeight }} src={require(`../../assets/images/${boardImage}`)} alt={boardName}/>
        <div ref={overlayRef} className="pin-overlay">
          {boardHeadersDef.map(header =>
            <Header 
              key={`pin-header-${header.name}`} 
              header={header}
            />
          )}
        </div>
      </div>
    </SelectedHeaderProvider>
  );
}
