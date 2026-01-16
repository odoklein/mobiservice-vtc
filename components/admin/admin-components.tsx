'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// ============================================
// Admin Page Header
// ============================================

// ============================================
// Admin Page Header
// ============================================

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

export function AdminPageHeader({
    title,
    description,
    actions,
    className
}: AdminPageHeaderProps) {
    return (
        <div className={cn("bg-slate-900 text-white px-4 py-4 md:px-6 md:py-6", className)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-slate-400 mt-1 text-sm">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// Admin Page Container
// ============================================

interface AdminPageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function AdminPageContainer({
    children,
    className
}: AdminPageContainerProps) {
    return (
        <div className={cn("p-4 md:p-6 space-y-4 md:space-y-6", className)}>
            {children}
        </div>
    );
}

// ============================================
// Admin Card
// ============================================

interface AdminCardProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    icon?: LucideIcon;
    iconColor?: string;
    actions?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function AdminCard({
    children,
    title,
    description,
    icon: Icon,
    iconColor = "text-sky-600",
    actions,
    className,
    noPadding = false,
}: AdminCardProps) {
    return (
        <Card className={cn("border-0 shadow-md bg-white overflow-hidden", className)}>
            {(title || actions) && (
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {Icon && (
                                <div className="p-2 rounded-lg bg-slate-50 flex-shrink-0">
                                    <Icon className={cn("h-5 w-5", iconColor)} />
                                </div>
                            )}
                            <div>
                                {title && (
                                    <CardTitle className="text-lg font-bold text-slate-900">
                                        {title}
                                    </CardTitle>
                                )}
                                {description && (
                                    <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                                )}
                            </div>
                        </div>
                        {actions && (
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}
            <CardContent className={cn(noPadding ? "p-0" : "p-4 md:p-6")}>
                {children}
            </CardContent>
        </Card>
    );
}

// ============================================
// Admin Empty State
// ============================================

interface AdminEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function AdminEmptyState({
    icon: Icon,
    title,
    description,
    action,
    className
}: AdminEmptyStateProps) {
    return (
        <div className={cn("text-center py-8 md:py-12 px-4", className)}>
            <Icon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">{title}</p>
            {description && (
                <p className="text-sm text-slate-400 mt-1">{description}</p>
            )}
            {action && (
                <div className="mt-4">{action}</div>
            )}
        </div>
    );
}

// ============================================
// Admin Filter Button
// ============================================

interface AdminFilterButtonProps {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
    activeClassName?: string;
    className?: string;
}

export function AdminFilterButton({
    active,
    children,
    onClick,
    activeClassName = "bg-slate-800 text-white",
    className
}: AdminFilterButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                active
                    ? activeClassName
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
                className
            )}
        >
            {children}
        </button>
    );
}

// ============================================
// Admin Stats Card
// ============================================

interface AdminStatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    iconBgColor?: string;
    iconColor?: string;
    href?: string;
    className?: string;
}

export function AdminStatsCard({
    title,
    value,
    description,
    icon: Icon,
    iconBgColor = "bg-sky-50",
    iconColor = "text-sky-600",
    href,
    className,
}: AdminStatsCardProps) {
    const CardWrapper = href ? 'a' : 'div';

    return (
        <CardWrapper
            href={href}
            className={cn(
                "block",
                href && "group cursor-pointer",
                className
            )}
        >
            <Card className={cn(
                "border-0 shadow-md bg-white transition-all duration-200",
                href && "hover:shadow-lg hover:-translate-y-0.5"
            )}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">
                        {title}
                    </CardTitle>
                    {Icon && (
                        <div className={cn("p-2 rounded-lg transition-colors", iconBgColor, href && "group-hover:opacity-80")}>
                            <Icon className={cn("h-4 w-4", iconColor)} />
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{value}</div>
                    {description && (
                        <p className="text-xs text-slate-500 mt-1">{description}</p>
                    )}
                </CardContent>
            </Card>
        </CardWrapper>
    );
}

// ============================================
// Admin Alert Banner
// ============================================

interface AdminAlertBannerProps {
    variant?: 'info' | 'warning' | 'success' | 'error';
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

const alertVariants = {
    info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        titleColor: "text-blue-900",
        descColor: "text-blue-700",
    },
    warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        titleColor: "text-amber-900",
        descColor: "text-amber-700",
    },
    success: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        titleColor: "text-emerald-900",
        descColor: "text-emerald-700",
    },
    error: {
        bg: "bg-red-50",
        border: "border-red-200",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        descColor: "text-red-700",
    },
};

export function AdminAlertBanner({
    variant = 'info',
    icon: Icon,
    title,
    description,
    action,
    className
}: AdminAlertBannerProps) {
    const styles = alertVariants[variant];

    return (
        <div className={cn(
            "rounded-xl p-5 border-2",
            styles.bg,
            styles.border,
            className
        )}>
            <div className="flex items-start gap-4">
                {Icon && (
                    <div className={cn("p-3 rounded-full", styles.iconBg)}>
                        <Icon className={cn("h-6 w-6", styles.iconColor)} />
                    </div>
                )}
                <div className="flex-1">
                    <h3 className={cn("text-lg font-bold mb-1", styles.titleColor)}>
                        {title}
                    </h3>
                    {description && (
                        <p className={cn("text-sm mb-4", styles.descColor)}>
                            {description}
                        </p>
                    )}
                    {action}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Admin Tabs
// ============================================

interface AdminTabsProps {
    tabs: Array<{ id: string; label: string; count?: number }>;
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
}

export function AdminTabs({
    tabs,
    activeTab,
    onChange,
    className
}: AdminTabsProps) {
    return (
        <div className={cn("flex gap-2", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-base transition-all",
                        activeTab === tab.id
                            ? "bg-slate-900 text-white shadow-lg"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-sm font-bold",
                            activeTab === tab.id
                                ? "bg-white/20 text-white"
                                : "bg-slate-300 text-slate-700"
                        )}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
