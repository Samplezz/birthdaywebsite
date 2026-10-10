'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Type,
  Camera,
  Music,
  Clock,
  Sparkles,
  Eye,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  RefreshCw,
  LogOut,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Ticket,
  MessageSquare,
  Undo2,
  EyeOff,
} from 'lucide-react';
import { DEFAULT_SITE_CONTENT, GuestWish, PhotoMemory, QuizQuestion, SiteContent } from '@birthday/shared';

/**
 * Strips EXIF/GPS metadata and converts image to lightweight WebP in browser.
 */
async function processAndStripImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Image conversion failed'));
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export default function EditorPage() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [activeTab, setActiveTab] = useState<
    'letter' | 'cake' | 'photos' | 'music' | 'countdown' | 'quiz' | 'scratch' | 'wishes'
  >('letter');
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Changes published successfully!');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [uploadingState, setUploadingState] = useState<{ [id: string]: boolean }>({});
  const [audioUploading, setAudioUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [guestWishes, setGuestWishes] = useState<GuestWish[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetPhotoId = useRef<string | null>(null);
  const photoUploadMode = useRef<'gallery' | 'scratch'>('gallery');
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Load content from backend on mount
  useEffect(() => {
    fetch('/api/content')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.content) {
          setContent(data.content);
        }
      })
      .catch((err) => console.warn('Could not load saved content:', err));

    fetch('/api/content/undo')
      .then((res) => res.json())
      .then((data) => {
        if (data.canUndo) setCanUndo(true);
      })
      .catch(() => {});

    fetch('/api/wishes')
      .then((res) => res.json())
      .then((data) => {
        if (data.wishes) setGuestWishes(data.wishes);
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : 'Could not load guest wishes.'));
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const updateField = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  // Photos
  const updatePhoto = (id: string, field: keyof PhotoMemory, val: string | number) => {
    setContent((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, [field]: val } : p)),
    }));
    setIsDirty(true);
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...content.photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;

    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;

    newPhotos.forEach((p, idx) => {
      p.order = idx + 1;
    });

    setContent((prev) => ({ ...prev, photos: newPhotos }));
    setIsDirty(true);
  };

  const deletePhoto = (id: string) => {
    setContent((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== id),
    }));
    setIsDirty(true);
  };

  // Direct Storage Photo Upload (via server route, no presign)
  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetId = replaceTargetPhotoId.current;
    const isScratchUpload = photoUploadMode.current === 'scratch';
    const tempKey = targetId || 'new';
    setUploadingState((prev) => ({ ...prev, [tempKey]: true }));
    setErrorMessage(null);

    try {
      // Convert to WebP client-side (also strips EXIF/GPS metadata)
      const processedBlob = await processAndStripImage(file);

      // Check client-side size (1.5 MB max per photo)
      if (processedBlob.size > 1.5 * 1024 * 1024) {
        throw new Error('Photo is too large after processing (max 1.5 MB). Try a smaller image.');
      }

      // Upload directly to server route via FormData
      const formData = new FormData();
      formData.append('file', processedBlob, `${Date.now()}.webp`);
      if (targetId) {
        formData.append('replacePhotoId', targetId);
      }
      if (isScratchUpload) formData.append('scratchPhoto', 'true');

      const uploadRes = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Photo upload failed');
      }

      const blobPathname = uploadData.pathname;

      if (isScratchUpload) {
        updateField('scratchPhoto', blobPathname);
      } else if (targetId) {
        updatePhoto(targetId, 'url', blobPathname);
      } else {
        const newPhoto: PhotoMemory = {
          id: `photo-${Date.now()}`,
          url: blobPathname,
          caption: 'A special moment together',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          location: 'Our Favorite Spot',
          order: content.photos.length + 1,
        };
        setContent((prev) => ({ ...prev, photos: [...prev.photos, newPhoto] }));
        setIsDirty(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed';
      setErrorMessage(msg);
    } finally {
      setUploadingState((prev) => ({ ...prev, [tempKey]: false }));
      replaceTargetPhotoId.current = null;
      photoUploadMode.current = 'gallery';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Direct Storage MP3 Upload (via server route, no presign)
  const handleAudioFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp3') && file.type !== 'audio/mpeg') {
      setErrorMessage('Please select an MP3 audio file (.mp3)');
      return;
    }

    // Client-side size check (4 MB max, within Vercel 4.5 MB serverless limit)
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage(
        'Audio file is too large (max 4 MB). Tip: Use an online MP3 compressor to reduce the size, or choose a shorter clip.'
      );
      return;
    }

    setAudioUploading(true);
    setErrorMessage(null);

    try {
      // Upload directly via FormData
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Audio upload failed');
      }

      updateField('musicUrl', uploadData.pathname);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      if (content.musicTitle === 'Romantic Acoustic Melody') {
        updateField('musicTitle', cleanName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Audio upload failed';
      setErrorMessage(msg);
    } finally {
      setAudioUploading(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  // Quiz Handlers
  const addQuizQuestion = () => {
    if (content.quizQuestions.length >= 10) {
      setErrorMessage('You can add up to 10 quiz questions.');
      return;
    }
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: 'New romantic question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctIndex: 0,
      explanation: 'Our sweet secret reason!',
    };
    setContent((prev) => ({
      ...prev,
      quizQuestions: [...prev.quizQuestions, newQ],
    }));
    setIsDirty(true);
  };

  const updateQuizQuestion = (id: string, field: keyof QuizQuestion, val: unknown) => {
    setContent((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q) => (q.id === id ? { ...q, [field]: val } : q)),
    }));
    setIsDirty(true);
  };

  const updateQuizOption = (qId: string, optIndex: number, text: string) => {
    setContent((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q) => {
        if (q.id !== qId) return q;
        const newOptions = [...q.options];
        newOptions[optIndex] = text;
        return { ...q, options: newOptions };
      }),
    }));
    setIsDirty(true);
  };

  const deleteQuizQuestion = (id: string) => {
    setContent((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((q) => q.id !== id),
    }));
    setIsDirty(true);
  };

  const moveQuizQuestion = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= content.quizQuestions.length) return;
    const questions = [...content.quizQuestions];
    [questions[index], questions[target]] = [questions[target], questions[index]];
    setContent((prev) => ({ ...prev, quizQuestions: questions }));
    setIsDirty(true);
  };

  // Wish Moderation
  const toggleHideWish = async (wish: GuestWish) => {
    try {
      const res = await fetch('/api/wishes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wish.id, hidden: !wish.isHidden }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update that wish.');
      setGuestWishes((prev) => prev.map((item) => item.id === wish.id ? data.wish : item));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update that wish.');
    }
  };

  const deleteWish = async (id: string) => {
    if (!window.confirm('Delete this guest wish permanently?')) return;
    try {
      const res = await fetch(`/api/wishes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete that wish.');
      setGuestWishes((prev) => prev.filter((wish) => wish.id !== id));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not delete that wish.');
    }
  };

  // Save & Publish
  const handleSaveAndPublish = async () => {
    setShowConfirmModal(false);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (!res.ok) {
        throw new Error('Failed to save to database');
      }

      setIsDirty(false);
      setCanUndo(true);
      setToastMessage('Changes published live to the birthday site!');
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error publishing';
      setErrorMessage(msg);
    }
  };

  // Undo Last Publish
  const handleUndoPublish = async () => {
    setShowUndoModal(false);
    try {
      const res = await fetch('/api/content/undo', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to undo publish');
      }

      setContent(data.content);
      setIsDirty(false);
      setToastMessage('Reverted to the previously published version!');
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not undo';
      setErrorMessage(msg);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="editor-layout">
      {/* Hidden file pickers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoFileSelect}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,.mp3"
        style={{ display: 'none' }}
        onChange={handleAudioFileSelect}
      />

      {/* Top Header */}
      <header className="editor-top-nav">
        <div className="nav-brand">
          <div className="brand-icon">
            <Heart size={20} fill="#ff758f" color="#ff758f" />
          </div>
          <div>
            <h1 className="brand-title">Birthday Studio</h1>
            <p className="brand-sub">
              No-Code Owner Studio • {isDirty ? '⚠️ Unsaved Changes' : 'All Changes Published'}
            </p>
          </div>
        </div>

        <div className="nav-actions">
          {canUndo && (
            <button
              type="button"
              className="btn-secondary undo-btn"
              onClick={() => setShowUndoModal(true)}
              title="Undo last publish and restore previous snapshot"
            >
              <Undo2 size={16} /> Undo Last Publish
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowPreviewModal(true)}
          >
            <Eye size={18} /> Preview
          </button>

          <button
            type="button"
            className={`btn-primary ${isDirty ? 'pulse-btn' : ''}`}
            onClick={() => setShowConfirmModal(true)}
          >
            <Check size={18} /> Save & Publish
          </button>

          <button
            type="button"
            className="btn-secondary logout-btn"
            onClick={handleLogout}
            title="Log out of Studio"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Unsaved Changes Floating Alert */}
      {isDirty && (
        <div className="dirty-banner">
          <span>You have unsaved changes that are not published yet.</span>
          <button className="banner-save-btn" onClick={() => setShowConfirmModal(true)}>
            Publish Now
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button className="dismiss-btn" onClick={() => setErrorMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main Body */}
      <div className="editor-container">
        {/* Navigation Tabs (Scrollable on mobile) */}
        <nav className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'letter' ? 'active' : ''}`}
            onClick={() => setActiveTab('letter')}
          >
            <Type size={18} />
            <span>Letter</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'cake' ? 'active' : ''}`}
            onClick={() => setActiveTab('cake')}
          >
            <Sparkles size={18} />
            <span>Cake</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <Camera size={18} />
            <span>Photos ({content.photos.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'music' ? 'active' : ''}`}
            onClick={() => setActiveTab('music')}
          >
            <Music size={18} />
            <span>Song</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'countdown' ? 'active' : ''}`}
            onClick={() => setActiveTab('countdown')}
          >
            <Clock size={18} />
            <span>Countdown</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <HelpCircle size={18} />
            <span>Quiz ({content.quizQuestions.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'scratch' ? 'active' : ''}`}
            onClick={() => setActiveTab('scratch')}
          >
            <Ticket size={18} />
            <span>Scratch Card</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'wishes' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishes')}
          >
            <MessageSquare size={18} />
            <span>Wishes Wall ({guestWishes.length})</span>
          </button>
        </nav>

        {/* Tab 1: Letter & Words */}
        {activeTab === 'letter' && (
          <section className="editor-card">
            <div className="card-header">
              <h2>💌 Letter & Welcome Words</h2>
              <p>Everything she sees when opening the site and the animated envelope.</p>
            </div>

            <div className="field-group">
              <label className="editor-label">Her Name / Pet Name</label>
              <input
                type="text"
                className="editor-input"
                value={content.recipientName}
                onChange={(e) => updateField('recipientName', e.target.value)}
                placeholder="e.g. My Beloved, Sarah, My Sweetheart"
              />
              <p className="editor-hint">Appears on the top badge and in the letter opening.</p>
            </div>

            <div className="field-group">
              <label className="editor-label">Main Heading</label>
              <input
                type="text"
                className="editor-input"
                value={content.heroTitle}
                onChange={(e) => updateField('heroTitle', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="editor-label">Sub-Headline</label>
              <input
                type="text"
                className="editor-input"
                value={content.heroSubtitle}
                onChange={(e) => updateField('heroSubtitle', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="editor-label">Love Letter Inside Envelope</label>
              <textarea
                rows={8}
                className="editor-textarea"
                value={content.envelopeLetter}
                onChange={(e) => updateField('envelopeLetter', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="editor-label">Letter Sign-off</label>
              <input
                type="text"
                className="editor-input"
                value={content.envelopeSignoff}
                onChange={(e) => updateField('envelopeSignoff', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="editor-label">Final Message After the Fireworks (max 500 characters)</label>
              <textarea
                rows={4}
                maxLength={500}
                className="editor-textarea"
                value={content.finalMessage}
                onChange={(e) => updateField('finalMessage', e.target.value)}
              />
            </div>
          </section>
        )}

        {/* Tab 2: Cake & Candles */}
        {activeTab === 'cake' && (
          <section className="editor-card">
            <div className="card-header">
              <h2>🎂 Cake & Candle Settings</h2>
              <p>Customize the virtual birthday cake and the wish moment.</p>
            </div>

            <div className="field-group">
              <label className="editor-label">Number of Candles</label>
              <div className="candle-stepper">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => updateField('candleCount', Math.max(1, content.candleCount - 1))}
                >
                  -
                </button>
                <span className="stepper-value">{content.candleCount} Candles</span>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => updateField('candleCount', Math.min(10, content.candleCount + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="field-group">
              <label className="editor-label">Prompt for the Wish</label>
              <input
                type="text"
                className="editor-input"
                value={content.cakeWishPrompt}
                onChange={(e) => updateField('cakeWishPrompt', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="editor-label">Message Revealed After Blowing Candles</label>
              <input
                type="text"
                className="editor-input"
                value={content.cakeBlownOutMessage}
                onChange={(e) => updateField('cakeBlownOutMessage', e.target.value)}
              />
            </div>
          </section>
        )}

        {/* Tab 3: Photos Manager */}
        {activeTab === 'photos' && (
          <section className="editor-card">
            <div className="card-header flex-header">
              <div>
                <h2>📸 Cherished Photos & Timeline</h2>
                <p>Upload memories. EXIF metadata is stripped automatically before upload.</p>
              </div>
              <button
                type="button"
                className="btn-primary add-photo-btn"
                disabled={uploadingState['new']}
                onClick={() => {
                  replaceTargetPhotoId.current = null;
                  photoUploadMode.current = 'gallery';
                  fileInputRef.current?.click();
                }}
              >
                {uploadingState['new'] ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} /> Upload New Photo
                  </>
                )}
              </button>
            </div>

            <div className="photos-list">
              {content.photos.map((photo, index) => (
                <div key={photo.id} className="photo-item-card">
                  <div className="photo-preview-box">
                    <img
                      src={`/api/media?pathname=${encodeURIComponent(photo.url)}`}
                      alt={photo.caption}
                      className="photo-thumb"
                    />
                    <span className="photo-order-badge">#{index + 1}</span>
                    <button
                      type="button"
                      className="replace-photo-btn"
                      disabled={uploadingState[photo.id]}
                      onClick={() => {
                        replaceTargetPhotoId.current = photo.id;
                        photoUploadMode.current = 'gallery';
                        fileInputRef.current?.click();
                      }}
                    >
                      {uploadingState[photo.id] ? (
                        <RefreshCw size={14} className="spin-icon" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      <span>Replace</span>
                    </button>
                  </div>

                  <div className="photo-fields">
                    <div className="field-row">
                      <div className="subfield">
                        <label className="editor-label">Caption</label>
                        <input
                          type="text"
                          className="editor-input"
                          value={photo.caption}
                          onChange={(e) => updatePhoto(photo.id, 'caption', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="field-row two-col">
                      <div className="subfield">
                        <label className="editor-label">Date (Optional)</label>
                        <input
                          type="text"
                          className="editor-input"
                          value={photo.date}
                          onChange={(e) => updatePhoto(photo.id, 'date', e.target.value)}
                        />
                      </div>
                      <div className="subfield">
                        <label className="editor-label">Location (Optional)</label>
                        <input
                          type="text"
                          className="editor-input"
                          value={photo.location || ''}
                          onChange={(e) => updatePhoto(photo.id, 'location', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="photo-actions-row">
                      <div className="order-btns">
                        <button
                          type="button"
                          className="order-btn"
                          disabled={index === 0}
                          onClick={() => movePhoto(index, 'up')}
                        >
                          <ArrowUp size={16} /> Move Up
                        </button>
                        <button
                          type="button"
                          className="order-btn"
                          disabled={index === content.photos.length - 1}
                          onClick={() => movePhoto(index, 'down')}
                        >
                          <ArrowDown size={16} /> Move Down
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => deletePhoto(photo.id)}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 4: Background Song */}
        {activeTab === 'music' && (
          <section className="editor-card">
            <div className="card-header">
              <h2>🎵 Background Song (MP3)</h2>
              <p>The song that plays softly in the background when she opens the site.</p>
            </div>

            <div className="field-group">
              <label className="editor-label">Song Title</label>
              <input
                type="text"
                className="editor-input"
                value={content.musicTitle}
                onChange={(e) => updateField('musicTitle', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="editor-label">Upload Audio File (MP3)</label>
              <div className="audio-upload-box">
                <div className="audio-icon-box">
                  <FileAudio size={28} color="#ff758f" />
                </div>
                <div className="audio-meta-text">
                  <span className="current-song-label">Active Track:</span>
                  <strong className="current-song-name">{content.musicTitle}</strong>
                  <span className="audio-format-hint">Direct MP3 upload • Max 15 MB cap • Private storage</span>
                </div>
                <button
                  type="button"
                  className="btn-primary upload-song-btn"
                  disabled={audioUploading}
                  onClick={() => audioInputRef.current?.click()}
                >
                  {audioUploading ? (
                    <>
                      <RefreshCw size={18} className="spin-icon" /> Uploading Song...
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Upload MP3 File
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="audio-preview-card">
              <span className="editor-label">🎧 Test Audio Player & Seeking:</span>
              <audio
                controls
                src={`/api/media?pathname=${encodeURIComponent(content.musicUrl)}`}
                className="editor-audio-element"
              />
            </div>
          </section>
        )}

        {/* Tab 5: Countdown */}
        {activeTab === 'countdown' && (
          <section className="editor-card">
            <div className="card-header">
              <h2>⏳ Birthday Countdown</h2>
              <p>Set the exact moment she turns a year older.</p>
            </div>

            <div className="field-group">
              <label className="editor-label">Birthday Date & Time</label>
              <input
                type="datetime-local"
                className="editor-input"
                value={content.countdownTargetDate}
                onChange={(e) => updateField('countdownTargetDate', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="editor-label">Countdown Headline</label>
              <input
                type="text"
                className="editor-input"
                value={content.countdownTitle}
                onChange={(e) => updateField('countdownTitle', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="editor-label">Celebration Text When It Reaches Zero</label>
              <input
                type="text"
                className="editor-input"
                value={content.countdownCelebrationText}
                onChange={(e) => updateField('countdownCelebrationText', e.target.value)}
              />
            </div>
          </section>
        )}

        {/* Tab 6: Couple Quiz */}
        {activeTab === 'quiz' && (
          <section className="editor-card">
            <div className="card-header flex-header">
              <div>
                <h2>❓ Couple Quiz Questions</h2>
                <p>Personal multiple-choice questions testing your love story.</p>
              </div>
              <button type="button" className="btn-primary" onClick={addQuizQuestion}>
                <Plus size={18} /> Add Question
              </button>
            </div>

            <div className="field-group">
              <label className="editor-label">Low Score Message</label>
              <input
                type="text"
                className="editor-input"
                value={content.quizLowScoreMessage}
                onChange={(e) => updateField('quizLowScoreMessage', e.target.value)}
              />
              <label className="editor-label">Medium Score Message</label>
              <input
                type="text"
                className="editor-input"
                value={content.quizMediumScoreMessage}
                onChange={(e) => updateField('quizMediumScoreMessage', e.target.value)}
              />
              <label className="editor-label">High Score Message</label>
              <input
                type="text"
                className="editor-input"
                value={content.quizHighScoreMessage}
                onChange={(e) => updateField('quizHighScoreMessage', e.target.value)}
              />
              <label className="editor-label">Legacy Success Message</label>
              <input
                type="text"
                className="editor-input"
                value={content.quizSuccessMessage}
                onChange={(e) => updateField('quizSuccessMessage', e.target.value)}
              />
            </div>

            <div className="questions-list">
              {content.quizQuestions.map((q, qIdx) => (
                <div key={q.id} className="quiz-q-card">
                  <div className="q-header">
                    <span className="q-badge">Question {qIdx + 1}</span>
                    <div className="order-btns">
                      <button type="button" className="order-btn" disabled={qIdx === 0} onClick={() => moveQuizQuestion(qIdx, 'up')}><ArrowUp size={14} /> Up</button>
                      <button type="button" className="order-btn" disabled={qIdx === content.quizQuestions.length - 1} onClick={() => moveQuizQuestion(qIdx, 'down')}><ArrowDown size={14} /> Down</button>
                    </div>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => deleteQuizQuestion(q.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>

                  <div className="field-group">
                    <label className="editor-label">Question Text</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={q.question}
                      onChange={(e) => updateQuizQuestion(q.id, 'question', e.target.value)}
                    />
                  </div>

                  <div className="options-grid">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="option-row">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => updateQuizQuestion(q.id, 'correctIndex', optIdx)}
                          title="Mark this option as correct answer"
                        />
                        <input
                          type="text"
                          className="editor-input opt-input"
                          value={opt}
                          onChange={(e) => updateQuizOption(q.id, optIdx, e.target.value)}
                          placeholder={`Option ${optIdx + 1}`}
                        />
                        {q.correctIndex === optIdx && (
                          <span className="correct-tag">Correct Answer ✓</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="field-group">
                    <label className="editor-label">Explanation / Sweet Note</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={q.explanation || ''}
                      onChange={(e) => updateQuizQuestion(q.id, 'explanation', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 7: Scratch Card */}
        {activeTab === 'scratch' && (
          <section className="editor-card">
            <div className="card-header">
              <h2>🎟️ Scratch-Off Card Secret</h2>
              <p>Customize the surprise message hidden underneath the scratch-off surface.</p>
            </div>

            <div className="field-group">
              <label className="editor-label">Scratch Card Title</label>
              <input
                className="editor-input"
                value={content.scratchTitle}
                maxLength={120}
                onChange={(e) => updateField('scratchTitle', e.target.value)}
              />
              <label className="editor-label">Hidden Surprise (max 300 characters)</label>
              <textarea
                rows={4}
                className="editor-textarea"
                maxLength={300}
                value={content.scratchHiddenText}
                onChange={(e) => updateField('scratchHiddenText', e.target.value)}
              />
              <p className="editor-hint">Revealed after roughly 60% of the card is scratched.</p>
              <div className="field-group">
                <label className="editor-label">Optional Scratch Photo</label>
                <div className="photo-actions-row">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      photoUploadMode.current = 'scratch';
                      replaceTargetPhotoId.current = null;
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={16} /> Upload Scratch Photo
                  </button>
                  {content.scratchPhoto && (
                    <button type="button" className="btn-danger" onClick={() => updateField('scratchPhoto', '')}>
                      <Trash2 size={15} /> Remove Scratch Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 8: Wishes Wall Moderation */}
        {activeTab === 'wishes' && (
          <section className="editor-card">
            <div className="card-header">
              <h2>💌 Guest Wishes Wall Moderation</h2>
              <p>Moderate birthday wishes from family and friends. Hide or remove any message instantly.</p>
            </div>

            <div className="wishes-list">
              {guestWishes.length === 0 ? (
                <p className="no-wishes">No guest wishes submitted yet.</p>
              ) : (
                guestWishes.map((wish) => (
                  <div key={wish.id} className={`wish-card ${wish.isHidden ? 'wish-hidden' : ''}`}>
                    <div className="wish-header">
                      <div>
                        <strong>{wish.authorName}</strong>
                        <span className="wish-time">{wish.createdAt}</span>
                      </div>
                      <div className="wish-actions">
                        <button
                          type="button"
                          className="btn-secondary wish-btn"
                          onClick={() => toggleHideWish(wish)}
                        >
                          {wish.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          {wish.isHidden ? 'Unhide' : 'Hide from Public'}
                        </button>
                        <button
                          type="button"
                          className="btn-danger wish-btn"
                          onClick={() => deleteWish(wish.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                    <p className="wish-message">{wish.message}</p>
                    {wish.isHidden && <span className="hidden-badge">Currently Hidden from Site</span>}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Confirmation Modal for Publish */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Heart size={26} color="#ff758f" fill="#ff758f" />
              <h3 className="modal-title">Publish Your Changes?</h3>
            </div>
            <p className="modal-body">
              All your edits to words, photos, song, countdown, quiz, and scratch card will immediately update on her live site without redeploying.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveAndPublish}
              >
                Yes, Publish Now!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Undo */}
      {showUndoModal && (
        <div className="modal-overlay" onClick={() => setShowUndoModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Undo2 size={24} color="#ff758f" />
              <h3 className="modal-title">Undo Last Publish?</h3>
            </div>
            <p className="modal-body">
              This will revert the live birthday website back to the snapshot before your most recent publish.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowUndoModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUndoPublish}
              >
                Yes, Revert to Previous
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-card preview-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Eye size={24} color="#ff758f" />
              <h3 className="modal-title">Site Settings Overview</h3>
            </div>
            <div className="preview-summary">
              <p><strong>Recipient:</strong> {content.recipientName}</p>
              <p><strong>Heading:</strong> {content.heroTitle}</p>
              <p><strong>Candles:</strong> {content.candleCount}</p>
              <p><strong>Photos:</strong> {content.photos.length} uploaded</p>
              <p><strong>Music:</strong> {content.musicTitle}</p>
              <p><strong>Quiz:</strong> {content.quizQuestions.length} questions</p>
              <p><strong>Countdown:</strong> {new Date(content.countdownTargetDate).toLocaleString()}</p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowPreviewModal(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {isSavedToast && (
        <div className="toast-success">
          <CheckCircle2 size={18} /> {toastMessage}
        </div>
      )}

      <style jsx>{`
        .editor-layout {
          min-height: 100vh;
          background: var(--bg-editor);
          padding-bottom: 80px;
        }

        .editor-top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          background: rgba(32, 14, 28, 0.9);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
          gap: 16px;
          flex-wrap: wrap;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 117, 143, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
        }

        .brand-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .undo-btn {
          border-color: rgba(255, 190, 11, 0.4);
          color: #ffbe0b;
        }

        .dirty-banner {
          background: #d97706;
          color: #fff;
          padding: 10px 20px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          font-weight: 500;
        }

        .banner-save-btn {
          background: #fff;
          color: #b45309;
          border: none;
          padding: 4px 14px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .error-banner {
          max-width: 780px;
          margin: 16px auto 0 auto;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: 12px 18px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
        }

        .dismiss-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 0.8rem;
          text-decoration: underline;
        }

        .editor-container {
          max-width: 780px;
          margin: 24px auto 0 auto;
          padding: 0 16px;
        }

        .tab-navigation {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 14px;
          margin-bottom: 24px;
          scrollbar-width: none;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 9999px;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #ff758f 0%, #e03f67 100%);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(224, 63, 103, 0.4);
        }

        .editor-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-header h2 {
          font-size: 1.35rem;
          color: #fff;
        }

        .card-header p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .flex-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
        }

        .candle-stepper {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-input);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          width: fit-content;
          border: 1px solid var(--border-color);
        }

        .step-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 1.3rem;
          cursor: pointer;
        }

        .stepper-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--accent-gold);
        }

        /* Photos Manager List */
        .photos-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .photo-item-card {
          display: flex;
          gap: 18px;
          background: rgba(20, 8, 17, 0.6);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          flex-direction: column;
        }

        @media (min-width: 600px) {
          .photo-item-card {
            flex-direction: row;
          }
        }

        .photo-preview-box {
          position: relative;
          width: 130px;
          height: 130px;
          flex-shrink: 0;
          border-radius: 12px;
          overflow: hidden;
          background: #11050e;
        }

        .photo-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-order-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          background: rgba(0, 0, 0, 0.75);
          color: #fff;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .replace-photo-btn {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(18, 5, 14, 0.85);
          border: none;
          color: #fff;
          font-size: 0.75rem;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
        }

        .photo-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .field-row.two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .photo-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .order-btns {
          display: flex;
          gap: 8px;
        }

        .order-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .audio-upload-box {
          background: rgba(20, 8, 17, 0.6);
          border: 1.5px dashed var(--border-color);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .audio-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: rgba(255, 117, 143, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .audio-meta-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .audio-preview-card {
          background: rgba(20, 8, 17, 0.6);
          border: 1px solid var(--border-color);
          padding: 16px;
          border-radius: var(--radius-md);
        }

        .editor-audio-element {
          width: 100%;
        }

        /* Quiz UI */
        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .quiz-q-card {
          background: rgba(20, 8, 17, 0.6);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .q-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .q-badge {
          font-size: 0.85rem;
          color: var(--accent-gold);
          font-weight: 600;
        }

        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .opt-input {
          flex: 1;
        }

        .correct-tag {
          font-size: 0.75rem;
          color: var(--accent-green);
          font-weight: 600;
          white-space: nowrap;
        }

        /* Wishes Moderation */
        .wishes-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .wish-card {
          background: rgba(20, 8, 17, 0.6);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .wish-hidden {
          opacity: 0.55;
          border-style: dashed;
        }

        .wish-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .wish-time {
          font-size: 0.75rem;
          color: var(--text-dim);
          margin-left: 10px;
        }

        .wish-actions {
          display: flex;
          gap: 8px;
        }

        .wish-btn {
          padding: 6px 12px;
          font-size: 0.75rem;
        }

        .wish-message {
          font-size: 0.95rem;
          color: var(--text-main);
          line-height: 1.5;
        }

        .hidden-badge {
          font-size: 0.7rem;
          color: #fca5a5;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
