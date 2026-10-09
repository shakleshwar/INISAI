import { useState, useRef, useEffect, useCallback } from 'react';
import { ArtImage } from './ArtImage';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselItem {
  id: string;
  title: string;
  artist: string;
  coverArtUrl?: string;
}

interface Carousel3DProps {
  items: CarouselItem[];
  onPlay: (item: CarouselItem) => void;
  onClick: (item: CarouselItem) => void;
}

export function Carousel3D({ items, onPlay, onClick }: Carousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(() => Math.floor((items?.length || 0) / 2));
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Gesture tracking refs
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const currentDeltaX = useRef<number>(0);
  const isGestureDetermined = useRef<boolean>(false);
  const isHorizontalSwipe = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragDistanceRef = useRef<number>(0);
  const lastSwipeTime = useRef<number>(0);

  // Responsive resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When items list changes (e.g. region switched), center the new items
  const prevItemsId = useRef<string>('');
  useEffect(() => {
    const currentFirstId = items?.[0]?.id || '';
    if (items && items.length > 0 && currentFirstId !== prevItemsId.current) {
      prevItemsId.current = currentFirstId;
      setActiveIndex(Math.floor(items.length / 2));
    }
  }, [items]);

  const n = items?.length || 0;
  const normalizedActive = n > 0 ? ((activeIndex % n) + n) % n : 0;

  const handlePrev = useCallback(() => {
    if (n === 0) return;
    lastSwipeTime.current = Date.now();
    setActiveIndex(prev => (prev - 1 + n) % n);
  }, [n]);

  const handleNext = useCallback(() => {
    if (n === 0) return;
    lastSwipeTime.current = Date.now();
    setActiveIndex(prev => (prev + 1) % n);
  }, [n]);

  if (!items || items.length === 0) return null;

  // Responsive layout parameters
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const spacingX = isMobile ? 100 : isTablet ? 140 : 185;
  const rotateAngle = isMobile ? 22 : isTablet ? 28 : 34;
  const maxVisibleOffset = isMobile ? 2 : 3;

  // Touch Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    currentDeltaX.current = 0;
    isGestureDetermined.current = false;
    isHorizontalSwipe.current = false;
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    if (!isGestureDetermined.current) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > 6 || absY > 6) {
        isGestureDetermined.current = true;
        if (absY > absX * 1.25) {
          // Primarily vertical scroll: abort carousel drag, preserve native page scroll
          isHorizontalSwipe.current = false;
          isDraggingRef.current = false;
          setIsDragging(false);
          setDragOffset(0);
          return;
        } else {
          // Confirmed horizontal swipe on carousel
          isHorizontalSwipe.current = true;
          setIsDragging(true);
        }
      }
    }

    if (!isHorizontalSwipe.current) return;

    currentDeltaX.current = deltaX;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(deltaX));

    // Live tactile drag with gentle damping
    const dampedDelta = deltaX * (isMobile ? 0.75 : 0.85);
    setDragOffset(dampedDelta);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current && !isHorizontalSwipe.current) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const deltaX = currentDeltaX.current;
    const elapsed = Math.max(Date.now() - touchStartTime.current, 1);
    const velocity = Math.abs(deltaX) / elapsed; // px per millisecond

    // Trigger swipe if distance > 22px OR quick flick with velocity > 0.22 px/ms
    const isFlick = velocity > 0.22 && Math.abs(deltaX) > 15;
    const isDistance = Math.abs(deltaX) > (isMobile ? 24 : 38);

    if (isHorizontalSwipe.current && (isFlick || isDistance)) {
      lastSwipeTime.current = Date.now();
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    isDraggingRef.current = false;
    isHorizontalSwipe.current = false;
    isGestureDetermined.current = false;
    setIsDragging(false);
    setDragOffset(0);

    // Suppress synthetic click emitted after touch release
    setTimeout(() => {
      dragDistanceRef.current = 0;
    }, 380);
  };

  // Mouse Handlers for Desktop Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    touchStartTime.current = Date.now();
    currentDeltaX.current = 0;
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - touchStartX.current;
    currentDeltaX.current = deltaX;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(deltaX));
    setDragOffset(deltaX * 0.75);
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;

    const deltaX = currentDeltaX.current;
    if (Math.abs(deltaX) > 35) {
      lastSwipeTime.current = Date.now();
      if (deltaX < 0) handleNext();
      else handlePrev();
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);

    setTimeout(() => {
      dragDistanceRef.current = 0;
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const currentItem = items[normalizedActive];
      if (currentItem) onPlay(currentItem);
    }
  };

  return (
    <div 
      className="relative w-full flex flex-col items-center select-none mb-8 mt-2 focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Featured Releases 3D Carousel"
    >
      {/* 3D Stage Container */}
      <div 
        className={`relative w-full ${isMobile ? 'h-[340px]' : isTablet ? 'h-[390px]' : 'h-[440px]'} flex items-center justify-center perspective-1000 overflow-hidden touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Ambient Stage Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[480px] h-[320px] md:h-[480px] bg-white/[0.04] rounded-full blur-[90px] pointer-events-none -z-10" />

        {/* Soft Left & Right Edge Vignette */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 md:w-20 bg-gradient-to-r from-[var(--color-surface-0)] to-transparent z-30" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 md:w-20 bg-gradient-to-l from-[var(--color-surface-0)] to-transparent z-30" />

        {/* Chevron Navigation Controls - Positioned on Top (z-[60]) */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous release"
          className="absolute left-1.5 sm:left-4 md:left-8 z-[60] w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-black/75 hover:bg-black/95 text-white/80 hover:text-white border border-white/15 hover:border-white/35 backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-[0.96] shadow-2xl cursor-pointer group pointer-events-auto"
        >
          <ChevronLeft size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next release"
          className="absolute right-1.5 sm:right-4 md:right-8 z-[60] w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-black/75 hover:bg-black/95 text-white/80 hover:text-white border border-white/15 hover:border-white/35 backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-[0.96] shadow-2xl cursor-pointer group pointer-events-auto"
        >
          <ChevronRight size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 3D Cards */}
        {items.map((item, index) => {
          let offset = index - normalizedActive;
          while (offset > n / 2) offset -= n;
          while (offset < -n / 2) offset += n;

          const absOffset = Math.abs(offset);
          const direction = offset > 0 ? 1 : offset < 0 ? -1 : 0;
          const isActive = offset === 0;

          if (absOffset > maxVisibleOffset) return null;

          const zIndex = 50 - absOffset;
          // Apply live drag offset during active swiping
          const translateX = (offset * spacingX) + dragOffset;
          const translateZ = isActive 
            ? (isMobile ? 70 : 110) 
            : (isMobile ? -100 : -140) - (absOffset * (isMobile ? 25 : 40));
          const rotateY = isActive ? 0 : -direction * rotateAngle;
          const scale = isActive 
            ? 1 
            : Math.max(0.72, (isMobile ? 0.82 : 0.86) - (absOffset * 0.05));

          const opacity = isActive 
            ? 1 
            : absOffset === 1 
              ? (isMobile ? 0.75 : 0.85) 
              : absOffset === 2 
                ? (isMobile ? 0.25 : 0.5) 
                : 0.2;

          return (
            <div
              key={item.id + index}
              className={`absolute group rounded-2xl ${
                isDragging 
                  ? 'transition-none' 
                  : 'transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]'
              } ${
                isActive 
                  ? 'shadow-[0_24px_64px_rgba(0,0,0,0.85)] ring-1 ring-white/20' 
                  : 'shadow-lg hover:shadow-2xl'
              }`}
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                zIndex,
                opacity,
                pointerEvents: opacity > 0 ? 'auto' : 'none'
              }}
              onClick={(e) => {
                e.stopPropagation();
                // If user just dragged or swiped, suppress click action
                if (Date.now() - lastSwipeTime.current < 400 || dragDistanceRef.current > 8) {
                  return;
                }
                if (isActive) {
                  onClick(item);
                } else {
                  lastSwipeTime.current = Date.now();
                  setActiveIndex(prev => (prev + offset + n) % n);
                }
              }}
            >
              {/* Card Surface */}
              <div className={`${
                isMobile 
                  ? 'w-[200px] h-[270px]' 
                  : isTablet 
                    ? 'w-[230px] h-[315px]' 
                    : 'w-[260px] h-[350px]'
              } bg-[#030304]/90 backdrop-blur-xl rounded-2xl overflow-hidden relative border ${
                isActive ? 'border-white/[0.18]' : 'border-white/[0.05]'
              } flex flex-col`}>
                
                {/* Cover Artwork */}
                <div className="w-full h-full bg-zinc-900 shrink-0 relative overflow-hidden rounded-2xl [transform:translateZ(0)]">
                  {item.coverArtUrl ? (
                    <img 
                      src={item.coverArtUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <ArtImage 
                      artist={item.artist} 
                      album={item.title} 
                      type="album" 
                      className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                  )}

                  {/* Top Glass Sheen */}
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
                </div>
                
                {/* Active Card Interactive Panel */}
                {isActive ? (
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 pt-8 bg-gradient-to-t from-[#030304] via-[#030304]/90 to-transparent">
                    <h3 className="font-black text-lg sm:text-xl md:text-2xl text-white tracking-tight truncate drop-shadow-md">
                      {item.title}
                    </h3>
                    <p className="text-zinc-400 text-xs sm:text-sm font-medium truncate mt-0.5">
                      {item.artist}
                    </p>
                    
                    {/* Play Button & Decorative Track Indicator */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
                      <button 
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onPlay(item); 
                        }}
                        aria-label={`Play ${item.title}`}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-[0.96] transition-transform shadow-[0_8px_24px_rgba(255,255,255,0.3)] shrink-0 cursor-pointer"
                      >
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </button>
                      
                      <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-2/5 bg-gradient-to-r from-white to-white/80 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Inactive Side Cards - Clean 3D Depth Vignette & Minimal Tag */
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex flex-col justify-end p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none">
                    {absOffset === 1 && (
                      <div className="text-center opacity-85 group-hover:opacity-100 transition-opacity">
                        <p className="font-bold text-xs sm:text-sm text-zinc-100 truncate drop-shadow-sm">{item.title}</p>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.artist}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Pill Dots - Generous Hit Target (40px) */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-2 pb-1 z-30">
        {items.map((_, dotIdx) => {
          const isCurrent = dotIdx === normalizedActive;
          return (
            <button
              key={dotIdx}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                lastSwipeTime.current = Date.now();
                setActiveIndex(dotIdx);
              }}
              aria-label={`Go to release ${dotIdx + 1}`}
              className="h-8 px-1 sm:px-1.5 flex items-center justify-center cursor-pointer group"
            >
              <span className={`block transition-all duration-300 rounded-full ${
                isCurrent 
                  ? 'w-6 sm:w-7 h-1.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]' 
                  : 'w-1.5 sm:w-2 h-1.5 bg-white/25 group-hover:bg-white/60 group-active:bg-white'
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
