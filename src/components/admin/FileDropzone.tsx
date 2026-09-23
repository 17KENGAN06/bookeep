import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

type FileDropzoneProps = {
  label: string;
  accept: string;
  file: File | null;
  currentName?: string | null;
  hint?: string;
  previewUrl?: string | null;
  previewFit?: 'contain' | 'cover';
  error?: string | null;
  uploading?: boolean;
  onFile: (file: File | null) => void;
  onValidate: (file: File) => string | null;
};

export function FileDropzone({
  label,
  accept,
  file,
  currentName,
  hint,
  previewUrl,
  previewFit,
  error,
  uploading,
  onFile,
  onValidate,
}: FileDropzoneProps) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const shownError = error || localError;
  const shownPreview = objectUrl || previewUrl;
  const isImage = Boolean(previewFit);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function takeFile(next: File) {
    const validationError = onValidate(next);
    if (validationError) {
      setLocalError(validationError);
      onFile(null);
      return;
    }
    setLocalError(null);
    onFile(next);
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-2xl border bg-surface p-4',
        dragOver ? 'border-accent' : 'border-line',
        shownError ? 'border-accent' : '',
      )}
    >
      <p className="text-sm font-semibold text-ink">{label}</p>
      {hint || isImage ? (
        <p className={cn('mt-1 text-xs leading-relaxed text-muted', isImage && 'min-h-10')}>{hint ?? '\u00a0'}</p>
      ) : null}
      <label
        className="mt-4 flex flex-1 cursor-pointer flex-col"
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const next = event.dataTransfer.files[0];
          if (!next) return;
          takeFile(next);
        }}
      >
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            if (!next) return;
            takeFile(next);
          }}
        />
        {isImage ? (
          <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-elevated">
            {shownPreview ? (
              <img
                src={shownPreview}
                alt=""
                className={cn(
                  previewFit === 'contain' ? 'h-full w-auto max-w-full object-contain' : 'h-full w-full object-cover',
                )}
              />
            ) : (
              <span className="px-4 text-center text-sm text-muted">{t('admin.upload.drop')}</span>
            )}
          </div>
        ) : (
          <div className="flex min-h-28 flex-1 items-center justify-center rounded-xl border border-dashed border-line bg-bg px-4 py-6">
            <span className="text-center text-sm font-medium text-ink">
              {uploading ? t('admin.upload.uploading') : file ? file.name : currentName || t('admin.upload.drop')}
            </span>
          </div>
        )}
        <span className="mt-3 text-center text-sm font-medium text-ink">
          {uploading ? t('admin.upload.uploading') : file ? file.name : t('admin.upload.orBrowse')}
        </span>
        {currentName && !file ? (
          <span className="mt-1 text-center text-xs text-muted">{currentName}</span>
        ) : null}
      </label>
      {shownError ? <p className="mt-2 text-xs text-accent">{shownError}</p> : null}
      {file && !shownError ? <p className="mt-2 text-center text-xs text-muted">{t('admin.upload.ready')}</p> : null}
    </div>
  );
}
