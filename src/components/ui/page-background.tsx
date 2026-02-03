import React from "react";
import Image from "next/image";

export const PageBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Base Dark Overlay (replaces bg-black to ensure image is visible) */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Hero Image with Overlay */}
      <div className="absolute inset-0 opacity-70">
        <Image 
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop"
          alt="Restaurant Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
      
      {/* Gradient Overlay for Readability (Lighter than before) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      
      {/* Optional: Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] pointer-events-none" />
    </div>
  );
};
