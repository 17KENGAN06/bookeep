import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Benefits } from '@/components/home/Benefits';
import { FeaturedBooks } from '@/components/home/FeaturedBooks';
import { Hero } from '@/components/home/Hero';
import { ReadingPlanTeaser } from '@/components/home/ReadingPlanTeaser';

export function HomePage() {
  return (
    <>
      <DocumentTitle />
      <Hero />
      <FeaturedBooks />
      <Benefits />
      <ReadingPlanTeaser />
    </>
  );
}
