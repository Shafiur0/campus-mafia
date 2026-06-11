import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FriendsPageClient } from '@/components/game/FriendsPageClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PhaseBackground } from '@/components/ui/PhaseBackground';

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen text-white relative flex flex-col justify-between overflow-x-hidden">
      <PhaseBackground phase="LOBBY" />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between z-10 max-w-7xl w-full mx-auto border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono uppercase bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
          <h1 className="text-xl font-display font-bold text-white tracking-wider">
            CAMPUS ASSOCIATES
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-10 z-10">
        <FriendsPageClient />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/[0.05] text-[10px] font-mono text-textMuted uppercase tracking-widest z-10">
        © 2026 Campus Mafia. Built for university corridors. Developed by{' '}
        <a
          href="https://shafiur-rahaman-shafim.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#22D3EE] hover:underline normal-case"
        >
          Shafiur Rahman Shafim
        </a>
      </footer>
    </div>
  );
}
