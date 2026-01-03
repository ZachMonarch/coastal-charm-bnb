import { ReactNode } from "react";

interface PageHeroWithImageProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
  children?: ReactNode;
  height?: "short" | "medium" | "tall";
}

export function PageHeroWithImage({ 
  title, 
  subtitle, 
  imageUrl, 
  children,
  height = "medium" 
}: PageHeroWithImageProps) {
  const heightClasses = {
    short: "h-[30vh] min-h-[200px]",
    medium: "h-[40vh] min-h-[280px]",
    tall: "h-[50vh] min-h-[360px]",
  };

  return (
    <div className={`relative ${heightClasses[height]} overflow-hidden w-full breakout-full-width`}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />
      
      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/85" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center max-w-4xl px-6">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] [text-shadow:_0_4px_16px_rgb(0_0_0_/_90%)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-white max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default PageHeroWithImage;
