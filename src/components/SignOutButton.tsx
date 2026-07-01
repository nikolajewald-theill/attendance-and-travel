'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded hover:bg-slate-100"
    >
      Log ud
    </button>
  );
}
