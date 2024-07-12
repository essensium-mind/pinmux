import { useLayoutEffect } from 'react'
import { useParams } from "react-router-dom"

import { SelectedHeaderProvider } from '../contexts/header.js'
import { useAppGeometryContext } from '../contexts/geometry.js'
import { useSelectedPinContext } from '../contexts/pins.js'

import { Board } from '../components/board/Board.js'
import { SettingsModal } from '../components/board/Settings.js'
import { DeviceTreeOutput } from '../components/dts/DeviceTree.js'
import { PrimaryButton } from '../components/button'
import { HeaderContent } from '../components/header'


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function ClearButton() {
  const { clear } = useSelectedPinContext();

  return (
    <PrimaryButton inverted onClick={clear}>
      <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
    </PrimaryButton>
  );
}

export default function BoardView() {
  const { onBoardDefinitionChange, board: { metadata: { name } } } = useAppGeometryContext()
  const params = useParams()

  useLayoutEffect(() => {
    const board = require(`../assets/boards/${params.arch}/${params.vendor}/${params.name}.json`)
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
