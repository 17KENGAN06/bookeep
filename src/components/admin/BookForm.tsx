import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDropzone } from '@/components/admin/FileDropzone';
import { Button } from '@/components/common/Button';
import { Field, fieldControlClass } from '@/components/common/Field';
import type { Book, BookLanguage, CefrLevel } from '@/types/book';
import { BOOK_LANGUAGES, CEFR_LEVELS } from '@/types/book';
import type { BookDraft } from '@/services/books';
import { isCoverFile, isPdfFile } from '@/utils/files';
import { slugify } from '@/utils/slug';

type BookFormProps = {
  book?: Book | null;
  isSaving: boolean;
  onSubmit: (payload: { draft: BookDraft; cover: File | null; thumbnail: File | null; pdf: File | null }) => void;
};

const emptyDraft: BookDraft = {
  title_original: '',
  title_en: null,
  title_fi: null,
  title_uk: null,
  title_ru: null,
  description_en: null,
  description_fi: null,
  description_uk: null,
  description_ru: null,
  language: 'fi',
  level: 'A2',
  published: true,
  complete: false,
};

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function BookForm({ book, isSaving, onSubmit }: BookFormProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<BookDraft>(() =>
    book
      ? {
          title_original: book.title_original,
          title_en: book.title_en,
          title_fi: book.title_fi,
          title_uk: book.title_uk,
          title_ru: book.title_ru,
          description_en: book.description_en,
          description_fi: book.description_fi,
          description_uk: book.description_uk,
          description_ru: book.description_ru,
          language: book.language,
          level: book.level,
          published: book.published,
          complete: book.complete ?? true,
          slug: book.slug,
        }
      : emptyDraft,
  );
  const [cover, setCover] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(book);

  const generatedSlug = useMemo(
    () => slugify(draft.slug || draft.title_original || 'book'),
    [draft.slug, draft.title_original],
  );

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.title_original.trim()) {
          setFormError(t('admin.form.titleRequired'));
          return;
        }
        if (!isEdit && !cover) {
          setFormError(t('admin.form.coverRequired'));
          return;
        }
        if (!isEdit && !pdf) {
          setFormError(t('admin.form.pdfRequired'));
          return;
        }
        setFormError(null);
        onSubmit({
          draft: {
            ...draft,
            title_original: draft.title_original.trim(),
            slug: generatedSlug,
            title_en: nullable(draft.title_en ?? ''),
            title_fi: nullable(draft.title_fi ?? ''),
            title_uk: nullable(draft.title_uk ?? ''),
            title_ru: nullable(draft.title_ru ?? ''),
            description_en: nullable(draft.description_en ?? ''),
            description_fi: nullable(draft.description_fi ?? ''),
            description_uk: nullable(draft.description_uk ?? ''),
            description_ru: nullable(draft.description_ru ?? ''),
          },
          cover,
          thumbnail,
          pdf,
        });
      }}
    >
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <FileDropzone
          label={t('admin.form.cover')}
          hint={t('admin.form.coverHint')}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          file={cover}
          currentName={book?.cover_path ? t('admin.form.fileKept') : null}
          previewUrl={book?.cover_path}
          previewFit="contain"
          onFile={setCover}
          onValidate={(file) => (isCoverFile(file) ? null : t('admin.upload.coverInvalid'))}
        />
        <FileDropzone
          label={t('admin.form.thumbnail')}
          hint={t('admin.form.thumbnailHint')}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          file={thumbnail}
          currentName={book?.thumbnail_path ? t('admin.form.fileKept') : null}
          previewUrl={book?.thumbnail_path}
          previewFit="cover"
          onFile={setThumbnail}
          onValidate={(file) => (isCoverFile(file) ? null : t('admin.upload.coverInvalid'))}
        />
        <div className="lg:col-span-2">
          <FileDropzone
            label={t('admin.form.pdf')}
            accept="application/pdf,.pdf"
            file={pdf}
            currentName={book?.pdf_path ? t('admin.form.fileKept') : null}
            onFile={setPdf}
            onValidate={(file) => (isPdfFile(file) ? null : t('admin.upload.pdfInvalid'))}
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label={t('admin.form.titleOriginal')}>
          <input
            required
            className={fieldControlClass}
            value={draft.title_original}
            onChange={(event) => setDraft((current) => ({ ...current, title_original: event.target.value }))}
          />
        </Field>
        <Field label={t('admin.form.slug')} hint={generatedSlug}>
          <input
            className={fieldControlClass}
            value={draft.slug ?? ''}
            onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
            placeholder={generatedSlug}
          />
        </Field>
        <Field label={t('admin.form.language')}>
          <select
            className={fieldControlClass}
            value={draft.language}
            onChange={(event) =>
              setDraft((current) => ({ ...current, language: event.target.value as BookLanguage }))
            }
          >
            {BOOK_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {t(`languages.${code}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('admin.form.level')}>
          <select
            className={fieldControlClass}
            value={draft.level}
            onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value as CefrLevel }))}
          >
            {CEFR_LEVELS.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="space-y-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))}
          />
          {t('admin.form.published')}
        </label>
        <div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={draft.complete}
              onChange={(event) => setDraft((current) => ({ ...current, complete: event.target.checked }))}
            />
            {t('admin.form.complete')}
          </label>
          <p className="mt-1 max-w-xl text-xs text-muted">{t('admin.form.completeHint')}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {(['en', 'fi', 'uk', 'ru'] as const).map((locale) => (
          <div key={locale} className="space-y-4 rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">{locale}</p>
            <Field label={t('admin.form.localizedTitle')}>
              <input
                className={fieldControlClass}
                value={draft[`title_${locale}`] ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, [`title_${locale}`]: event.target.value }))
                }
              />
            </Field>
            <Field label={t('admin.form.localizedDescription')}>
              <textarea
                rows={4}
                className={fieldControlClass}
                value={draft[`description_${locale}`] ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, [`description_${locale}`]: event.target.value }))
                }
              />
            </Field>
          </div>
        ))}
      </div>

      {formError ? <p className="text-sm text-accent">{formError}</p> : null}

      <Button type="submit" isLoading={isSaving}>
        {isEdit ? t('admin.form.save') : t('admin.form.create')}
      </Button>
    </form>
  );
}
