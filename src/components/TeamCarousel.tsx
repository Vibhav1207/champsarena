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
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToIndex = useCallback((index: number) => {
    if (!carouselRef.current) return;
    const cardWidth = carouselRef.current.scrollWidth / teams.length;
    carouselRef.current.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
    setCurrentIndex(index);
    setHasInteracted(true);
  }, [teams.length]);

  const scrollLeft = useCallback(() => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  const scrollRight = useCallback(() => {
    if (currentIndex < teams.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, scrollToIndex, teams.length]);

  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.scrollWidth / teams.length;
    const index = Math.round(scrollLeft / cardWidth);
    if (index !== currentIndex && index >= 0 && index < teams.length) {
      setCurrentIndex(index);
    }
    setHasInteracted(true);
    setShowArrows(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setShowArrows(false);
    }, 3000);
  }, [currentIndex, teams.length]);

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
    };
  }, [handleScroll]);

  if (teams.length === 0) {
    return (
      <div className="text-center p-lg border-2 border-dashed border-primary bg-surface-container-high">
        <span className="material-symbols-outlined text-4xl text-primary/50 mb-sm block">caught_pokeball</span>
        <p className="font-bold text-primary uppercase">No teams created</p>
        <p className="text-sm font-bold text-primary/60 mt-xs">Build your team for Pokemon tournaments</p>
      </div>
    );
  }

  return (
    <div className="relative px-md">
      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="flex gap-sm pb-md overflow-x-auto snap-x snap-mandatory
                     scroll-smooth touch-pan-x
                     scrollbar-hide
                     [scroll-snap-type:x_mandatory]
                     [&>div]:snap-center
                     [&>div]:flex-shrink-0
                     [&>div]:w-[85vw]
                     sm:[&>div]:w-[calc(50%-8px)]
                     md:[&>div]:w-[calc(33.333%-10.67px)]
                     lg:[&>div]:w-[calc(25%-12px)]"
        onScroll={handleScroll}
        role="region"
        aria-label="Pokemon Teams Carousel"
        aria-roledescription="carousel"
      >
        {teams.map((team, index) => (
          <div
            key={team.id}
            className={`relative p-sm border-4 min-h-[280px] flex flex-col ${
              team.active
                ? "border-accent-yellow bg-accent-yellow/10"
                : "border-primary bg-white"
            }`}
            style={{
              scrollSnapAlign: "center",
              minWidth: "85vw",
            }}
          >
            {team.active && (
              <div className="absolute -top-2 -right-2 bg-accent-yellow text-primary border-2 border-primary px-2 py-0.5 font-black text-[9px] uppercase z-10">
                Active
              </div>
            )}
            <h4 className="font-black text-primary uppercase text-sm mb-xs truncate">{team.name}</h4>
            <div className="flex flex-wrap gap-xs flex-1">
              {JSON.parse(team.pokemonJson || "[]").map((poke: any, idx: number) => (
                <span key={idx} className="px-xs py-xs border-2 border-primary bg-white font-black text-[9px] uppercase whitespace-nowrap flex-shrink-0">
                  {poke.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gradient Fade Indicators - Visible on all breakpoints */}
      <div className="absolute inset-y-0 right-0 w-16 pointer-events-none
                       bg-gradient-to-l from-background via-background/80 to-transparent
                       opacity-70" />
      <div className="absolute inset-y-0 left-0 w-16 pointer-events-none
                       bg-gradient-to-r from-background via-background/80 to-transparent
                       opacity-70" />

      {/* Swipe Hint - Mobile Only */}
      {!hasInteracted && teams.length > 1 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 md:hidden
                     animate-bounce flex items-center gap-xs px-sm py-xs
                     bg-primary/10 border-2 border-primary rounded-full
                     text-primary font-black text-[10px] uppercase select-none pointer-events-none"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[14px] animate-pulse">swipe</span>
          Swipe to view teams
        </div>
      )}

      {/* Scroll Indicator Dots */}
      {teams.length > 1 && (
        <div className="flex justify-center gap-1 mt-sm" role="tablist" aria-label="Team indicators">
          {teams.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-primary w-6"
                  : "bg-primary/30 hover:bg-primary/50"
              }`}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to team ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows - Tablet/Desktop Only */}
      {showArrows && teams.length > 1 && (
        <>
          <button
            onClick={scrollLeft}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:translate-x-0
                       z-10 p-2 bg-white/90 border-2 border-primary rounded-full
                       text-primary hover:bg-primary hover:text-white
                       disabled:opacity-30 disabled:pointer-events-none
                       transition-all duration-200
                       hidden md:flex items-center justify-center"
            aria-label="Previous team"
            aria-disabled={currentIndex === 0}
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            onClick={scrollRight}
            disabled={currentIndex === teams.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-0
                       z-10 p-2 bg-white/90 border-2 border-primary rounded-full
                       text-primary hover:bg-primary hover:text-white
                       disabled:opacity-30 disabled:pointer-events-none
                       transition-all duration-200
                       hidden md:flex items-center justify-center"
            aria-label="Next team"
            aria-disabled={currentIndex === teams.length - 1}
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </>
      )}

      {/* Keyboard Navigation Support */}
      <div
        className="sr-only"
        role="region"
        aria-live="polite"
        aria-atomic="true"
      >
        Team {currentIndex + 1} of {teams.length}
      </div>
    </div>
  );
}