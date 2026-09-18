import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Benefits } from '@/components/home/Benefits';
import { FeaturedBooks } from '@/components/home/FeaturedBooks';
import { Hero } from '@/components/home/Hero';
import { HomeReadingPlan } from '@/components/home/HomeReadingPlan';

export function HomePage() {
  return (
    <>
      <DocumentTitle />
      <Hero />
      <HomeReadingPlan />
      <Benefits />
      <FeaturedBooks />
    </>
  );
}
