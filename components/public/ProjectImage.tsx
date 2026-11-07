import Image from 'next/image'
import type { ProjectImage as ProjectImageModel } from '@prisma/client'

type Props = {
  image: ProjectImageModel | null
  alt?: string
  sizes?: string
  priority?: boolean
  className?: string
  ratio?: string
}

/**
 * Renders a project image through the variant pipeline, or a neutral placeholder
 * when the project has no artwork yet.
 */
export default function ProjectImage({
  image,
  alt,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  className = '',
  ratio = '4 / 5',
}: Props) {
  if (!image) {
    return (
      <div
        className={`flex items-center justify-center bg-surface ${className}`}
        style={{ aspectRatio: ratio }}
        aria-hidden="true"
      >
        <span className="font-heading text-2xl tracking-[0.4em] text-muted/50">QUIN</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-surface ${className}`} style={{ aspectRatio: ratio }}>
      <Image
        src={image.fileKey}
        alt={alt ?? image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  )
}