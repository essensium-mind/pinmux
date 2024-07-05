import FemalePin from '../../assets/pins/female.svg'
import MalePin from '../../assets/pins/male.svg'

export function HeaderPin ({ type, ...props }) {
  switch (type) {
    case 'male':
      return <img {...props} src={MalePin} />
    case 'female':
    default:
      return <img {...props} src={FemalePin} />
  }
}
