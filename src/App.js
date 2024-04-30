import { Board } from './components/board/Board.js'
import { DeviceTreeOutput } from './components/dts/DeviceTree.js'
import { useSelectedPinContext, SelectedPinProvider } from './contexts/pins.js';

import './App.css';

function ClearButton() {
  const { clear } = useSelectedPinContext();

  return (
    <button onClick={clear}>
      {'🔄'}
    </button>
  );
}

function Header() {
  return (
    <div className="header">
      <li>
        <ul>PinMux</ul>
        <ul>
          <ClearButton/>
        </ul>
      </li>
    </div>
  );
}

function App() {
  return (
    <SelectedPinProvider>
       <Header/>
       <Board/>
       <DeviceTreeOutput/>
    </SelectedPinProvider>
  );
}

export default App;
