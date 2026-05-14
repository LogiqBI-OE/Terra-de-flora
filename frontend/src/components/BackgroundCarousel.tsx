// Fondo de carrusel: imágenes apiladas, cross-fade.
// Cicla cada `intervalMs`, transición `fadeMs`.
// Preload de todas al montar (evita flash blanco en el primer ciclo).

import { useEffect, useState } from 'react'

interface Props {
  images: string[]
  intervalMs?: number
  fadeMs?: number
  overlay?: string  // opcional: rgba overlay encima para legibilidad
  className?: string
}

export default function BackgroundCarousel({
  images,
  intervalMs = 6000,
  fadeMs = 1500,
  overlay = 'rgba(10, 20, 40, 0.55)',
  className = '',
}: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // Preload
    images.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [images])

  useEffect(() => {
    if (images.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [images.length, intervalMs])

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === index ? 1 : 0,
            transition: `opacity ${fadeMs}ms ease-in-out`,
          }}
        />
      ))}
      {overlay && (
        <div className="absolute inset-0" style={{ background: overlay }} />
      )}
    </div>
  )
}
