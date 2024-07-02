import { useState } from 'react'
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppGeometryContext } from '../../contexts/geometry.js'
import { Modal, ModalBody, ModalHeader } from '../modal'
import { PrimaryButton } from '../button'

import './Settings.css'

export function SettingsModal() {
  const [show, setShow] = useState(false)
  const { board: { variants } } = useAppGeometryContext()
  const navigate = useNavigate()
  const params = useParams()

  const handleClick = ({ id }) => {
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
          <div className="pinmux-settings-variant-container">
            {variants.map(v => {
              return (
                <div className="pinmux-settings-variant-card" onClick={() => handleClick(v)} key={v.id}>
                  <img src={require(`../../assets/images/${v.image}`)}/>
                  <p>
                    {v.name}
                  </p>
                </div>
              )
            })}
          </div>
        </ModalBody>
      </Modal>
      <PrimaryButton inverted onClick={() => setShow(true)}>
        <FontAwesomeIcon icon="fa-solid fa-gear" />
      </PrimaryButton>
    </>
  )
}


