export type ReadingActivityRow = {
  bookId: string;
  date: string;
  pagesRead: number;
};

export type ReadingGoal = {
  date: string;
  targetPages: number;
  completedAt: string | null;
  celebratedAt: string | null;
};

export type ReadingAdvanceResult = {
  newPages: number;
  dailyTotal: number;
  target: number | null;
  justCompleted: boolean;
};

export type DayReadingState = {
  date: string;
  pagesRead: number;
  targetPages: number | null;
  completed: boolean;
};
