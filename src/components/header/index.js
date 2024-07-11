import React, { useLayoutEffect, useContext, useEffect, useState, useRef } from "react"
import { useAppGeometryContext } from "../../contexts/geometry"
import { useResizeObserver } from "../../hooks/resize"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import MindLogo from '../../assets/images/logos/mind_logo.svg';
import './Header.css'

const HeaderContext = React.createContext({
  title: '',
  contents: [],
  set: () => {}
})

function useHeaderContext () {
  const context = useContext(HeaderContext)

  if (context === undefined) {
    throw new Error("useHeaderContext must be used within a HeaderProvider")
  }

  return context
}

export function Header() {
  const { header: { size }, onHeaderResize } = useAppGeometryContext()
  const { title, contents } = useHeaderContext()

  const ref = useRef()
  const hSize = useResizeObserver(ref)

  useLayoutEffect(() => {
    if (size.width !== hSize.width || size.height !== hSize.height) {
      onHeaderResize(hSize)
    }
  }, [hSize])

  return (
    <section ref={ref} className="pinmux-header">
      <li>
        <ul><img height="80" src={MindLogo} alt='mind-logo'/></ul>
        <ul>PinMux{title && ` - ${title}`}</ul>
        {contents.map((x, i) => (
          <ul key={i}>
            {x} 
          </ul>
        ))}
      </li>
      <li className="pinmux-header-brand">
        <ul><a href="https://mind.be/"><FontAwesomeIcon icon="fa-solid fa-globe" /></a></ul>
        <ul><a href="https://www.linkedin.com/company/mind-software-consultancy/"><FontAwesomeIcon icon="fa-brands fa-linkedin" /></a></ul>
      </li>
    </section>
  )
}

export function HeaderContent({ title, children }) {
  const context = useContext(HeaderContext)

  if (context === undefined) {
    throw new Error("HeaderContent must be used within a HeaderProvider")
  }

  useEffect(() => {
    context.set(title, children)
  }, [title, children])
}

export function HeaderProvider({ children }) {
  const [title, setTitle] = useState('')
  const [contents, setContents] = useState([])

  const set = (title, contents) => {
    setTitle(title)
    setContents(contents)
  }

  return (
    <HeaderContext.Provider value={{
      title,
      contents,
      set,
    }}>
      {children}
    </HeaderContext.Provider>
  )
}
