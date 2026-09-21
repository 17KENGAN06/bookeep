import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookForm } from '@/components/admin/BookForm';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/Toast';
import { createBook, fetchBookById, updateBook, type BookDraft } from '@/services/books';
import type { Book } from '@/types/book';

export function AdminBookFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void fetchBookById(id)
      .then((next) => {
        setBook(next);
        setMissing(!next);
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(payload: { draft: BookDraft; cover: File | null; thumbnail: File | null; pdf: File | null }) {
    setSaving(true);
    try {
      if (isEdit && id) {
        if (!payload.cover && !book?.cover_path) throw new Error('cover');
        if (!payload.pdf && !book?.pdf_path) throw new Error('pdf');
        await updateBook(id, {
          draft: payload.draft,
          cover: payload.cover,
          thumbnail: payload.thumbnail,
          pdf: payload.pdf,
          currentCoverPath: book?.cover_path,
          currentThumbnailPath: book?.thumbnail_path,
          currentPdfPath: book?.pdf_path,
        });
        notify(t('admin.form.updated'));
      } else {
        if (!payload.cover || !payload.pdf) throw new Error('files');
        await createBook({
          draft: payload.draft,
          cover: payload.cover,
          thumbnail: payload.thumbnail,
          pdf: payload.pdf,
        });
        notify(t('admin.form.created'));
      }
      navigate('/admin');
    } catch (error) {
      const detail = error instanceof Error && error.message ? error.message : '';
      notify(detail ? `${t('admin.form.error')}: ${detail}` : t('admin.form.error'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>;
  }

  if (isEdit && missing) {
    return <EmptyState title={t('book.notFound')} />;
  }

  return (
    <div>
      <DocumentTitle title={isEdit ? t('admin.form.editTitle') : t('admin.form.createTitle')} noindex />
      <Link to="/admin" className="text-sm font-semibold text-muted hover:text-ink">
        {t('admin.back')}
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-ink">
        {isEdit ? t('admin.form.editTitle') : t('admin.form.createTitle')}
      </h1>
      <div className="mt-8">
        <BookForm book={book} isSaving={saving} onSubmit={(payload) => void handleSubmit(payload)} />
      </div>
    </div>
  );
}
