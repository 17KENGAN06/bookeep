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
  previewClassName?: string;
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
  previewClassName,
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
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink">{label}</p>
      {hint ? <p className="mb-2 text-xs text-muted">{hint}</p> : null}
      {shownPreview ? (
        <div className={cn('mb-3 overflow-hidden rounded-xl border border-line bg-elevated', previewClassName)}>
          <img src={shownPreview} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <label
        className={cn(
          'focus-within:ring-accent/70 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition',
          dragOver ? 'border-accent bg-elevated/60' : 'border-line bg-bg',
          shownError ? 'border-accent' : '',
        )}
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
        <span className="text-sm font-medium text-ink">
          {uploading
            ? t('admin.upload.uploading')
            : file
              ? file.name
              : currentName || t('admin.upload.drop')}
        </span>
        <span className="mt-1 text-xs text-muted">{t('admin.upload.orBrowse')}</span>
      </label>
      {shownError ? <p className="mt-2 text-xs text-accent">{shownError}</p> : null}
      {file && !shownError ? <p className="mt-2 text-xs text-muted">{t('admin.upload.ready')}</p> : null}
    </div>
  );
}
