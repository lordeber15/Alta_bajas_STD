import React from 'react';

interface ProgressBarProps {
    value: number; // Valor entre 0 y 100
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
    // Asegurar que el valor esté entre 0 y 100
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', margin: '10px 0' }}>
            <div
                style={{
                    width: `${clampedValue}%`,
                    backgroundColor: clampedValue === 100 ? '#4caf50' : '#2196f3',
                    height: '20px',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-in-out',
                    textAlign: 'center',
                    color: 'white',
                    fontSize: '12px',
                    lineHeight: '20px'
                }}
            >
                {Math.round(clampedValue)}%
            </div>
        </div>
    );
};
