"use client";

import { useState } from "react";

type RecipeImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
};

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80";

export default function RecipeImage({
  src,
  alt,
  className = "h-full w-full object-cover object-center block",
  priority = false,
}: RecipeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || DEFAULT_FALLBACK_IMAGE);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  const handleError = () => {
    if (!hasFailed) {
      setHasFailed(true);
      setImgSrc(DEFAULT_FALLBACK_IMAGE);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={handleError}
      className={className}
    />
  );
}
