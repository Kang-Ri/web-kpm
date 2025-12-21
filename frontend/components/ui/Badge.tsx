import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'info',
    className = ''
}) => {
    const variants = {
        success: 'badge-success',
        warning: 'badge-warning',
        danger: 'badge-danger',
        info: 'badge-info',
    };

    return (
        <span className={`badge ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
