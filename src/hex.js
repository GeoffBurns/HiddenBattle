import { MaskHex } from './grid/maskHex'
import {
  drawHexGrid,
  drawHex,
  hexToPixel,
  drawPolyhex,
  hitTestPolyhex
} from './grid/hexdraw.js'

const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')

const S = 25
const offsetX = 300
const offsetY = 300

const mask = new MaskHex(3)
const hex = mask.indexer
//const transforms = mask.indexer.transformsMap

// example shape
let shapeMask = MaskHex.fromCoords(3, [
  [0, 0, 0],
  [1, -1, 0],
  [0, 1, -1]
]).bits

let shape = shapeMask.bits

function redraw (hover = null) {
  ctx.clearRect(0, 0, 600, 600)
  drawHexGrid(ctx, hex, S, offsetX, offsetY)
  drawPolyhex(ctx, shape, hex, S, offsetX, offsetY)
  if (hover !== null) {
    const [q, r] = hex.coords[hover]
    const { x, y } = hexToPixel(q, r, S)
    drawHex(ctx, x + offsetX, y + offsetY, S, 'rgba(255,0,0,0.4)')
  }
}

redraw()

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect()
  const hit = hitTestPolyhex(
    e.clientX - rect.left,
    e.clientY - rect.top,
    S,
    offsetX,
    offsetY,
    hex,
    shape
  )
  redraw(hit)
})
