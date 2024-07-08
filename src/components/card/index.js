import './Card.css'

export function CardContainer ({ children, ...props }) { 
  return (
    <div className="pinmux-card-container" {...props}>
      {children}
    </div>
  )
}

export function Card ({ children, selected, onSelect, ...props }) {
  const handleClick = () => {
    if (onSelect) {
      onSelect()
    }
  }

  return (
    <div className={`pinmux-card ${selected ? 'pinmux-settings-variant-card-selected' : ''}`} onClick={() => handleClick()} {...props}>
        {children}
    </div>
  )
}

export function CardImg ({ src, ...props }) {
  return (
    <img src={src} {...props}/>
  )
}

export function CardBody ({ children, ...props }) {
  return (
    <p {...props}>
      {children}
    </p>
  )
}
