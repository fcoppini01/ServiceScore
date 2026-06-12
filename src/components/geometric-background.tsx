'use client'

import { motion } from 'framer-motion'

// Palette: Lions (blu, oro) + accenti 01 (rosso/cyan/magenta)
const COLORS = {
  blue: '#0055ff',    // Lions
  gold: '#ffe500',    // Lions
  red:  '#ff4444',    // 01 accent
  cyan: '#06b6d4',    // 01 accent
  magenta: '#ec4899', // 01 accent
}

type ShapeType = 'circle' | 'triangle' | 'square' | 'hexagon' | 'diamond' | 'pentagon' | 'ring'

interface Shape {
  type: ShapeType
  color: string
  size: number          // px
  left: string          // %
  top: string           // %
  duration: number      // s — durata del loop
  delay: number         // s
  rotateBy: number      // rotation rate
  driftX: number        // px di deriva orizzontale
  driftY: number        // px di deriva verticale
  opacity: number       // 0..1 base opacity
  blur: number          // px
}

// Configurazione deterministica (no random a render → no hydration mismatch).
// Ridotto da 12 a 7 forme, rimosso blur (filter CSS costoso su GPU integrate).
// Animazione semplificata: solo rotate + scale leggero, no drift X/Y
// → 80% in meno di workload (no layout recalc, solo transform).
const SHAPES: Shape[] = [
  // Hero zone
  { type: 'hexagon',  color: COLORS.blue,    size: 180, left: '8%',  top: '12%', duration: 28, delay: 0,   rotateBy: 60,  driftX: 0, driftY: 0, opacity: 0.10, blur: 0 },
  { type: 'triangle', color: COLORS.gold,    size: 140, left: '85%', top: '15%', duration: 32, delay: 1,   rotateBy: -120, driftX: 0, driftY: 0, opacity: 0.14, blur: 0 },
  { type: 'circle',   color: COLORS.cyan,    size: 90,  left: '15%', top: '70%', duration: 24, delay: 2,   rotateBy: 0,    driftX: 0, driftY: 0, opacity: 0.18, blur: 0 },
  { type: 'diamond',  color: COLORS.magenta, size: 80,  left: '78%', top: '78%', duration: 30, delay: 3,   rotateBy: 90,   driftX: 0, driftY: 0, opacity: 0.12, blur: 0 },
  { type: 'pentagon', color: COLORS.red,     size: 120, left: '45%', top: '88%', duration: 26, delay: 0.5, rotateBy: 180,  driftX: 0, driftY: 0, opacity: 0.11, blur: 0 },
  { type: 'ring',     color: COLORS.blue,    size: 60,  left: '40%', top: '8%',  duration: 22, delay: 1.5, rotateBy: 0,    driftX: 0, driftY: 0, opacity: 0.25, blur: 0 },
  { type: 'ring',     color: COLORS.gold,    size: 100, left: '65%', top: '25%', duration: 34, delay: 1.8, rotateBy: 0,    driftX: 0, driftY: 0, opacity: 0.18, blur: 0 },
]

function ShapeSVG({ shape }: { shape: Shape }) {
  const { type, color, size, opacity } = shape

  const stroke = type === 'ring'
  const fill = stroke ? 'none' : color
  const sw = stroke ? Math.max(3, size / 18) : 0

  const r = size / 2
  const cx = r, cy = r

  const path = (() => {
    switch (type) {
      case 'circle':
        return <circle cx={cx} cy={cy} r={r - sw / 2} fill={fill} stroke={stroke ? color : 'none'} strokeWidth={sw} />
      case 'ring':
        return <circle cx={cx} cy={cy} r={r - sw / 2} fill="none" stroke={color} strokeWidth={sw} />
      case 'square':
        return <rect x={sw / 2} y={sw / 2} width={size - sw} height={size - sw} fill={fill} rx={size * 0.08} />
      case 'triangle':
        return <polygon points={`${cx},${sw / 2} ${size - sw / 2},${size - sw / 2} ${sw / 2},${size - sw / 2}`} fill={fill} />
      case 'diamond':
        return <polygon points={`${cx},${sw / 2} ${size - sw / 2},${cy} ${cx},${size - sw / 2} ${sw / 2},${cy}`} fill={fill} />
      case 'pentagon': {
        const pts = [0, 1, 2, 3, 4].map(i => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
          return `${cx + r * 0.94 * Math.cos(a)},${cy + r * 0.94 * Math.sin(a)}`
        }).join(' ')
        return <polygon points={pts} fill={fill} />
      }
      case 'hexagon': {
        const pts = [0, 1, 2, 3, 4, 5].map(i => {
          const a = (i * Math.PI) / 3
          return `${cx + r * 0.95 * Math.cos(a)},${cy + r * 0.95 * Math.sin(a)}`
        }).join(' ')
        return <polygon points={pts} fill={fill} />
      }
      default:
        return null
    }
  })()

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ opacity, filter: shape.blur > 0 ? `blur(${shape.blur}px)` : undefined }}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}

export function GeometricBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden -z-0 motion-reduce:hidden"
      aria-hidden="true"
    >
      {SHAPES.map((sh, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: sh.left, top: sh.top, willChange: 'transform' }}
          animate={{
            rotate: sh.rotateBy * 2,
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: sh.duration,
            delay: sh.delay,
            repeat: Infinity,
            // 'linear' è molto più economico di 'easeInOut': nessun ricalcolo
            // di curva ad ogni frame, solo interpolazione lineare.
            ease: 'linear',
          }}
        >
          <ShapeSVG shape={sh} />
        </motion.div>
      ))}
    </div>
  )
}
