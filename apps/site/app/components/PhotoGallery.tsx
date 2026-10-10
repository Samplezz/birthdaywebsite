'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Calendar, MapPin, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { PhotoMemory } from '@birthday/shared';

interface PhotoGalleryProps {
  photos: PhotoMemory[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [unavailablePhotoIds, setUnavailablePhotoIds] = useState<Set<string>>(new Set());

  const sortedPhotos = [...photos].sort((a, b) => a.order - b.order);
  const availablePhotos = sortedPhotos.filter((photo) => !unavailablePhotoIds.has(photo.id));

  const handlePhotoError = (photoId: string) => {
    setUnavailablePhotoIds((current) => new Set(current).add(photoId));
    setSelectedPhotoIndex(null);
  };

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + availablePhotos.length) % availablePhotos.length);
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % availablePhotos.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, availablePhotos.length]);

  return (
    <section className="gallery-section">
      <div className="section-header text-center">
        <span className="badge-pill">
          <Camera size={14} /> Our Journey Together
        </span>
        <h2 className="section-title serif-heading">Cherished Memories</h2>
        <p className="section-subtitle">Moments in time frozen in love</p>
      </div>

      {/* Timeline / Polaroid Cards Grid */}
      <div className="photos-grid">
        {availablePhotos.length === 0 ? (
          <p className="empty-state">No cherished memories have been added yet.</p>
        ) : availablePhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="photo-card glass-panel"
            onClick={() => openLightbox(index)}
          >
            <div className="image-wrapper">
              <img
                src={`/api/media?pathname=${encodeURIComponent(photo.url)}`}
                alt={photo.caption}
                loading="lazy"
                className="photo-img"
                onError={() => handlePhotoError(photo.id)}
              />
              <div className="expand-overlay">
                <Maximize2 size={20} />
              </div>
            </div>

            <div className="photo-info">
              <div className="meta-row">
                {photo.date && (
                  <span className="meta-tag">
                    <Calendar size={12} /> {photo.date}
                  </span>
                )}
                {photo.location && (
                  <span className="meta-tag">
                    <MapPin size={12} /> {photo.location}
                  </span>
                )}
              </div>
              <p className="photo-caption">{photo.caption}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Full-screen Lightbox View */}
      {selectedPhotoIndex !== null && availablePhotos[selectedPhotoIndex] && (
        <div className="lightbox-backdrop" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Close photo">
              <X size={24} />
            </button>

            <button className="nav-arrow prev-arrow" onClick={prevPhoto} aria-label="Previous photo">
              <ChevronLeft size={30} />
            </button>

            <div className="lightbox-image-box">
              <img
                src={`/api/media?pathname=${encodeURIComponent(availablePhotos[selectedPhotoIndex].url)}`}
                alt={availablePhotos[selectedPhotoIndex].caption}
                className="lightbox-img"
                onError={() => handlePhotoError(availablePhotos[selectedPhotoIndex].id)}
              />
              <div className="lightbox-details">
                <div className="meta-row">
                  {availablePhotos[selectedPhotoIndex].date && (
                    <span className="meta-tag">
                      <Calendar size={13} /> {availablePhotos[selectedPhotoIndex].date}
                    </span>
                  )}
                  {availablePhotos[selectedPhotoIndex].location && (
                    <span className="meta-tag">
                      <MapPin size={13} /> {availablePhotos[selectedPhotoIndex].location}
                    </span>
                  )}
                </div>
                <p className="lightbox-caption">{availablePhotos[selectedPhotoIndex].caption}</p>
                <span className="lightbox-counter">
                  {selectedPhotoIndex + 1} of {availablePhotos.length}
                </span>
              </div>
            </div>

            <button className="nav-arrow next-arrow" onClick={nextPhoto} aria-label="Next photo">
              <ChevronRight size={30} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .gallery-section {
          padding: 40px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 5;
        }

        .section-header {
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          background: rgba(255, 117, 143, 0.15);
          border: 1px solid rgba(255, 117, 143, 0.35);
          color: var(--rose-soft);
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .section-title {
          font-size: clamp(1.8rem, 5vw, 2.4rem);
          color: var(--text-soft);
        }

        .section-subtitle {
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .photos-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          width: 100%;
          max-width: 480px;
        }

        .empty-state {
          color: var(--text-muted);
          padding: 28px 16px;
          text-align: center;
        }

        @media (min-width: 640px) {
          .photos-grid {
            max-width: 580px;
          }
        }

        .photo-card {
          padding: 12px;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
        }

        .photo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(224, 63, 103, 0.25);
        }

        .image-wrapper {
          position: relative;
          width: 100%;
          height: 270px;
          border-radius: 16px;
          overflow: hidden;
          background: #2a101b;
        }

        .photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .photo-card:hover .photo-img {
          transform: scale(1.04);
        }

        .expand-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .photo-card:hover .expand-overlay {
          opacity: 1;
        }

        .photo-info {
          padding: 14px 4px 6px 4px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--rose-soft);
          opacity: 0.9;
        }

        .photo-caption {
          font-size: 0.95rem;
          color: var(--text-soft);
          line-height: 1.45;
        }

        /* Lightbox */
        .lightbox-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 4, 8, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fade-in 0.25s ease;
        }

        .lightbox-content {
          position: relative;
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .lightbox-close {
          position: absolute;
          top: -46px;
          right: 0;
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: #fff;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .nav-arrow {
          position: absolute;
          top: 45%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.14);
          border: none;
          color: #fff;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
        }

        .prev-arrow {
          left: -18px;
        }

        .next-arrow {
          right: -18px;
        }

        .lightbox-image-box {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(25, 8, 18, 0.85);
          border: 1px solid rgba(255, 117, 143, 0.3);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }

        .lightbox-img {
          width: 100%;
          max-height: 60vh;
          object-fit: contain;
          display: block;
          background: #000;
        }

        .lightbox-details {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lightbox-caption {
          font-size: 1rem;
          color: #fff;
        }

        .lightbox-counter {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: right;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
