import { useState } from 'react'
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppGeometryContext } from '../../contexts/geometry.js'
import { Modal, ModalBody, ModalHeader } from '../modal'
import { CardContainer, Card, CardBody, CardImg } from '../card'
import { PrimaryButton } from '../button'

function boardHasSideOption (image) {
  return typeof image === "object"
}

function SettingsBoardSide({ handleClick, current, image }) {
  return (
    <CardContainer>
      <Card selected={current === 'front'} onSelect={() => handleClick('front')}>
        <CardImg src={require(`../../assets/images/${image['front']}`)}/>
        <CardBody>
          Front
        </CardBody>
      </Card>
      <Card selected={current === 'back'} onSelect={() => handleClick('back')}>
        <CardImg src={require(`../../assets/images/${image['back']}`)}/>
        <CardBody>
          Back
        </CardBody>
      </Card>
    </CardContainer>
  )
}

function SettingsBoardVariant({ handleClick, current, variants }) {
  return (
    <CardContainer>
      {variants.map(v => {
        return (
          <Card selected={current === v.id} onSelect={() => handleClick(v)} key={v.id}>
            <CardImg src={require(`../../assets/images/${v.image}`)}/>
            <CardBody>
              {v.name}
            </CardBody>
          </Card>
        )
      })}
    </CardContainer>
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
