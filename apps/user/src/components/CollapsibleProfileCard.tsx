import { useState, ReactNode } from 'react';

interface CollapsibleProfileCardProps {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    className?: string;
}

export function CollapsibleProfileCard({
    title,
    icon,
    children,
    defaultExpanded = false,
    className = ''
}: CollapsibleProfileCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`profile-card ${className}`}>
            <div
                className="card-header"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: isExpanded ? 'var(--spacing-lg)' : '0',
                    borderBottom: isExpanded ? '2px solid var(--border-color)' : 'none',
                    paddingBottom: isExpanded ? 'var(--spacing-md)' : '0',
                    transition: 'all 0.3s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    {icon}
                    <h2 className="section-title">{title}</h2>
                </div>
                <div
                    style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            {isExpanded && (
                <div className="card-content animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
}
