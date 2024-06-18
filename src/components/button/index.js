import { MAIN_COLOR } from '../color'
import './button.css'

export function PrimaryButton({ children, inverted, onClick }) {
  const style = {
    padding: '8px',
    border: `2px solid ${inverted ? 'white' : MAIN_COLOR }`,
    borderRadius: '4px',
    backgroundColor: inverted ? 'transparent' : 'white',
    color: inverted ? 'white' : MAIN_COLOR,
    userSelect: 'none',
    cursor: 'pointer',
    '--hover-color': inverted ? 'orange' : MAIN_COLOR,
  }

  return (
    <button onClick={onClick} style={style}>
      {children}
    </button>
  );
}
