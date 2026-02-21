/** Brand SVG logo — network graph with central "B" node (styleguide Section 2A) */
export function Logo({ size = 48, className }: { size?: number; className?: string }) {
    const height = Math.round(size * (115 / 128));
    return (
        <svg
            viewBox="38 40 128 115"
            width={size}
            height={height}
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Tuk-Tuk logo"
        >
            <defs>
                <radialGradient id="v6-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#33BECC" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#33BECC" stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="105" cy="95" r="80" fill="url(#v6-glow)" />
            <circle cx="105" cy="88" r="20" fill="#005871" />
            <circle cx="105" cy="88" r="23" fill="none" stroke="#33BECC" strokeWidth="1.5" opacity="0.4" />
            <circle cx="60" cy="58" r="11" fill="#33BECC" />
            <circle cx="150" cy="58" r="9" fill="#FF7F50" />
            <circle cx="55" cy="115" r="8" fill="#DCD494" />
            <circle cx="148" cy="120" r="10" fill="#33BECC" opacity="0.7" />
            <circle cx="105" cy="140" r="7" fill="#FF7F50" opacity="0.6" />
            <circle cx="68" cy="82" r="5" fill="#005871" opacity="0.4" />
            <circle cx="140" cy="85" r="5.5" fill="#DCD494" opacity="0.5" />
            <line x1="105" y1="88" x2="60" y2="58" stroke="#33BECC" strokeWidth="1.5" opacity="0.35" />
            <line x1="105" y1="88" x2="150" y2="58" stroke="#FF7F50" strokeWidth="1.5" opacity="0.35" />
            <line x1="105" y1="88" x2="55" y2="115" stroke="#DCD494" strokeWidth="1.5" opacity="0.35" />
            <line x1="105" y1="88" x2="148" y2="120" stroke="#33BECC" strokeWidth="1.2" opacity="0.3" />
            <line x1="105" y1="88" x2="105" y2="140" stroke="#FF7F50" strokeWidth="1.2" opacity="0.3" />
            <line x1="60" y1="58" x2="55" y2="115" stroke="#005871" strokeWidth="1" opacity="0.15" />
            <line x1="150" y1="58" x2="148" y2="120" stroke="#005871" strokeWidth="1" opacity="0.15" />
            <text x="105" y="96" fontFamily="Rubik, sans-serif" fontWeight="700" fontSize="22" fill="#fff" textAnchor="middle">B</text>
        </svg>
    );
}
