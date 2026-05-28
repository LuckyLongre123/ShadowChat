'use client';

import Image from 'next/image';

interface AvatarProps {
  name: string;
  src?: string;
  size?: number; // px, used for sizes hint
  className?: string;
}

/**
 * Renders a next/image avatar when a URL is provided, or a coloured
 * initials fallback when it isn't. Deterministically picks a background
 * colour from the user's name so it's consistent across renders.
 */
export default function Avatar({ name, src, size = 40, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Deterministic hue derived from name char codes
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  const bg = `hsl(${hue}, 55%, 55%)`;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, background: !src ? bg : undefined }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center font-semibold text-white"
          style={{ fontSize: size * 0.35 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
