import { useState, useRef, useLayoutEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useParams } from "react-router-dom";
import { useBoardContext, BoardProvider } from './contexts/board.js'
import { useAppGeometryContext, AppGeometryProvider } from './contexts/geometry.js'
import { useSelectedPinContext, SelectedPinProvider } from './contexts/pins.js';
import { Board } from './components/board/Board.js'
import { DeviceTreeOutput } from './components/dts/DeviceTree.js'
import { PrimaryButton } from './components/button'
import bone from './assets/boards/arm/ti/am335-boneblack.json';

import './App.css';
import MindLogo from './assets/images/logos/mind_logo.svg';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faRotateRight, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faLinkedin, faRotateRight, faGlobe);

function ClearButton() {
  const { clear } = useSelectedPinContext();

  return (
    <PrimaryButton inverted onClick={clear}>
      <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
    </PrimaryButton>
  );
}

function Header() {
  const { name } = useBoardContext();
  const { header: { ref }} = useAppGeometryContext();

  return (
    <section ref={ref} className="header">
      <li>
        <ul><img height="80" src={MindLogo} alt='mind-logo'/></ul>
        <ul>PinMux - {name}</ul>
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

function BoardView() {
  const board = useBoardContext()
  const { setBoard } = board
  const { onBoardDefinitionChange } = useAppGeometryContext()
  const params = useParams()

  useLayoutEffect(() => {
    const board = require(`./assets/boards/${params.arch}/${params.vendor}/${params.name}.json`)
    setBoard(board, params.variant)
  }, [params])

  useLayoutEffect(() => {
    onBoardDefinitionChange(board)
  }, [board])

  return (
    <>
      <Board/>
      <DeviceTreeOutput/>
    </>
  )
}

function RootView() {
  return (
    <BoardProvider boardDefinition={bone}>
      <AppGeometryProvider>
        <SelectedPinProvider>
          <Header/>
          <section className="body">
            <Outlet/>
          </section>
        </SelectedPinProvider>
      </AppGeometryProvider>
    </BoardProvider>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootView/>,
    children: [
      {
        index: true,
        element: <Navigate replace to="/board/arm/ti/am335-boneblack" />
      },
      {
        path: "board/:arch/:vendor/:name/:variant?",
        element: <BoardView/>,
      }
    ]
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
