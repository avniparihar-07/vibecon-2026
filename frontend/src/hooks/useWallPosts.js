import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabase.js';

const MAX_POSTS = 8;
const NEW_FLAG_RESET_MS = 3_500;

export function useWallPosts() {
  const [posts, setPosts] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [planeTrigger, setPlaneTrigger] = useState(0);
  const seenIds = useRef(new Set());

  const addNewPost = useCallback((post) => {
    if (seenIds.current.has(post.id)) return;
    seenIds.current.add(post.id);
    setPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev;
      const flagged = { ...post, isNew: true };
      return [flagged, ...prev].slice(0, MAX_POSTS);
    });
    setPlaneTrigger((n) => n + 1);
    setPostCount((n) => n + 1);
    setTimeout(() => {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isNew: false } : p))
      );
    }, NEW_FLAG_RESET_MS);
  }, []);

  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPostCount((n) => Math.max(0, n - 1));
  }, []);

  // Fetch initial posts
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((p) => seenIds.current.add(p.id));
        setPosts(data.slice(0, MAX_POSTS));
        setPostCount(data.length);
      }
    };
    fetchPosts();
  }, []);

  // Subscribe to Realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          addNewPost(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          removePost(payload.old.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNewPost, removePost]);

  return {
    posts,
    postCount,
    setPostCount,
    planeTrigger,
    removePost,
  };
}
