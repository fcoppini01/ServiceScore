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

// Configurazione deterministica (no random a render → no hydration mismatch)
const SHAPES: Shape[] = [
  // Hero zone
  { type: 'hexagon',  color: COLORS.blue,    size: 180, left: '8%',  top: '12%', duration: 22, delay: 0,   rotateBy: 60,  driftX: 40,  driftY: 30,  opacity: 0.10, blur: 0 },
  { type: 'triangle', color: COLORS.gold,    size: 140, left: '85%', top: '15%', duration: 26, delay: 1,   rotateBy: -120, driftX: -35, driftY: 25,  opacity: 0.14, blur: 2 },
  { type: 'circle',   color: COLORS.cyan,    size: 90,  left: '15%', top: '70%', duration: 18, delay: 2,   rotateBy: 0,    driftX: 50,  driftY: -40, opacity: 0.18, blur: 0 },
  { type: 'diamond',  color: COLORS.magenta, size: 80,  left: '78%', top: '78%', duration: 24, delay: 3,   rotateBy: 90,   driftX: -45, driftY: -30, opacity: 0.12, blur: 1 },
  { type: 'pentagon', color: COLORS.red,     size: 120, left: '45%', top: '88%', duration: 20, delay: 0.5, rotateBy: 180,  driftX: 30,  driftY: -50, opacity: 0.11, blur: 0 },

  // Smaller — distribuite a riempire
  { type: 'ring',     color: COLORS.blue,    size: 60,  left: '40%', top: '8%',  duration: 16, delay: 1.5, rotateBy: 0,    driftX: -20, driftY: 30,  opacity: 0.25, blur: 0 },
  { type: 'square',   color: COLORS.gold,    size: 50,  left: '55%', top: '45%', duration: 14, delay: 2.5, rotateBy: 45,   driftX: 25,  driftY: 20,  opacity: 0.10, blur: 1 },
  { type: 'circle',   color: COLORS.red,     size: 40,  left: '92%', top: '50%', duration: 19, delay: 0.8, rotateBy: 0,    driftX: -20, driftY: -25, opacity: 0.15, blur: 0 },
  { type: 'triangle', color: COLORS.cyan,    size: 60,  left: '4%',  top: '40%', duration: 21, delay: 1.2, rotateBy: 180,  driftX: 20,  driftY: -15, opacity: 0.13, blur: 0 },
  { type: 'hexagon',  color: COLORS.magenta, size: 70,  left: '30%', top: '50%', duration: 23, delay: 0.3, rotateBy: -60,  driftX: -30, driftY: 35,  opacity: 0.10, blur: 2 },

  // Accents far away
  { type: 'ring',     color: COLORS.gold,    size: 100, left: '65%', top: '25%', duration: 28, delay: 1.8, rotateBy: 0,    driftX: 25,  driftY: -20, opacity: 0.18, blur: 0 },
  { type: 'diamond',  color: COLORS.blue,    size: 55,  left: '20%', top: '92%', duration: 17, delay: 2.8, rotateBy: 90,   driftX: -15, driftY: -30, opacity: 0.16, blur: 0 },
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0" aria-hidden="true">
      {SHAPES.map((sh, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: sh.left, top: sh.top, transform: 'translate(-50%, -50%)' }}
          animate={{
            x: [0, sh.driftX, -sh.driftX * 0.5, sh.driftX * 0.3, 0],
            y: [0, sh.driftY, sh.driftY * 0.5, -sh.driftY * 0.4, 0],
            rotate: [0, sh.rotateBy, sh.rotateBy * 1.5, sh.rotateBy * 2],
            scale: [1, 1.08, 0.95, 1.04, 1],
          }}
          transition={{
            duration: sh.duration,
            delay: sh.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ShapeSVG shape={sh} />
        </motion.div>
      ))}
    </div>
  )
}
