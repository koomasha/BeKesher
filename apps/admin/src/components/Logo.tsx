import logoSrc from '../assets/logo.svg';

export function Logo({ size = 48, className }: { size?: number; className?: string }) {
    const imgSize = Math.round(size * 0.8);
    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <img
                src={logoSrc}
                width={imgSize}
                height={imgSize}
                aria-label="Tuk-Tuk logo"
                alt="Tuk-Tuk logo"
            />
        </div>
    );
}
