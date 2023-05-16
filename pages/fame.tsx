import Fame from '@/components/Fame';
import { useRouter } from 'next/router';

export default function FamePage() {
  const router = useRouter();
  return (
    <main className={`pt-4 flex w-full flex-col items-center`}>
      <Fame onBack={() => router.push('/')} />
    </main>
  );
}
