import { useState, useEffect, useCallback, useRef } from 'react';

export const useInfiniteScroll = (fetchData) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchData(page);
      setItems(prev => [...prev, ...response.data]);
      setHasMore(response.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, hasMore, fetchData]);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    setItems([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetchData(1);
      setItems(response.data);
      setHasMore(response.hasMore);
      setPage(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchData]);

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  return { items, loading, hasMore, error, refresh };
};
