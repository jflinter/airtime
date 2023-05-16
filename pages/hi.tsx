import Info from '@/components/Info';
import { useRouter } from 'next/router';

export default function FamePage() {
  const router = useRouter();
  return (
    <main className={`pt-4 flex w-full flex-col items-center`}>
      <Info onBack={() => router.push('/')} />
    </main>
  );
}
