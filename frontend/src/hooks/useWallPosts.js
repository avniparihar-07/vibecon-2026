import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, wsUrl } from '../utils/api.js';

const MAX_POSTS = 8;
const POLL_INTERVAL_MS = 10_000;
const PING_INTERVAL_MS = 25_000;
const RECONNECT_DELAY_MS = 4_000;
const NEW_FLAG_RESET_MS = 3_500;

const dedupePrepend = (existing, incoming) => {
  const seen = new Set(existing.map((p) => p.id));
  const additions = incoming.filter((p) => !seen.has(p.id));
  return [...additions, ...existing].slice(0, MAX_POSTS);
};

export function useWallPosts() {
  const [posts, setPosts] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [planeTrigger, setPlaneTrigger] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const seenInitialIds = useRef(new Set());

  const addNewPost = useCallback((post) => {
    setPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev;
      const flagged = { ...post, isNew: true };
      return [flagged, ...prev].slice(0, MAX_POSTS);
    });
    setPlaneTrigger((n) => n + 1);
    setTimeout(() => {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isNew: false } : p))
      );
    }, NEW_FLAG_RESET_MS);
  }, []);

  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const handleMessage = useCallback(
    (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'initial' && Array.isArray(data.posts)) {
        data.posts.forEach((p) => seenInitialIds.current.add(p.id));
        if (data.posts.length > 0) {
          setPosts((prev) => dedupePrepend(prev, data.posts));
        }
        setPostCount(data.posts.length);
      } else if (data.type === 'new_post' && data.post) {
        if (seenInitialIds.current.has(data.post.id)) return;
        seenInitialIds.current.add(data.post.id);
        addNewPost(data.post);
        setPostCount((n) => n + 1);
      } else if (data.type === 'delete_post' && data.post_id) {
        removePost(data.post_id);
        setPostCount((n) => Math.max(0, n - 1));
      }
    },
    [addNewPost, removePost]
  );

  const connect = useCallback(() => {
    if (wsRef.current) return;
    try {
      const ws = new WebSocket(wsUrl('/api/ws/posts'));
      wsRef.current = ws;
      ws.onmessage = handleMessage;
      ws.onclose = () => {
        wsRef.current = null;
        clearInterval(pingTimer.current);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
      ws.onerror = () => ws.close();
      ws.onopen = () => {
        pingTimer.current = setInterval(() => {
          try { ws.send('ping'); } catch {}
        }, PING_INTERVAL_MS);
      };
    } catch {
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    }
  }, [handleMessage]);

  // WebSocket lifecycle
  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // HTTP polling fallback
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const data = await apiGet('/api/posts');
        if (cancelled || !Array.isArray(data)) return;
        data.forEach((p) => {
          if (!seenInitialIds.current.has(p.id)) {
            seenInitialIds.current.add(p.id);
            addNewPost(p);
          }
        });
      } catch {}
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [addNewPost]);

  return {
    posts,
    postCount,
    setPostCount,
    planeTrigger,
    removePost,
  };
}
