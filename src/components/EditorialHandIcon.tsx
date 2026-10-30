import React from 'react';

interface EditorialHandIconProps {
  className?: string;
}

export const EditorialHandIcon: React.FC<EditorialHandIconProps> = ({
  className = 'w-7 h-7 sm:w-8 sm:h-8 inline-block',
}) => {
  return (
    <span className={`inline-block animate-wave origin-[75%_80%] ${className}`} title="Warm greetings!">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
        aria-hidden="true"
      >
        {/* Soft warmth backdrop */}
        <circle cx="24" cy="24" r="22" fill="#F1E8DC" stroke="#DCC9B3" strokeWidth="1.2" />

        {/* Hand illustration in chocolate brown lineart & warm ivory fill */}
        <g stroke="#694B36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Main Hand Contour */}
          <path
            d="M17 28L14.5 24.5C13.5 23 14.5 21 16.5 21.5C18 22 20 23.5 21 25V14.5C21 13 22.8 12 24 13.2C24.5 13.7 24.5 14.5 24.5 16V22.5"
            fill="#FFFCF7"
          />
          {/* Middle Finger */}
          <path
            d="M24.5 17V11.5C24.5 10 26.5 9.2 27.8 10.2C28.2 10.7 28.2 11.5 28.2 12.5V22"
            fill="#FFFCF7"
          />
          {/* Ring Finger */}
          <path
            d="M28.2 16V13.5C28.2 12 30 11.2 31.2 12.2C31.8 12.7 31.8 13.5 31.8 14.5V23"
            fill="#FFFCF7"
          />
          {/* Pinky Finger & Palm base */}
          <path
            d="M31.8 18.5V17C31.8 15.8 33.5 15.2 34.5 16.2C35 16.7 35 17.5 35 18.5V27C35 32 30.5 36.5 25.5 36.5C21.5 36.5 18 33.5 17 29.5V27"
            fill="#FFFCF7"
          />

          {/* Wrist cuff accent */}
          <path
            d="M20 36.5L19 40C19 40.5 20.5 41 24.5 41C28.5 41 30 40.5 30 40L29 36.5"
            fill="#E8DDD0"
          />

          {/* Dynamic motion lines */}
          <path d="M12 17C10.5 19 10 21 10.5 23" stroke="#A58A73" strokeWidth="1.5" />
          <path d="M37 11C38.5 13 39 15 38.5 17" stroke="#A58A73" strokeWidth="1.5" />
        </g>
      </svg>
    </span>
  );
};
