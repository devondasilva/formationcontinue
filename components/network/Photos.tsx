"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, Loader2, X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { EquipmentPhoto, PhotoKind } from "@/lib/types";
import { PHOTO_KIND_LABEL } from "@/lib/labels";

/**
 * Réduit une photo de téléphone (souvent 4 à 8 Mo) à ~1600 px / JPEG 82 %
 * avant envoi : plus rapide sur réseau mobile, preuve toujours lisible.
 * Les formats non décodables par le navigateur (HEIC…) partent tels quels.
 */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/heic") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 900_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function uploadPhoto(
  file: File,
  meta: { itemId?: string; clubId?: string; kind: PhotoKind; caption?: string }
): Promise<EquipmentPhoto> {
  const blob = await compress(file);
  const fd = new FormData();
  const name = blob === file ? file.name : file.name.replace(/\.[^.]+$/, "") + ".jpg";
  fd.append("file", blob, name);
  if (meta.itemId) fd.append("itemId", meta.itemId);
  if (meta.clubId) fd.append("clubId", meta.clubId);
  fd.append("kind", meta.kind);
  if (meta.caption) fd.append("caption", meta.caption);
  const res = await fetch("/api/photos", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Envoi de la photo impossible.");
  return data.photo as EquipmentPhoto;
}

/**
 * Bouton « Prendre une photo » : ouvre l'appareil photo sur mobile
 * (capture="environment"), la galerie sur ordinateur. Plusieurs photos possibles.
 */
export function PhotoCapture({
  itemId,
  clubId,
  kind,
  caption,
  onUploaded,
  label = "Photo",
  compact = false,
}: {
  itemId?: string;
  clubId?: string;
  kind: PhotoKind;
  caption?: string;
  onUploaded: (p: EquipmentPhoto) => void;
  label?: string;
  compact?: boolean;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    for (const f of Array.from(files).slice(0, 6)) {
      setBusy((n) => n + 1);
      try {
        onUploaded(await uploadPhoto(f, { itemId, clubId, kind, caption }));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="inline-flex gap-1.5">
        <button
          type="button"
          onClick={() => camRef.current?.click()}
          className={`inline-flex items-center gap-2 rounded-full bg-ink font-semibold text-white transition-colors hover:bg-orange ${compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm"}`}
        >
          {busy > 0 ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
          {busy > 0 ? "Envoi…" : label}
        </button>
        <button
          type="button"
          onClick={() => galRef.current?.click()}
          title="Choisir dans la galerie"
          aria-label="Choisir dans la galerie"
          className={`inline-flex items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-ink ${compact ? "h-9 w-9" : "h-10 w-10"}`}
        >
          <ImagePlus size={15} />
        </button>
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => (handle(e.target.files), (e.target.value = ""))} />
      <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => (handle(e.target.files), (e.target.value = ""))} />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

/** Vignettes cliquables + visionneuse plein écran. */
export function PhotoStrip({
  photos,
  onDelete,
  size = 64,
  max,
}: {
  photos: EquipmentPhoto[];
  onDelete?: (p: EquipmentPhoto) => void;
  size?: number;
  max?: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const shown = max ? photos.slice(0, max) : photos;
  if (photos.length === 0) return null;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {shown.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative overflow-hidden rounded-xl bg-muted ring-1 ring-line transition-transform hover:-translate-y-0.5"
            style={{ width: size, height: size }}
            title={`${PHOTO_KIND_LABEL[p.kind]} — ${p.by.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${p.id}`} alt={p.caption ?? PHOTO_KIND_LABEL[p.kind]} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          </button>
        ))}
        {max && photos.length > max && (
          <button type="button" onClick={() => setOpen(max)} className="rounded-xl bg-ink font-mono text-xs text-white" style={{ width: size, height: size }}>
            +{photos.length - max}
          </button>
        )}
      </div>
      <Lightbox photos={photos} index={open} onIndex={setOpen} onDelete={onDelete} />
    </>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
  onDelete,
}: {
  photos: EquipmentPhoto[];
  index: number | null;
  onIndex: (i: number | null) => void;
  onDelete?: (p: EquipmentPhoto) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      if (e.key === "ArrowRight") onIndex((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, photos.length, onIndex]);
  if (!mounted) return null;
  const p = index !== null ? photos[index] : null;
  return createPortal(
    <AnimatePresence>
      {p && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex flex-col bg-ink/95 p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{p.caption || PHOTO_KIND_LABEL[p.kind]}</p>
              <p className="font-mono text-[11px] text-white/60">
                {PHOTO_KIND_LABEL[p.kind]} · {p.by.name} · {new Date(p.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <div className="flex gap-2">
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(p);
                    onIndex(null);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-danger"
                  aria-label="Supprimer la photo"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={() => onIndex(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="relative flex flex-1 items-center justify-center py-4" onClick={() => onIndex(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${p.id}`} alt={p.caption ?? ""} className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => (e.stopPropagation(), onIndex(((index ?? 0) - 1 + photos.length) % photos.length))}
                  className="absolute left-0 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-orange"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={(e) => (e.stopPropagation(), onIndex(((index ?? 0) + 1) % photos.length))}
                  className="absolute right-0 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-orange"
                  aria-label="Photo suivante"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
          <p className="text-center font-mono text-[11px] text-white/50">
            {(index ?? 0) + 1} / {photos.length}
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
