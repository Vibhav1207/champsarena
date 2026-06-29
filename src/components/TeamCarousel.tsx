"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Team {
  id: string;
  name: string;
  pokemonJson: string;
  active: boolean;
}

interface TeamCarouselProps {
  teams: Team[];
}

export default function TeamCarousel({ teams }: TeamCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const calculateCardWidth = useCallback(() => {
    if (!carouselRef.current) return;
    const containerWidth = carouselRef.current.clientWidth;
    const gap = 16; // gap-sm = 16px (spacing-sm)
    const computedCardWidth = (containerWidth * 0.85) - (gap * 0.15); // 85vw minus gap compensation
    setCardWidth(computedCardWidth + gap); // include gap in scroll snap
  }, []);

  useEffect(() => {
    calculateCardWidth();
    observerRef.current = new ResizeObserver(calculateCardWidth);
    if (carouselRef.current) {
      observerRef.current.observe(carouselRef.current);
    }
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [calculateCardWidth, teams.length]);

  const scrollToIndex = useCallback((index: number) => {
    if (!carouselRef.current) return;
    const targetScrollLeft = index * cardWidth;
    carouselRef.current.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth",
    });
    setCurrentIndex(index);
    setHasInteracted(true);
  }, [cardWidth]);

  const scrollLeft = useCallback(() => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  const scrollRight = useCallback(() => {
    if (currentIndex < teams.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, teams.length, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const scrollLeftPos = carouselRef.current.scrollLeft;
    const index = Math.round(scrollLeftPos / cardWidth);
    if (index !== currentIndex && index >= 0 && index < teams.length) {
      setCurrentIndex(index);
    }
    setHasInteracted(true);
    setShowArrows(true);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setShowArrows(false);
    }, 3000);

    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
    }
    scrollEndTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [currentIndex, teams.length, cardWidth]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => {
      if (carousel) {
        carousel.removeEventListener("scroll", handleScroll);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Sync currentIndex when teams array changes
  useEffect(() => {
    if (currentIndex >= teams.length && teams.length > 0) {
      setCurrentIndex(teams.length - 1);
    }
  }, [teams.length]);

  if (teams.length === 0) {
    return (
      <div className="text-center p-lg md:p-xl border-2 border-dashed border-primary bg-surface-container-high w-full max-w-[85vw] mx-auto">
        <span className="material-symbols-outlined text-4xl md:text-5xl text-primary/50 mb-sm block">caught_pokeball</span>
        <p className="font-bold text-primary uppercase text-base md:text-lg">No teams created</p>
        <p className="text-sm font-bold text-primary/60 mt-xs max-w-xs mx-auto">
          Build your team for Pokemon tournaments
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Carousel Container - Mobile: 85% card + peek, Tablet: 50% - gap, Desktop: 33% - gap */}
      <div
        ref={carouselRef}
        className={`
          flex gap-sm pb-md md:pb-0 overflow-x-auto snap-x snap-mandatory
          scroll-smooth touch-pan-x
          scrollbar-hide
          [scroll-snap-type:x_mandatory]
          [&>div]:snap-center
          [&>div]:flex-shrink-0
          [&>div]:basis-[85%]
          [&>div]:min-w-[85%]
          [&>div]:max-w-[85%]
          sm:[&>div]:basis-[calc(50%-8px)]
          sm:[&>div]:min-w-[calc(50%-8px)]
          sm:[&>div]:max-w-[calc(50%-8px)]
          md:[&>div]:basis-[calc(33.333%-10.67px)]
          md:[&>div]:min-w-[calc(33.333%-10.67px)]
          md:[&>div]:max-w-[calc(33.333%-10.67px)]
          lg:[&>div]:basis-[calc(25%-12px)]
          lg:[&>div]:min-w-[calc(25%-12px)]
          lg:[&>div]:max-w-[calc(25%-12px)]
        `}
        onScroll={handleScroll}
        role="region"
        aria-label="Pokemon Teams Carousel"
        aria-roledescription="carousel"
        style={{
          scrollPaddingLeft: "16px", // Matches parent px-md (24px) minus card gap compensation
          scrollPaddingRight: "16px",
        }}
      >
        {teams.map((team, index) => (
          <div
            key={team.id}
            className={`
              relative p-sm border-4 min-h-[280px] md:min-h-[320px] flex flex-col
              ${team.active
                ? "border-accent-yellow bg-accent-yellow/10"
                : "border-primary bg-white"}
            `}
            style={{
              scrollSnapAlign: "center",
              flex: "0 0 85%",
              minWidth: "85%",
              maxWidth: "85%",
            } as React.CSSProperties}
          >
            {team.active && (
              <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-accent-yellow text-primary border-2 border-primary px-2 py-0.5 font-black text-[9px] md:text-[10px] uppercase z-10">
                Active
              </div>
            )}
            <h4 className="font-black text-primary uppercase text-sm md:text-base mb-xs truncate">
              {team.name}
            </h4>
            <div className="flex flex-wrap gap-xs flex-1 min-h-0 overflow-hidden">
              {JSON.parse(team.pokemonJson || "[]").map((poke: any, idx: number) => (
                <span
                  key={idx}
                  className="px-xs py-xs border-2 border-primary bg-white font-black text-[9px] md:text-[10px] uppercase whitespace-nowrap flex-shrink-0 truncate max-w-[100%]"
                >
                  {poke.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gradient Fade Indicators - Right side (shows more content exists) */}
      {teams.length > 1 && (
        <div
          className={`
            absolute inset-y-0 right-0 w-16 md:w-20 pointer-events-none
            bg-gradient-to-l from-background via-background/90 to-transparent
            opacity-70 transition-opacity duration-300
            ${currentIndex === teams.length - 1 ? "opacity-0 pointer-events-none" : ""}
          `}
          aria-hidden="true"
        />
      )}

      {/* Gradient Fade Indicator - Left side (shows more content exists, only visible when not at start) */}
      {teams.length > 1 && currentIndex > 0 && (
        <div
          className={`
            absolute inset-y-0 left-0 w-16 md:w-20 pointer-events-none
            bg-gradient-to-r from-background via-background/90 to-transparent
            opacity-70 transition-opacity duration-300
          `}
          aria-hidden="true"
        />
      )}

      {/* Swipe Hint - Mobile Only, shows until first interaction */}
      {!hasInteracted && teams.length > 1 && (
        <div
          className={`
            absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 md:hidden
            animate-bounce flex items-center gap-xs px-sm py-xs
            bg-primary/10 border-2 border-primary rounded-full
            text-primary font-black text-[10px] uppercase select-none pointer-events-none
            transition-opacity duration-300
            ${hasInteracted ? "opacity-0 pointer-events-none" : "opacity-100"}
          `}
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[14px] animate-pulse">swipe</span>
          Swipe to view teams
        </div>
      )}

      {/* Animated Arrow Hint - Mobile Only, disappears after interaction */}
      {!hasInteracted && teams.length > 1 && (
        <div
          className={`
            absolute right-4 md:hidden top-1/2 -translate-y-1/2
            animate-bounce flex items-center justify-center
            w-8 h-8 bg-primary/10 border-2 border-primary rounded-full
            text-primary transition-all duration-300
            ${hasInteracted ? "opacity-0 pointer-events-none scale-0" : "opacity-100 scale-100"}
          `}
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[18px] animate-pulse">chevron_right</span>
        </div>
      )}

      {/* Scroll Indicator Dots - Always visible */}
      {teams.length > 1 && (
        <div
          className="flex justify-center gap-1 mt-sm md:mt-md"
          role="tablist"
          aria-label="Team indicators"
        >
          {teams.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`
                w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300
                ${index === currentIndex
                  ? "bg-primary w-6 md:w-8"
                  : "bg-primary/30 hover:bg-primary/50"}
              `}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to team ${index + 1}`}
              disabled={isScrolling}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows - Tablet/Desktop Only */}
      {showArrows && teams.length > 1 && (
        <>
          <button
            onClick={scrollLeft}
            disabled={currentIndex === 0 || isScrolling}
            className={`
              absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:translate-x-0
              z-10 p-2 md:p-3 bg-white/95 border-2 border-primary rounded-full
              text-primary hover:bg-primary hover:text-white
              disabled:opacity-30 disabled:pointer-events-none
              transition-all duration-200
              hidden md:flex items-center justify-center
              ${currentIndex === 0 ? "opacity-30 pointer-events-none" : ""}
            `}
            aria-label="Previous team"
            aria-disabled={currentIndex === 0}
          >
            <span className="material-symbols-outlined text-lg md:text-xl">chevron_left</span>
          </button>
          <button
            onClick={scrollRight}
            disabled={currentIndex === teams.length - 1 || isScrolling}
            className={`
              absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-0
              z-10 p-2 md:p-3 bg-white/95 border-2 border-primary rounded-full
              text-primary hover:bg-primary hover:text-white
              disabled:opacity-30 disabled:pointer-events-none
              transition-all duration-200
              hidden md:flex items-center justify-center
              ${currentIndex === teams.length - 1 ? "opacity-30 pointer-events-none" : ""}
            `}
            aria-label="Next team"
            aria-disabled={currentIndex === teams.length - 1}
          >
            <span className="material-symbols-outlined text-lg md:text-xl">chevron_right</span>
          </button>
        </>
      )}

      {/* Keyboard Navigation Support - Screen Reader Only */}
      <div
        className="sr-only"
        role="region"
        aria-live="polite"
        aria-atomic="true"
      >
        Team {currentIndex + 1} of {teams.length}
      </div>

      {/* Touch drag hint for desktop trackpad users - subtle */}
      {teams.length > 1 && (
        <div className="hidden lg:block text-center mt-sm mb-xs">
          <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">
            Scroll or drag to browse teams
          </span>
        </div>
      )}
    </div>
  );
}