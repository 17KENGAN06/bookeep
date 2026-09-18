export type ReadingProgress = {
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastReadAt: string;
  maxPageReached?: number;
  completedAt?: string | null;
};

export type ReadingProgressMap = Record<string, ReadingProgress>;
