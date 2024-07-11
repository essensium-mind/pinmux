import { useLayoutEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useParams } from "react-router-dom";
import { useAppGeometryContext, AppGeometryProvider } from './contexts/geometry.js'
import { useSelectedPinContext, SelectedPinProvider } from './contexts/pins.js';
import { SelectedHeaderProvider } from './contexts/header.js'
import { Board } from './components/board/Board.js'
import { SettingsModal } from './components/board/Settings.js'
import { DeviceTreeOutput } from './components/dts/DeviceTree.js'
import { PrimaryButton } from './components/button'
import { HeaderProvider, Header, HeaderContent } from './components/header'

import './App.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faRotateRight, faGlobe, faGear, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faLinkedin, faRotateRight, faGlobe, faGear, faClose);

function ClearButton() {
  const { clear } = useSelectedPinContext();

  return (
    <PrimaryButton inverted onClick={clear}>
      <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
    </PrimaryButton>
  );
}

function BoardView() {
  const { onBoardDefinitionChange, board: { metadata: { name } } } = useAppGeometryContext()
  const params = useParams()

  useLayoutEffect(() => {
    const board = require(`./assets/boards/${params.arch}/${params.vendor}/${params.name}.json`)
    onBoardDefinitionChange(board, params.variant)
  }, [params])

  return (
    <>
      <HeaderContent title={name}>
        <ClearButton/>
        <SettingsModal/>
      </HeaderContent>
      <SelectedHeaderProvider>
        <Board/>
      </SelectedHeaderProvider>
      <DeviceTreeOutput/>
    </>
  )
}

function RootView() {
  return (
    <AppGeometryProvider>
      <SelectedPinProvider>
        <HeaderProvider>
          <Header/>
          <section className="body">
            <Outlet/>
          </section>
        </HeaderProvider>
      </SelectedPinProvider>
    </AppGeometryProvider>
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
