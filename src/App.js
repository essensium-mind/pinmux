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
    <section className="header">
      <li>
        <ul>PinMux</ul>
        <ul>
          <ClearButton/>
        </ul>
      </li>
    </section>
  );
}

function App() {
  return (
    <SelectedPinProvider>
       <Header/>
       <section className="body">
        <Board/>
        <DeviceTreeOutput/>
       </section>
    </SelectedPinProvider>
  );
}

export default App;
