"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

interface Card3DWrapperProps {
  children: React.ReactNode
  className?: string
}

export const Card3DWrapper: React.FC<Card3DWrapperProps> = ({ children, className = "" }) => {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const isTouchDevice = useRef(false)

  // Check if it's a touch device
  useEffect(() => {
    isTouchDevice.current = "ontouchstart" in window || navigator.maxTouchPoints > 0
  }, [])

  // Handle mouse movement over the card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isTouchDevice.current) return

    // Get card dimensions and position
    const rect = cardRef.current.getBoundingClientRect()

    // Calculate mouse position relative to card center (in percentage, -50 to 50)
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseXRelative = ((e.clientX - centerX) / (rect.width / 2)) * 100
    const mouseYRelative = ((e.clientY - centerY) / (rect.height / 2)) * 100

    // Update mouse position for shine effect
    setMouseX(e.clientX - rect.left)
    setMouseY(e.clientY - rect.top)

    // Set rotation values (limited to -7 to 7 degrees for more subtle effect)
    setRotateY(mouseXRelative * 0.07)
    setRotateX(-mouseYRelative * 0.07)
  }

  // Handle mouse enter/leave
  const handleMouseEnter = () => {
    if (!isTouchDevice.current) {
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    // Reset rotation when mouse leaves
    setRotateX(0)
    setRotateY(0)
  }

  // Subtle floating animation when not hovering
  useEffect(() => {
    if (!isHovering && !isTouchDevice.current) {
      const interval = setInterval(() => {
        setRotateX((prev) => prev + Math.sin(Date.now() / 1000) * 0.03)
        setRotateY((prev) => prev + Math.cos(Date.now() / 1000) * 0.03)
      }, 50)

      return () => clearInterval(interval)
    }
  }, [isHovering])

  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: "1000px" }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateX: rotateX,
          rotateY: rotateY,
          boxShadow: isHovering
            ? `0 20px 40px rgba(0,0,0,0.2), 
               ${-rotateY / 5}px ${-rotateX / 5}px 10px rgba(0,0,0,0.1)`
            : "0 10px 30px rgba(0,0,0,0.15)",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.5,
        }}
      >
        {children}

        {/* Shine effect */}
        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
            style={{
              background: `radial-gradient(
                circle at ${mouseX}px ${mouseY}px,
                rgba(255, 255, 255, 0.15) 0%,
                rgba(255, 255, 255, 0) 50%
              )`,
              zIndex: 10,
            }}
          />
        )}

        {/* Edge highlight based on tilt */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: `linear-gradient(
              ${135 + rotateY}deg,
              rgba(255, 255, 255, ${0.1 + Math.abs(rotateY) / 100}) 0%,
              rgba(255, 255, 255, 0) 60%
            )`,
            zIndex: 9,
          }}
        />
      </motion.div>
    </div>
  )
}
