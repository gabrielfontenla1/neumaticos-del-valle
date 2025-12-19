'use client'

import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'

// Extended PIXI.Graphics with custom animation properties
interface AnimatedShape extends PIXI.Graphics {
  vx: number
  vy: number
  rotationSpeed: number
  size: number
  mass: number
  initialX: number
  initialY: number
}

// Memoized to prevent re-initialization on parent re-renders
function AnimatedBackground() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    // Prevent multiple initializations
    if (appRef.current !== null) return

    // Create Pixi Application
    const app = new PIXI.Application()

    const initPixi = async () => {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        powerPreference: 'high-performance',
      })

      canvasRef.current?.appendChild(app.canvas as HTMLCanvasElement)

      // Store reference AFTER successful init and canvas append
      appRef.current = app

      // Grid setup - Visible but subtle grid (Rapicompras reference)
      const gridGraphics = new PIXI.Graphics()
      const gridSize = 40 // Smaller grid size for more squares
      const gridColor = 0xD97757 // Orange/Terracotta color - Primary color from rapicompras

      // Draw grid - more visible
      for (let x = 0; x < app.screen.width; x += gridSize) {
        gridGraphics.moveTo(x, 0)
        gridGraphics.lineTo(x, app.screen.height)
        gridGraphics.stroke({ width: 1, color: gridColor, alpha: 0.06 }) // More subtle
      }

      for (let y = 0; y < app.screen.height; y += gridSize) {
        gridGraphics.moveTo(0, y)
        gridGraphics.lineTo(app.screen.width, y)
        gridGraphics.stroke({ width: 1, color: gridColor, alpha: 0.06 })
      }

      app.stage.addChild(gridGraphics)

      // Create geometric shapes - Only outlines, no fill
      // FIXED SEED for consistent positions across navigation
      const shapes: AnimatedShape[] = []
      const numShapes = 15

      // Fixed shape configurations (seed-based) - More shapes with varied types
      const shapeConfigs = [
        { type: 0, size: 80, color: 0xD97757, x: 0.15, y: 0.25, rotation: 0.5, vx: 0.2, vy: 0.15, rotSpeed: 0.008 },
        { type: 1, size: 100, color: 0xE58A6B, x: 0.75, y: 0.35, rotation: 1.2, vx: -0.25, vy: 0.18, rotSpeed: -0.01 },
        { type: 0, size: 60, color: 0xC66645, x: 0.45, y: 0.15, rotation: 2.1, vx: 0.15, vy: -0.2, rotSpeed: 0.009 },
        { type: 1, size: 90, color: 0xD97757, x: 0.85, y: 0.75, rotation: 0.8, vx: -0.3, vy: -0.22, rotSpeed: -0.012 },
        { type: 0, size: 70, color: 0xE58A6B, x: 0.25, y: 0.65, rotation: 1.5, vx: 0.28, vy: 0.25, rotSpeed: 0.011 },
        { type: 1, size: 85, color: 0xC66645, x: 0.55, y: 0.45, rotation: 0.3, vx: -0.18, vy: 0.28, rotSpeed: -0.009 },
        { type: 0, size: 95, color: 0xD97757, x: 0.12, y: 0.85, rotation: 2.8, vx: 0.32, vy: -0.25, rotSpeed: 0.01 },
        { type: 1, size: 75, color: 0xE58A6B, x: 0.68, y: 0.12, rotation: 1.9, vx: -0.2, vy: 0.3, rotSpeed: -0.008 },
        { type: 2, size: 65, color: 0xD97757, x: 0.92, y: 0.48, rotation: 0.7, vx: -0.15, vy: 0.12, rotSpeed: 0.007 }, // Triangle
        { type: 0, size: 55, color: 0xC66645, x: 0.08, y: 0.55, rotation: 1.8, vx: 0.22, vy: -0.18, rotSpeed: -0.006 },
        { type: 1, size: 110, color: 0xE58A6B, x: 0.32, y: 0.92, rotation: 2.3, vx: 0.18, vy: -0.28, rotSpeed: 0.013 },
        { type: 2, size: 72, color: 0xD97757, x: 0.62, y: 0.28, rotation: 0.4, vx: -0.24, vy: 0.16, rotSpeed: -0.008 }, // Triangle
        { type: 0, size: 88, color: 0xC66645, x: 0.38, y: 0.72, rotation: 1.6, vx: 0.26, vy: 0.14, rotSpeed: 0.009 },
        { type: 1, size: 68, color: 0xE58A6B, x: 0.78, y: 0.58, rotation: 2.9, vx: -0.19, vy: -0.24, rotSpeed: -0.011 },
        { type: 2, size: 78, color: 0xD97757, x: 0.18, y: 0.38, rotation: 1.1, vx: 0.21, vy: 0.19, rotSpeed: 0.006 } // Triangle
      ]

      for (let i = 0; i < numShapes; i++) {
        const config = shapeConfigs[i]
        const shape = new PIXI.Graphics()

        if (config.type === 0) {
          // Circle - no fill, only stroke
          shape.circle(0, 0, config.size)
          shape.stroke({ width: 2, color: config.color, alpha: 0.15 })
        } else if (config.type === 1) {
          // Square - no fill, only stroke
          shape.rect(-config.size / 2, -config.size / 2, config.size, config.size)
          shape.stroke({ width: 2, color: config.color, alpha: 0.15 })
        } else if (config.type === 2) {
          // Triangle - no fill, only stroke
          const height = config.size * Math.sqrt(3) / 2
          shape.moveTo(0, -height / 2)
          shape.lineTo(-config.size / 2, height / 2)
          shape.lineTo(config.size / 2, height / 2)
          shape.closePath()
          shape.stroke({ width: 2, color: config.color, alpha: 0.15 })
        }

        // Fixed positions based on viewport percentage
        shape.x = config.x * app.screen.width
        shape.y = config.y * app.screen.height
        shape.rotation = config.rotation

        // Cast to AnimatedShape and assign custom properties
        const animatedShape = shape as unknown as AnimatedShape
        animatedShape.vx = config.vx
        animatedShape.vy = config.vy
        animatedShape.rotationSpeed = config.rotSpeed
        animatedShape.size = config.size
        animatedShape.mass = config.size
        animatedShape.initialX = config.x // Store for resize
        animatedShape.initialY = config.y // Store for resize

        app.stage.addChild(shape)
        shapes.push(animatedShape)
      }

      // Animation loop with lunar gravity and collision detection
      app.ticker.add(() => {
        shapes.forEach((shape, index) => {
          // Move shape
          shape.x += shape.vx
          shape.y += shape.vy
          shape.rotation += shape.rotationSpeed

          const shapeSize = shape.size

          // Collision detection with screen boundaries
          // Left boundary
          if (shape.x - shapeSize < 0) {
            shape.x = shapeSize
            shape.vx *= -0.9 // Bounce with energy loss
          }
          // Right boundary
          if (shape.x + shapeSize > app.screen.width) {
            shape.x = app.screen.width - shapeSize
            shape.vx *= -0.9
          }
          // Top boundary
          if (shape.y - shapeSize < 0) {
            shape.y = shapeSize
            shape.vy *= -0.9
          }
          // Bottom boundary
          if (shape.y + shapeSize > app.screen.height) {
            shape.y = app.screen.height - shapeSize
            shape.vy *= -0.9
          }

          // Collision detection between shapes
          for (let i = index + 1; i < shapes.length; i++) {
            const otherShape = shapes[i]
            const otherSize = otherShape.size

            // Calculate distance between centers
            const dx = otherShape.x - shape.x
            const dy = otherShape.y - shape.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const minDistance = shapeSize + otherSize

            // Check if shapes are colliding
            if (distance < minDistance) {
              // Calculate collision angle
              const angle = Math.atan2(dy, dx)

              // Separate shapes
              const overlap = minDistance - distance
              const separationX = (overlap / 2) * Math.cos(angle)
              const separationY = (overlap / 2) * Math.sin(angle)

              shape.x -= separationX
              shape.y -= separationY
              otherShape.x += separationX
              otherShape.y += separationY

              // Calculate velocities along collision axis
              const vx1 = shape.vx
              const vy1 = shape.vy
              const vx2 = otherShape.vx
              const vy2 = otherShape.vy

              const m1 = shape.mass
              const m2 = otherShape.mass

              // Simple elastic collision with energy loss
              const newVx1 = ((m1 - m2) * vx1 + 2 * m2 * vx2) / (m1 + m2) * 0.85
              const newVy1 = ((m1 - m2) * vy1 + 2 * m2 * vy2) / (m1 + m2) * 0.85
              const newVx2 = ((m2 - m1) * vx2 + 2 * m1 * vx1) / (m1 + m2) * 0.85
              const newVy2 = ((m2 - m1) * vy2 + 2 * m1 * vy1) / (m1 + m2) * 0.85

              shape.vx = newVx1
              shape.vy = newVy1
              otherShape.vx = newVx2
              otherShape.vy = newVy2
            }
          }
        })
      })

      // Handle resize with debounce
      let resizeTimeout: NodeJS.Timeout
      const handleResize = () => {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          app.renderer.resize(window.innerWidth, window.innerHeight)

          // Redraw grid
          gridGraphics.clear()
          for (let x = 0; x < app.screen.width; x += gridSize) {
            gridGraphics.moveTo(x, 0)
            gridGraphics.lineTo(x, app.screen.height)
            gridGraphics.stroke({ width: 1, color: gridColor, alpha: 0.06 })
          }
          for (let y = 0; y < app.screen.height; y += gridSize) {
            gridGraphics.moveTo(0, y)
            gridGraphics.lineTo(app.screen.width, y)
            gridGraphics.stroke({ width: 1, color: gridColor, alpha: 0.06 })
          }

          // Reposition shapes based on initial percentage positions
          shapes.forEach((shape) => {
            shape.x = shape.initialX * app.screen.width
            shape.y = shape.initialY * app.screen.height
          })
        }, 300) // Debounce 300ms
      }

      window.addEventListener('resize', handleResize)

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        app.destroy(true, { children: true, texture: true })
        appRef.current = null
      }
    }

    const cleanup = initPixi()

    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.())
    }
  }, [])

  return (
    <div
      ref={canvasRef}
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}
    />
  )
}

// Export without memo for now to diagnose issue
export default AnimatedBackground
