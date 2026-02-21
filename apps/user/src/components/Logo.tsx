import logoSrc from '../assets/logo.svg';

export function Logo({ size = 48, className }: { size?: number; className?: string }) {
    return (
        <img
            src={logoSrc}
            width={size}
            height={size}
            className={className}
            aria-label="Tuk-Tuk logo"
            alt="Tuk-Tuk logo"
        />
    );
}
