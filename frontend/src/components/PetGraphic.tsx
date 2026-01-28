import React from 'react';

type Mood = 'calm' | 'focused' | 'stressed';

const PetGraphic: React.FC<{ animal?: string; mood?: Mood; size?: number }> = ({ mood = 'calm', size = 160 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const dpr = typeof window !== 'undefined' ? Math.max(1, Math.min(2, window.devicePixelRatio || 1)) : 1;
  const accent = mood === 'stressed' ? '#E74C3C' : mood === 'focused' ? '#F39C12' : '#7C3AED';

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    let frame = 0;
    let raf = 0;
    const draw = () => {
      frame += 1;
      const scale = 1 + 0.04 * Math.sin(frame * 0.1);
      const jitterX = mood === 'stressed' ? Math.sin(frame * 0.33) * 2 : 0;
      const jitterY = mood === 'stressed' ? Math.cos(frame * 0.25) * 2 : 0;
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2 + jitterX;
      const cy = size / 2 + jitterY;
      const r = (size * 0.4) * scale;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#B0BEC5';
      ctx.fill();
      ctx.restore();
      const earR = r * 0.35;
      const earY = cy - r * 0.7;
      ctx.beginPath();
      ctx.moveTo(cx - earR, earY);
      ctx.lineTo(cx - earR * 0.4, earY - earR * 1.2);
      ctx.lineTo(cx - earR * 0.05, earY);
      ctx.closePath();
      ctx.fillStyle = '#9CA3AF';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + earR, earY);
      ctx.lineTo(cx + earR * 0.4, earY - earR * 1.2);
      ctx.lineTo(cx + earR * 0.05, earY);
      ctx.closePath();
      ctx.fillStyle = '#9CA3AF';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.4, r * 0.9, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#F3F4F6';
      ctx.fill();
      const maskW = r * 0.95;
      const maskH = r * 0.45;
      ctx.beginPath();
      ctx.ellipse(cx - maskW * 0.28, cy + r * 0.05, maskW * 0.35, maskH * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2F3B4A';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + maskW * 0.28, cy + r * 0.05, maskW * 0.35, maskH * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2F3B4A';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - maskW * 0.28, cy + r * 0.05, r * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - maskW * 0.28, cy + r * 0.05, r * 0.045, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + maskW * 0.28, cy + r * 0.05, r * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + maskW * 0.28, cy + r * 0.05, r * 0.045, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.3, r * 0.11, r * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1F2937';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.18, cy + r * 0.42);
      ctx.quadraticCurveTo(cx, cy + r * 0.48, cx + r * 0.18, cy + r * 0.42);
      ctx.strokeStyle = '#2F3B4A';
      ctx.lineWidth = Math.max(2, r * 0.03);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 1.05, r * 0.55, r * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fill();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [size, mood, dpr, accent]);

  return (
    <div aria-label={`raccoon-${mood}`} style={{ width: size, height: size, borderRadius: '50%', background: '#fff', border: `2px solid ${accent}`, boxShadow: `0 0 ${Math.floor(size * 0.25)}px ${accent}22 inset`, display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
};

export default PetGraphic;
