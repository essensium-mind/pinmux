import { useState } from 'react'
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppGeometryContext } from '../../contexts/geometry.js'
import { Modal, ModalBody, ModalHeader } from '../modal'
import { PrimaryButton } from '../button'

import './Settings.css'

function boardHasSideOption (image) {
  return typeof image === "object"
}

function SettingsBoardSide({ handleClick, current, image }) {
  return (
    <div className="pinmux-settings-variant-container">
      <div className={`pinmux-settings-variant-card ${current === 'front' ? 'pinmux-settings-variant-card-selected' : ''}`} onClick={() => handleClick('front')}>
        <img src={require(`../../assets/images/${image['front']}`)}/>
        <p>
          Front
        </p>
      </div>
      <div className={`pinmux-settings-variant-card ${current === 'back' ? 'pinmux-settings-variant-card-selected' : ''}`} onClick={() => handleClick('back')}>
        <img src={require(`../../assets/images/${image['back']}`)}/>
        <p>
          Back
        </p>
      </div>
    </div>
  )
}

function SettingsBoardVariant({ handleClick, current, variants }) {
  return (
    <div className="pinmux-settings-variant-container">
      {variants.map(v => {
        return (
          <div className={`pinmux-settings-variant-card ${current === v.id ? 'pinmux-settings-variant-card-selected' : ''}`} onClick={() => handleClick(v)} key={v.id}>
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
  const { board: { metadata: { id, image }, variants, side }, flipSide } = useAppGeometryContext()
  const navigate = useNavigate()
  const params = useParams()

  const handleVariantClick = ({ id }) => {
    setShow(false)
    navigate(`/board/${params.arch}/${params.vendor}/${params.name}/${id}`)
  }

  const handleSideClick = (side) => {
    setShow(false)
    flipSide(side)
  }

  return (
    <>
      <Modal show={show} onClose={() => setShow(false)}>
        {variants.length && (
          <>
            <ModalHeader closeButton>
              Select Board Variant
            </ModalHeader>
            <ModalBody>
              <SettingsBoardVariant current={id} variants={variants} handleClick={handleVariantClick}/>
            </ModalBody>
          </>
        )}
        {boardHasSideOption(image) && (
          <>
            <ModalHeader closeButton={!variants.length}>
              Select Board Side
            </ModalHeader>
            <ModalBody>
              <SettingsBoardSide current={side} image={image} handleClick={handleSideClick}/>
            </ModalBody>
          </>
        )}
      </Modal>
      <PrimaryButton inverted onClick={() => setShow(true)}>
        <FontAwesomeIcon icon="fa-solid fa-gear" />
      </PrimaryButton>
    </>
  )
}
