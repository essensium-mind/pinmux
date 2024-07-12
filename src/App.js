import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom"
import { AppGeometryProvider } from './contexts/geometry.js'
import { SelectedPinProvider } from './contexts/pins.js'
import { HeaderProvider, Header } from './components/header'
import { BoardView } from "./routes"

import './App.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faRotateRight, faGlobe, faGear, faClose } from '@fortawesome/free-solid-svg-icons';

library.add(faLinkedin, faRotateRight, faGlobe, faGear, faClose);

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
