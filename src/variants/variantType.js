import { Blinker } from './Blinker.js'
import { Cyclic4 } from './Cyclic4.js'
import { Dihedral4 } from './Dihedral4.js'
import { Diagonal } from './Diagonal.js'
import { Invariant } from './Invariant.js'
import { Klein4 } from './Klein4.js'

export function variantType (symmetry) {
  switch (symmetry) {
    case 'D':
      return Dihedral4
    case 'A':
      return Klein4
    case 'S':
      return Invariant
    case 'H':
      return Cyclic4
    case 'L':
      return Blinker
    case 'G':
      return Diagonal
    default:
      throw new Error(
        'Unknown symmetry type for ' + JSON.stringify(this, null, 2)
      ) // The 'null, 2' adds indentation for readability);
  }
}
