import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Benefits } from '@/components/home/Benefits';
import { FeaturedBooks } from '@/components/home/FeaturedBooks';
import { FinalCta } from '@/components/home/FinalCta';
import { Hero } from '@/components/home/Hero';
import { ReadingPlanTeaser } from '@/components/home/ReadingPlanTeaser';
import { StartSteps } from '@/components/home/StartSteps';
import { useAuth } from '@/hooks/useAuth';

export function HomePage() {
  const { user, isLoading } = useAuth();
  const isGuest = !isLoading && !user;

  return (
    <>
      <DocumentTitle />
      <Hero />
      {isGuest ? <StartSteps /> : null}
      <FeaturedBooks />
      <Benefits />
      <ReadingPlanTeaser />
      {isGuest ? <FinalCta /> : null}
    </>
  );
}
