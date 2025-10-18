'use client'

import { useEffect, useRef, memo } from 'react'
import * as PIXI from 'pixi.js'

// Memoized to prevent re-initialization on parent re-renders
function AnimatedBackground() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    if (!canvasRef.current) {
      console.log('🔴 AnimatedBackground: canvasRef not available')
      return
    }
    // Prevent multiple initializations - check if already initialized
    if (appRef.current !== null) {
      console.log('✅ AnimatedBackground: Already initialized, skipping')
      return
    }

    console.log('🎨 AnimatedBackground: Starting initialization...')

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
      })

      canvasRef.current?.appendChild(app.canvas as HTMLCanvasElement)

      // Store reference AFTER successful init and canvas append
      appRef.current = app
      console.log('🚀 AnimatedBackground: PIXI.js initialized successfully')

      // Grid setup - Visible but subtle grid (Rapicompras reference)
      const gridGraphics = new PIXI.Graphics()
      const gridSize = 40 // Smaller grid size for more squares
      const gridColor = 0xD97757 // Orange/Terracotta color - Primary color from rapicompras

      // Draw grid - more visible
      for (let x = 0; x < app.screen.width; x += gridSize) {
        gridGraphics.moveTo(x, 0)
        gridGraphics.lineTo(x, app.screen.height)
        gridGraphics.stroke({ width: 1, color: gridColor, alpha: 0.08 }) // More visible
      }

      for (let y = 0; y < app.screen.height; y += gridSize) {
        gridGraphics.moveTo(0, y)
        gridGraphics.lineTo(app.screen.width, y)
        gridGraphics.stroke({ width: 1, color: gridColor, alpha: 0.08 })
      }

      app.stage.addChild(gridGraphics)

      // Create geometric shapes - Only outlines, no fill
      // FIXED SEED for consistent positions across navigation
      const shapes: PIXI.Graphics[] = []
      const numShapes = 8

      // Fixed shape configurations (seed-based)
      const shapeConfigs = [
        { type: 0, size: 80, color: 0xD97757, x: 0.15, y: 0.25, rotation: 0.5, vx: 0.2, vy: 0.15, rotSpeed: 0.008 },
        { type: 1, size: 100, color: 0xE58A6B, x: 0.75, y: 0.35, rotation: 1.2, vx: -0.25, vy: 0.18, rotSpeed: -0.01 },
        { type: 0, size: 60, color: 0xC66645, x: 0.45, y: 0.15, rotation: 2.1, vx: 0.15, vy: -0.2, rotSpeed: 0.009 },
        { type: 1, size: 90, color: 0xD97757, x: 0.85, y: 0.75, rotation: 0.8, vx: -0.3, vy: -0.22, rotSpeed: -0.012 },
        { type: 0, size: 70, color: 0xE58A6B, x: 0.25, y: 0.65, rotation: 1.5, vx: 0.28, vy: 0.25, rotSpeed: 0.011 },
        { type: 1, size: 85, color: 0xC66645, x: 0.55, y: 0.45, rotation: 0.3, vx: -0.18, vy: 0.28, rotSpeed: -0.009 },
        { type: 0, size: 95, color: 0xD97757, x: 0.12, y: 0.85, rotation: 2.8, vx: 0.32, vy: -0.25, rotSpeed: 0.01 },
        { type: 1, size: 75, color: 0xE58A6B, x: 0.68, y: 0.12, rotation: 1.9, vx: -0.2, vy: 0.3, rotSpeed: -0.008 }
      ]

      for (let i = 0; i < numShapes; i++) {
        const config = shapeConfigs[i]
        const shape = new PIXI.Graphics()

        if (config.type === 0) {
          // Circle - no fill, only stroke
          shape.circle(0, 0, config.size)
          shape.stroke({ width: 2, color: config.color, alpha: 0.15 })
        } else {
          // Square - no fill, only stroke
          shape.rect(-config.size / 2, -config.size / 2, config.size, config.size)
          shape.stroke({ width: 2, color: config.color, alpha: 0.15 })
        }

        // Fixed positions based on viewport percentage
        shape.x = config.x * app.screen.width
        shape.y = config.y * app.screen.height
        shape.rotation = config.rotation

        // Fixed velocity values
        ;(shape as any).vx = config.vx
        ;(shape as any).vy = config.vy
        ;(shape as any).rotationSpeed = config.rotSpeed
        ;(shape as any).size = config.size
        ;(shape as any).mass = config.size
        ;(shape as any).initialX = config.x // Store for resize
        ;(shape as any).initialY = config.y // Store for resize

        app.stage.addChild(shape)
        shapes.push(shape)
      }

      // Animation loop with lunar gravity and collision detection
      app.ticker.add(() => {
        shapes.forEach((shape, index) => {
          // Move shape
          shape.x += (shape as any).vx
          shape.y += (shape as any).vy
          shape.rotation += (shape as any).rotationSpeed

          const shapeSize = (shape as any).size

          // Collision detection with screen boundaries
          // Left boundary
          if (shape.x - shapeSize < 0) {
            shape.x = shapeSize
            ;(shape as any).vx *= -0.9 // Bounce with energy loss
          }
          // Right boundary
          if (shape.x + shapeSize > app.screen.width) {
            shape.x = app.screen.width - shapeSize
            ;(shape as any).vx *= -0.9
          }
          // Top boundary
          if (shape.y - shapeSize < 0) {
            shape.y = shapeSize
            ;(shape as any).vy *= -0.9
          }
          // Bottom boundary
          if (shape.y + shapeSize > app.screen.height) {
            shape.y = app.screen.height - shapeSize
            ;(shape as any).vy *= -0.9
          }

          // Collision detection between shapes
          for (let i = index + 1; i < shapes.length; i++) {
            const otherShape = shapes[i]
            const otherSize = (otherShape as any).size

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
              const vx1 = (shape as any).vx
              const vy1 = (shape as any).vy
              const vx2 = (otherShape as any).vx
              const vy2 = (otherShape as any).vy

              const m1 = (shape as any).mass
              const m2 = (otherShape as any).mass

              // Simple elastic collision with energy loss
              const newVx1 = ((m1 - m2) * vx1 + 2 * m2 * vx2) / (m1 + m2) * 0.85
              const newVy1 = ((m1 - m2) * vy1 + 2 * m2 * vy2) / (m1 + m2) * 0.85
              const newVx2 = ((m2 - m1) * vx2 + 2 * m1 * vx1) / (m1 + m2) * 0.85
              const newVy2 = ((m2 - m1) * vy2 + 2 * m1 * vy1) / (m1 + m2) * 0.85

              ;(shape as any).vx = newVx1
              ;(shape as any).vy = newVy1
              ;(otherShape as any).vx = newVx2
              ;(otherShape as any).vy = newVy2
            }
          }
        })
      })

      // Handle resize
      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight)

        // Redraw grid
        gridGraphics.clear()
        for (let x = 0; x < app.screen.width; x += gridSize) {
          gridGraphics.moveTo(x, 0)
          gridGraphics.lineTo(x, app.screen.height)
          gridGraphics.stroke({ width: 1, color: gridColor, alpha: 0.08 })
        }
        for (let y = 0; y < app.screen.height; y += gridSize) {
          gridGraphics.moveTo(0, y)
          gridGraphics.lineTo(app.screen.width, y)
          gridGraphics.stroke({ width: 1, color: gridColor, alpha: 0.08 })
        }

        // Reposition shapes based on initial percentage positions
        shapes.forEach((shape) => {
          const initialX = (shape as any).initialX
          const initialY = (shape as any).initialY
          if (initialX !== undefined && initialY !== undefined) {
            shape.x = initialX * app.screen.width
            shape.y = initialY * app.screen.height
          }
        })
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
