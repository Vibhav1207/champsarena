"use client";

import React from "react";

type SkeletonVariant = "text" | "circular" | "rectangular" | "card" | "avatar" | "button" | "image";

interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    className?: string;
    count?: number;

    lines?: number;
}

export function Skeleton({
    variant = "text",
    width,
    height,
    className = "",
    count = 1,
    lines = 3,
}: SkeletonProps) {
    const baseClass = "animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm";

    const renderItem = (key: number) => {
        switch (variant) {
            case "text":
                return (
                    <div
                        key={key}
                        className={`${baseClass} h-4 w-full rounded-sm ${className}`}
                        style={{ width, height }}
                    />
                );

            case "circular":
                return (
                    <div
                        key={key}
                        className={`${baseClass} rounded-full ${className}`}
                        style={{
                            width: width || 48,
                            height: height || 48,
                        }}
                    />
                );

            case "rectangular":
                return (
                    <div
                        key={key}
                        className={`${baseClass} rounded-md ${className}`}
                        style={{
                            width: width || "100%",
                            height: height || 200,
                        }}
                    />
                );

            case "avatar":
                return (
                    <div key={key} className="flex items-center gap-3">
                        <div className={`${baseClass} rounded-full shrink-0`} style={{ width: 40, height: 40 }} />
                        <div className="flex-1 space-y-2">
                            <div className={`${baseClass} h-3 w-3/4 rounded-sm`} />
                            <div className={`${baseClass} h-3 w-1/2 rounded-sm`} />
                        </div>
                    </div>
                );

            case "button":
                return (
                    <div
                        key={key}
                        className={`${baseClass} rounded-sm border-2 border-surface-container ${className}`}
                        style={{
                            width: width || 120,
                            height: height || 44,
                        }}
                    />
                );

            case "image":
                return (
                    <div
                        key={key}
                        className={`${baseClass} rounded-md ${className}`}
                        style={{
                            width: width || "100%",
                            height: height || 192,
                        }}
                    />
                );

            case "card":
                return (
                    <div key={key} className="bg-white border-4 border-primary p-0 overflow-hidden">
                        {/* Card Image Placeholder */}
                        <div className={`${baseClass} h-48 w-full rounded-none`} />
                        {/* Card Content */}
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className={`${baseClass} h-6 w-24 rounded-sm`} />
                                <div className={`${baseClass} h-4 w-16 rounded-sm`} />
                            </div>
                            <div className={`${baseClass} h-7 w-full rounded-sm`} />
                            <div className="space-y-2">
                                {Array.from({ length: lines }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`${baseClass} h-4 rounded-sm`}
                                        style={{ width: `${100 - i * 15}%` }}
                                    />
                                ))}
                            </div>
                            <div className={`${baseClass} h-12 w-full rounded-sm mt-4`} />
                        </div>
                    </div>
                );

            default:
                return (
                    <div
                        key={key}
                        className={`${baseClass} h-4 w-full rounded-sm ${className}`}
                        style={{ width, height }}
                    />
                );
        }
    };

    if (count > 1) {
        return (
            <div className="space-y-3" role="status" aria-label="Loading">
                {Array.from({ length: count }).map((_, i) => renderItem(i))}
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    return (
        <div role="status" aria-label="Loading">
            {renderItem(0)}
            <span className="sr-only">Loading...</span>
        </div>
    );
}


export function TournamentCardSkeleton() {
    return (
        <article className="bg-white border-4 border-primary flex flex-col">
            <div className="relative h-48 border-b-4 border-primary bg-surface-dim overflow-hidden">
                <div className="absolute inset-0 animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%]" />
                <div className="absolute top-0 right-0 flex">
                    <div className="w-24 h-8 bg-surface-container-high animate-pulse border-l-4 border-b-4 border-primary" />
                    <div className="w-28 h-8 bg-surface-container animate-pulse border-l-4 border-b-4 border-primary" />
                </div>
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <div className="h-8 w-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm mb-3" />
                    <div className="space-y-2 mb-4">
                        <div className="h-4 w-3/4 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                        <div className="h-4 w-1/2 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                        <div className="h-4 w-2/3 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                    <div className="h-12 w-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                </div>
            </div>
        </article>
    );
}

export function LeaderboardRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border-b-2 border-primary/20">
            <div className="w-8 h-8 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm shrink-0" />
            <div className="w-10 h-10 rounded-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                <div className="h-3 w-24 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
            </div>
            <div className="h-6 w-16 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
        </div>
    );
}

export function PageHeaderSkeleton() {
    return (
        <div className="mb-lg border-b-4 border-primary pb-md space-y-4">
            <div className="h-12 w-64 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
            <div className="h-5 w-96 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
        </div>
    );
}

export function FilterSidebarSkeleton() {
    return (
        <div className="bg-white p-md border-4 border-primary space-y-4">
            <div className="flex justify-between items-center border-b-2 border-primary pb-3">
                <div className="h-6 w-20 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                <div className="h-4 w-14 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 w-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm border-2 border-primary" />
            ))}
            <div className="space-y-2">
                <div className="h-5 w-16 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-8 w-20 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="max-w-container-max mx-auto px-md py-lg space-y-8">
            {/* Profile Header */}
            <div className="bg-white border-4 border-primary p-md md:p-xl flex flex-col md:flex-row items-center gap-md">
                <div className="w-32 h-32 rounded-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] shrink-0" />
                <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="h-8 w-48 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm mx-auto md:mx-0" />
                    <div className="h-4 w-32 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm mx-auto md:mx-0" />
                    <div className="flex gap-4 justify-center md:justify-start">
                        <div className="h-10 w-28 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                        <div className="h-10 w-28 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                    </div>
                </div>
            </div>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white border-4 border-primary p-md space-y-3">
                        <div className="h-4 w-16 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                        <div className="h-8 w-12 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                    </div>
                ))}
            </div>
        </div>
    );
}


export function BlogCardSkeleton() {
    return (
        <article className="bg-white border-4 border-primary neo-brutalist-shadow-hover transition-all flex flex-col">
            <div className="h-48 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] border-b-4 border-primary" />
            <div className="p-4 space-y-3">
                <div className="flex gap-2">
                    <div className="h-5 w-16 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                    <div className="h-5 w-20 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                </div>
                <div className="h-6 w-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                <div className="space-y-2">
                    <div className="h-4 w-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                    <div className="h-4 w-3/4 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                </div>
                <div className="h-10 w-32 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
            </div>
        </article>
    );
}


export function GameCardSkeleton() {
    return (
        <article className="bg-white border-4 border-primary flex flex-col">
            <div className="h-44 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] border-b-4 border-primary" />
            <div className="p-4 space-y-3">
                <div className="h-6 w-40 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                <div className="h-4 w-24 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                <div className="space-y-2">
                    <div className="h-4 w-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                    <div className="h-4 w-5/6 bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
                </div>
                <div className="h-10 w-full bg-surface-container-high animate-skeleton bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high bg-[length:400%_100%] rounded-sm" />
            </div>
        </article>
    );
}

export function PageSkeleton({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-fade-in" role="status" aria-label="Page loading">
            {children}
            <span className="sr-only">Loading page content...</span>
        </div>
    );
}