'use client';

interface ChristmasBorderProps {
  intensity?: 'subtle' | 'medium' | 'strong';
}

export default function ChristmasBorder({ intensity = 'medium' }: ChristmasBorderProps) {
  const getBlurSize = () => {
    switch (intensity) {
      case 'subtle':
        return '40px';
      case 'medium':
        return '60px';
      case 'strong':
        return '80px';
    }
  };

  const getOpacity = () => {
    switch (intensity) {
      case 'subtle':
        return 0.3;
      case 'medium':
        return 0.5;
      case 'strong':
        return 0.7;
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes glow-rotate {
          0%, 100% {
            box-shadow:
              0 0 ${getBlurSize()} rgba(27, 94, 32, ${getOpacity()}),
              0 0 calc(${getBlurSize()} * 1.5) rgba(184, 134, 11, ${getOpacity() * 0.8}),
              0 0 calc(${getBlurSize()} * 2) rgba(139, 0, 0, ${getOpacity() * 0.6});
          }
          33% {
            box-shadow:
              0 0 ${getBlurSize()} rgba(184, 134, 11, ${getOpacity()}),
              0 0 calc(${getBlurSize()} * 1.5) rgba(139, 0, 0, ${getOpacity() * 0.8}),
              0 0 calc(${getBlurSize()} * 2) rgba(27, 94, 32, ${getOpacity() * 0.6});
          }
          66% {
            box-shadow:
              0 0 ${getBlurSize()} rgba(139, 0, 0, ${getOpacity()}),
              0 0 calc(${getBlurSize()} * 1.5) rgba(27, 94, 32, ${getOpacity() * 0.8}),
              0 0 calc(${getBlurSize()} * 2) rgba(184, 134, 11, ${getOpacity() * 0.6});
          }
        }

        .christmas-border-glow {
          animation: glow-rotate 6s ease-in-out infinite;
        }
      `}</style>

      {/* Corner Accents */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {/* Top Left */}
        <div
          className="absolute top-0 left-0 w-24 h-24 rounded-br-full christmas-border-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(27, 94, 32, 0.2) 0%, transparent 100%)',
          }}
        />

        {/* Top Right */}
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-bl-full christmas-border-glow"
          style={{
            background: 'linear-gradient(225deg, rgba(184, 134, 11, 0.2) 0%, transparent 100%)',
            animationDelay: '2s',
          }}
        />

        {/* Bottom Left */}
        <div
          className="absolute bottom-0 left-0 w-24 h-24 rounded-tr-full christmas-border-glow"
          style={{
            background: 'linear-gradient(45deg, rgba(139, 0, 0, 0.2) 0%, transparent 100%)',
            animationDelay: '4s',
          }}
        />

        {/* Bottom Right */}
        <div
          className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full christmas-border-glow"
          style={{
            background: 'linear-gradient(315deg, rgba(27, 94, 32, 0.2) 0%, transparent 100%)',
            animationDelay: '1s',
          }}
        />

        {/* Center Glow Points */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-christmas-dark-gold rounded-full christmas-border-glow" />
        <div className="absolute top-3/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-christmas-forest rounded-full christmas-border-glow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-christmas-deep-red rounded-full christmas-border-glow" style={{ animationDelay: '5s' }} />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-christmas-dark-gold rounded-full christmas-border-glow" style={{ animationDelay: '2s' }} />
      </div>
    </>
  );
}
