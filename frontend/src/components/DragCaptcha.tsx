"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";

interface DragCaptchaProps {
  onVerify: (verified: boolean) => void;
}

export default function DragCaptcha({ onVerify }: DragCaptchaProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isVerified) return;
    setIsDragging(true);
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || isVerified || !trackRef.current || !thumbRef.current) return;

    let clientX = 0;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as MouseEvent).clientX;
    }

    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = thumbRef.current.offsetWidth;
    const maxPosition = trackRect.width - thumbWidth;

    let newPos = clientX - trackRect.left - thumbWidth / 2;
    newPos = Math.max(0, Math.min(newPos, maxPosition));
    
    setPosition(newPos);

    if (newPos >= maxPosition * 0.95) {
      setIsVerified(true);
      setIsDragging(false);
      setPosition(maxPosition);
      onVerify(true);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (!isVerified) {
      // Snap back to start if not verified
      setPosition(0);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDrag, { passive: false });
      window.addEventListener("touchend", handleDragEnd);
    } else {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDrag);
      window.removeEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDrag);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, isVerified]);

  return (
    <div 
      className="w-full relative h-[48px] rounded-[12px] bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden flex items-center select-none"
      ref={trackRef}
    >
      {/* Background that fills as you drag */}
      <div 
        className={`absolute top-0 left-0 h-full transition-colors duration-300 ${isVerified ? 'bg-[#ECFDF5]' : 'bg-[#F4EEFF]'}`}
        style={{ width: `calc(${position}px + 24px)` }}
      />

      {/* Instruction text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-[13px] font-[600] z-10 transition-colors duration-300 ${isVerified ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>
          {isVerified ? "Verificado!" : "Arraste para verificar"}
        </span>
      </div>

      {/* Draggable thumb */}
      <div 
        ref={thumbRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`absolute top-[4px] left-[4px] w-[40px] h-[40px] bg-white rounded-[8px] shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing z-20 transition-colors duration-300 border ${isVerified ? 'border-[#10B981] text-[#10B981]' : 'border-[#E5E7EB] text-[#6B7280]'}`}
        style={{ 
          transform: `translateX(${position}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {isVerified ? (
          <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
        ) : (
          <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2} />
        )}
      </div>
    </div>
  );
}
