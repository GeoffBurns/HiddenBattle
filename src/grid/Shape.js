import { CubeIndex } from './CubeIndex'
import { RectIndex } from './RectIndex'
import { TriIndex } from './TriIndex'

export const Shape = {
  triangle: side => ({
    type: 'triangle',
    side,
    get indexer () {
      return new TriIndex(this.side)
    }
  }),
  rectangle: (width, height) => ({
    type: 'rectangle',
    width,
    height,
    get indexer () {
      return new RectIndex(this.width, this.height)
    }
  }),
  hexagon: radius => ({
    type: 'hexagon',
    radius,
    get indexer () {
      return CubeIndex.getInstance(this.radius)
    }
  })
}
