import { useState, useCallback } from 'react';
import { getCapsules } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import WaterfallLayout from '../components/WaterfallLayout';
import CapsuleForm from '../components/CapsuleForm';

const Home = () => {
  const [showForm, setShowForm] = useState(false);

  const fetchCapsules = useCallback((page) => {
    return getCapsules(page, 20);
  }, []);

  const { items, loading, hasMore, error, refresh } = useInfiniteScroll(fetchCapsules);

  const handleSuccess = () => {
    refresh();
  };

  return (
    <div className="home">
      <header className="header">
        <h1>[ FUTURE_CAPSULE ]</h1>
        <p className="subtitle">// messages to your future self</p>
      </header>

      {error && (
        <div className="error-banner">
          ERROR: {error}
          <button onClick={refresh}>RETRY</button>
        </div>
      )}

      <main className="main-content">
        {items.length === 0 && !loading ? (
          <div className="empty-state">
            <p>[ NO CAPSULES YET ]</p>
            <p>Be the first to create one</p>
          </div>
        ) : (
          <WaterfallLayout items={items} onUnlock={refresh} />
        )}

        {loading && (
          <div className="loading">
            <span>LOADING...</span>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="end-message">
            [ END OF TRANSMISSION ]
          </div>
        )}
      </main>

      <button className="fab" onClick={() => setShowForm(true)}>
        +
      </button>

      {showForm && (
        <CapsuleForm
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Home;
