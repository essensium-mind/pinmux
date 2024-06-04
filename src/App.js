import { BoardProvider } from './contexts/board.js'
import { useSelectedPinContext, SelectedPinProvider } from './contexts/pins.js';
import { Board } from './components/board/Board.js'
import { DeviceTreeOutput } from './components/dts/DeviceTree.js'
import MindLogo from './assets/images/logos/mind_logo.svg';
import bone from './am335-boneblack.json';

import './App.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faRotateRight, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faLinkedin, faRotateRight, faGlobe);

function ClearButton() {
  const { clear } = useSelectedPinContext();

  return (
    <button className="reload-button" onClick={clear}>
      <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
    </button>
  );
}

function Header() {
  return (
    <section className="header">
      <li>
        <ul><img height="80" src={MindLogo} alt='mind-logo'/></ul>
        <ul>PinMux</ul>
        <ul>
          <ClearButton/>
        </ul>
      </li>
      <li className="brand">
        <ul><a href="https://mind.be/"><FontAwesomeIcon icon="fa-solid fa-globe" /></a></ul>
        <ul><a href="https://www.linkedin.com/company/mind-software-consultancy/"><FontAwesomeIcon icon="fa-brands fa-linkedin" /></a></ul>
      </li>
    </section>
  );
}

function App() {
  return (
    <BoardProvider boardDefinition={bone}>
      <SelectedPinProvider>
        <Header/>
        <section className="body">
            <Board/>
            <DeviceTreeOutput/>
        </section>
      </SelectedPinProvider>
    </BoardProvider>
  );
}

export default App;
