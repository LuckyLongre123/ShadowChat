'use client';

import Image from 'next/image';
import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
}

export default function Avatar({ name, src, size = 40 }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Helper function to extract initials (e.g., "John Doe" -> "JD", "Lucky" -> "L")
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(/\s+/);
    if (names.length === 0 || !names[0]) return '?';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Generate a consistent pseudo-random background color based on user name
  const getBackgroundColor = (str: string) => {
    const colors = [
      'bg-blue-600 text-white',
      'bg-green-600 text-white',
      'bg-indigo-600 text-white',
      'bg-purple-600 text-white',
      'bg-pink-600 text-white',
      'bg-teal-600 text-white',
      'bg-orange-600 text-white',
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const showFallback = !src || imageError;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.4}px`,
      }}
    >
      {showFallback ? (
        <div
          className={`flex h-full w-full items-center justify-center ${getBackgroundColor(name)}`}
        >
          {getInitials(name)}
        </div>
      ) : (
        <Image
          src={src}
          alt={`${name}'s avatar`}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setImageError(true)}
          priority={false}
        />
      )}
    </div>
  );
}
