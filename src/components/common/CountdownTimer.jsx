import { useState, useEffect } from 'react';

/**
 * A premium countdown timer component with a circular progress indicator
 * @param {number} initialSeconds - Total seconds to count down from
 * @param {function} onComplete - Callback when timer reaches zero
 * @param {string} size - 'sm', 'md', 'lg'
 */
const CountdownTimer = ({ 
    initialSeconds = 300, 
    targetDate, 
    onComplete, 
    size = 'md', 
    color,
    strokeColor,
    totalSeconds // New prop to stabilize progress bar
}) => {
    // Helper to calculate remaining seconds from a target date
    const getSecondsFromTarget = (target) => {
        if (!target) return null;
        const diff = new Date(target).getTime() - new Date().getTime();
        return Math.max(0, Math.floor(diff / 1000));
    };

    // Initialize state
    const [timeLeft, setTimeLeft] = useState(() => {
        const targetSeconds = getSecondsFromTarget(targetDate);
        return targetSeconds !== null ? targetSeconds : initialSeconds;
    });
    
    // We keep track of the initial total duration for the progress bar
    const [totalDuration, setTotalDuration] = useState(() => {
        if (totalSeconds) return totalSeconds;
        const targetSeconds = getSecondsFromTarget(targetDate);
        return targetSeconds !== null ? targetSeconds : initialSeconds;
    });

    const [isActive, setIsActive] = useState(true);

    // Sync if targetDate or initialSeconds changes from parent
    useEffect(() => {
        const targetSeconds = getSecondsFromTarget(targetDate);
        const newSeconds = targetSeconds !== null ? targetSeconds : initialSeconds;
        setTimeLeft(newSeconds);
        
        // If totalSeconds is provided, use it as the anchor
        if (totalSeconds) {
            setTotalDuration(totalSeconds);
        } else if (Math.abs(newSeconds - totalDuration) > 10) {
            // Fallback for when totalSeconds isn't provided
            setTotalDuration(newSeconds);
        }
    }, [targetDate, initialSeconds, totalSeconds]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                // If we have a targetDate, we should sync with it precisely
                if (targetDate) {
                    const latestRemaining = getSecondsFromTarget(targetDate);
                    setTimeLeft(latestRemaining);
                    if (latestRemaining === 0) {
                        setIsActive(false);
                        if (onComplete) onComplete();
                    }
                } else {
                    // Fallback to simple decrement
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            if (onComplete) onComplete();
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(interval);
            if (onComplete) onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, targetDate, onComplete]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
    const strokeDashoffset = 264 - (264 * progress) / 100;

    const sizeStyles = {
        sm: { container: '64px', fontSize: '0.85rem', stroke: 3 },
        md: { container: '128px', fontSize: '1.5rem', stroke: 4 },
        lg: { container: '192px', fontSize: '2.5rem', stroke: 6 }
    };

    const currentSize = sizeStyles[size] || sizeStyles.md;

    return (
        <div style={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: currentSize.container, 
            height: currentSize.container 
        }}>
            {/* Background Circle */}
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    fill="transparent"
                    stroke={strokeColor || "rgba(0, 0, 0, 0.05)"}
                    strokeWidth={currentSize.stroke}
                />
                {/* Progress Circle */}
                <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    fill="transparent"
                    stroke={color || "#276EF1"}
                    strokeWidth={currentSize.stroke}
                    strokeDasharray="264%"
                    strokeDashoffset={`${264 - (264 * progress) / 100}%`}
                    strokeLinecap="round"
                    style={{ 
                        transition: 'all 1s linear',
                        filter: `drop-shadow(0 0 8px ${color || "#276EF1"}44)`
                    }}
                />
            </svg>
            
            {/* Time Text */}
            <div style={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center' 
            }}>
                <span style={{ 
                    fontSize: currentSize.fontSize, 
                    fontWeight: '800', 
                    color: color || '#000000', 
                    fontFamily: 'monospace',
                    letterSpacing: '-0.5px'
                }}>
                    {formatTime(timeLeft)}
                </span>
                {size === 'lg' && (
                    <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '800', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em', 
                        color: '#666666', 
                        marginTop: '4px' 
                    }}>
                        REMAINING
                    </span>
                )}
            </div>
        </div>
    );
};

export default CountdownTimer;
