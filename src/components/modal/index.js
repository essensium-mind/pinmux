import { createContext, useEffect, useRef, useState, useContext } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LinkButton } from '../button'
import './modal.css'

const ModalContext = createContext({
  close() {},
});

export function ModalHeader ({ closeButton, children }) {
  const { close } = useContext(ModalContext)

  return (
    <div className="modal-header">
      <div className="modal-title">
        {children}
      </div>
      {closeButton && (<LinkButton onClick={close}><FontAwesomeIcon icon="fa-solid fa-close" /></LinkButton>)}
    </div>
  )
}

export function ModalDialog ({ isOpen, children, ...props }) {
  const modalRef = useRef()

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      if (isOpen) {
        modalElement.showModal();
      } else {
        modalElement.close();
      }
    }
  }, [isOpen])

  return (
    <dialog ref={modalRef} {...props} className="modal-dialog">
        {children}
    </dialog>
  )
}

export function ModalBody ({ children, ...props }) {
  return (
    <div {...props} className="modal-content">
      { children }
    </div>
  )
}

export function Modal ({ show, onClose, children }) {
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    if (onClose) onClose()

    setOpen(false)
  }

  const handleKeyDown = (event) => {
    console.log(event);
    if (event.key === "Escape") {
      handleClose();
    }
  }

  useEffect(() => {
    if (show !== open) {
      setOpen(show)
    }
  }, [show])
 
  return (
    <ModalContext.Provider value={{ close: handleClose }}>
      <ModalDialog onKeyDown={handleKeyDown} isOpen={open}>
        { children } 
      </ModalDialog>
    </ModalContext.Provider>
  )
}
