import { useState, useEffect, useRef } from 'react';

const CapsuleCard = ({ capsule, onUnlock }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const hasTriggeredUnlock = useRef(false);

  useEffect(() => {
    if (capsule.is_unlocked) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const unlockTime = new Date(capsule.unlock_time);
      const diff = unlockTime - now;

      if (diff <= 0) {
        if (!hasTriggeredUnlock.current) {
          hasTriggeredUnlock.current = true;
          onUnlock?.();
        }
        return 'UNLOCKING...';
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else {
        return `${minutes}m ${seconds}s`;
      }
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [capsule.is_unlocked, capsule.unlock_time]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`capsule-card ${capsule.is_unlocked ? 'unlocked' : 'locked'}`}>
      {capsule.is_unlocked ? (
        <>
          <div className="capsule-content">{capsule.content}</div>
          <div className="capsule-meta">
            <span className="capsule-author">@{capsule.author}</span>
            <span className="capsule-time">{formatDate(capsule.unlock_time)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="capsule-locked">
            <div className="lock-icon">[ LOCKED ]</div>
            <div className="countdown">{timeLeft}</div>
          </div>
          <div className="capsule-meta">
            <span className="capsule-author">@{capsule.author}</span>
            <span className="capsule-time">UNLOCK: {formatDate(capsule.unlock_time)}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CapsuleCard;
