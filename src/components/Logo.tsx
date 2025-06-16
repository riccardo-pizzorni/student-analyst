import React from "react";

export default function Logo() {
  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div className="relative group flex justify-center w-full logo-level-10-supreme">
        <div className="relative logo-container-supreme">
          {/* Logo PNG con effetti supreme - dimensioni ottimali */}
          <img 
            src="/lovable-uploads/9e03ad61-2209-4d9c-8b8c-209a8a875636.png"
            alt="Student Analyst Logo"
            className="w-16 h-16 relative z-10 transition-all duration-700 group-hover:scale-115 object-contain filter brightness-125 contrast-120 group-hover:brightness-140 logo-hat-supreme"
            style={{ 
              imageRendering: 'crisp-edges',
              filter: 'drop-shadow(0 0 20px rgba(0, 191, 255, 0.4)) drop-shadow(0 0 40px rgba(30, 144, 255, 0.3))'
            }}
          />

          {/* Floating Particles System */}
          <div className="absolute inset-0 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-1200">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
            <div className="particle particle-5"></div>
          </div>

          {/* Effetto 3 Pesci Neon che Giocano - Pesce Grande */}
          <div className="absolute -inset-16 z-5 pointer-events-none neon-fish-group">
            <div className="neon-fish-large-body"></div>
            <div className="neon-fish-large-trail"></div>
          </div>

          {/* Pesce Medio */}
          <div className="absolute -inset-16 z-5 pointer-events-none neon-fish-group">
            <div className="neon-fish-medium-body"></div>
            <div className="neon-fish-medium-trail"></div>
          </div>

          {/* Pesce Piccolo */}
          <div className="absolute -inset-16 z-5 pointer-events-none neon-fish-group">
            <div className="neon-fish-small-body"></div>
            <div className="neon-fish-small-trail"></div>
          </div>

          {/* Inner Glow Effect */}
          <div 
            className="absolute inset-0 z-5 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-800"
            style={{
              background: `radial-gradient(
                circle at center,
                rgba(0, 191, 255, 0.25) 0%,
                rgba(30, 144, 255, 0.15) 40%,
                transparent 70%
              )`,
              borderRadius: '50%',
              filter: 'blur(8px)',
            }}
          />
        </div>
      </div>

      {/* Supreme Level Text con tutti gli effetti luminosi */}
      <h1 className="text-xl font-bold tracking-tight mt-1 text-center font-sans logo-text-level-10-supreme"
          style={{ 
            letterSpacing: "-0.02em",
          }}>
        Student Analyst
      </h1>
    </div>
  );
} 