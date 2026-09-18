export type ReadingProgress = {
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastReadAt: string;
};

export type ReadingProgressMap = Record<string, ReadingProgress>;
