import { useState } from 'react';
import { createCapsule } from '../services/api';

const CapsuleForm = ({ onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [unlockTime, setUnlockTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getMinDateTime = () => {
    const now = new Date();
    // 使用本地时间格式，而不是 UTC
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please enter your message');
      return;
    }

    if (!unlockTime) {
      setError('Please select unlock time');
      return;
    }

    setLoading(true);

    try {
      await createCapsule({
        content: content.trim(),
        author: author.trim() || undefined,
        unlock_time: new Date(unlockTime).toISOString()
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create capsule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>[ NEW CAPSULE ]</h2>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>MESSAGE_</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write to your future self..."
              rows={5}
              maxLength={1000}
            />
            <span className="char-count">{content.length}/1000</span>
          </div>

          <div className="form-group">
            <label>AUTHOR_</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>UNLOCK_TIME_</label>
            <input
              type="datetime-local"
              value={unlockTime}
              onChange={(e) => setUnlockTime(e.target.value)}
              min={getMinDateTime()}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'SENDING...' : '[ SEAL CAPSULE ]'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CapsuleForm;
