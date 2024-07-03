import { useState } from 'react'
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppGeometryContext } from '../../contexts/geometry.js'
import { Modal, ModalBody, ModalHeader } from '../modal'
import { PrimaryButton } from '../button'

import './Settings.css'

function SettingsBoardVariant({ handleClick }) {
  const { board: { metadata: { id }, variants } } = useAppGeometryContext()

  return (
    <div className="pinmux-settings-variant-container">
      {variants.map(v => {
        return (
          <div className={`pinmux-settings-variant-card ${id === v.id ? 'pinmux-settings-variant-card-selected' : ''}`} onClick={() => handleClick(v)} key={v.id}>
            <img src={require(`../../assets/images/${v.image}`)}/>
            <p>
              {v.name}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export function SettingsModal() {
  const [show, setShow] = useState(false)
  const navigate = useNavigate()
  const params = useParams()

  const handleVariantClick = ({ id }) => {
    navigate(`/board/${params.arch}/${params.vendor}/${params.name}/${id}`)
    setShow(false)
  }

  return (
    <>
      <Modal show={show} onClose={() => setShow(false)}>
        <ModalHeader closeButton>
          Select Board Variant
        </ModalHeader>
        <ModalBody>
          <SettingsBoardVariant handleClick={handleVariantClick}/>
        </ModalBody>
      </Modal>
      <PrimaryButton inverted onClick={() => setShow(true)}>
        <FontAwesomeIcon icon="fa-solid fa-gear" />
      </PrimaryButton>
    </>
  )
}
