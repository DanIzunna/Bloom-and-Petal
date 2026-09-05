"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const fallbackSrc = "/file.svg";

type RemoteImageProps = Omit<ImageProps, "src"> & { src?: string | null };

export default function RemoteImage({ src, alt, ...props }: RemoteImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}
