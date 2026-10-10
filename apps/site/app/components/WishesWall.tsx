'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { GuestWish } from '@birthday/shared';

export default function WishesWall() {
  const [wishes, setWishes] = useState<GuestWish[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadWishes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wishes', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load wishes.');
      setWishes(Array.isArray(data.wishes) ? data.wishes : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load wishes right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWishes();
  }, []);

  const submitWish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save your wish.');
      setWishes((current) => [data.wish, ...current]);
      setName('');
      setMessage('');
      setSuccess('Your wish is now part of the celebration.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your wish right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="wishes-wall-section glass-panel" aria-labelledby="wishes-title">
      <div className="section-header text-center">
        <span className="badge-pill"><Heart size={14} /> Guest Wishes</span>
        <h2 id="wishes-title" className="section-title serif-heading">A Wall of Love</h2>
        <p className="section-subtitle">Leave a little birthday magic behind.</p>
      </div>

      <form className="wish-form" onSubmit={submitWish}>
        <label>
          Your name
          <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Your message
          <textarea value={message} maxLength={280} onChange={(event) => setMessage(event.target.value)} required rows={4} />
        </label>
        <button className="romantic-btn" type="submit" disabled={isSubmitting}>
          <Send size={16} /> {isSubmitting ? 'Sending...' : 'Share your wish'}
        </button>
      </form>

      {success && <p className="wish-success" role="status">{success}</p>}
      {error && <p className="wish-error" role="alert">{error}</p>}

      {isLoading ? (
        <p className="wish-empty">Loading wishes...</p>
      ) : wishes.length === 0 ? (
        <p className="wish-empty">No wishes yet. Be the first to leave one.</p>
      ) : (
        <div className="wish-list">
          {wishes.map((wish) => (
            <article className="wish-card" key={wish.id}>
              <h3>{wish.authorName}</h3>
              <p>{wish.message}</p>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        .wishes-wall-section { padding: 28px 20px; margin: 20px 16px; }
        .wish-form { display: grid; gap: 14px; margin: 20px 0; }
        .wish-form label { display: grid; gap: 6px; color: var(--text-soft); font-size: 0.9rem; }
        .wish-form input, .wish-form textarea { width: 100%; border: 1px solid var(--bg-card-border); border-radius: 12px; padding: 12px; background: rgba(0,0,0,.2); color: var(--text-pure); font: inherit; }
        .wish-form textarea { resize: vertical; }
        .wish-success { color: #b8f2c8; margin: 10px 0; }
        .wish-error { color: #ffd0d9; margin: 10px 0; }
        .wish-empty { color: var(--text-muted); text-align: center; padding: 18px 0; }
        .wish-list { display: grid; gap: 12px; }
        .wish-card { padding: 16px; border: 1px solid var(--bg-card-border); border-radius: 14px; background: rgba(255,255,255,.05); }
        .wish-card h3 { color: var(--rose-soft); font-size: 1rem; }
        .wish-card p { color: var(--text-soft); overflow-wrap: anywhere; }
      `}</style>
    </section>
  );
}
