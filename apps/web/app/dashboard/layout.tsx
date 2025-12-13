import Link from 'next/link';
import { Volume2, Home, LayoutDashboard, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Force SSR for dashboard routes so server-only env vars are read at runtime, not during build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-background to-muted/20">
            <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 shadow-sm">
                <nav className="flex flex-row items-center gap-2 md:gap-5 lg:gap-6">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-lg font-semibold md:text-base group"
                    >
                        <div className="rounded-lg bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                            <Volume2 className="h-5 w-5 text-primary" />
                        </div>
                        <span className="hidden sm:inline font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            VoiceHero
                        </span>
                    </Link>
                    {/* Mobile: Show icons, Desktop: Show text */}
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center min-w-[40px] min-h-[40px] p-2 rounded-lg text-foreground transition-colors hover:text-primary hover:bg-muted md:min-w-0 md:min-h-0 md:p-0 md:bg-transparent md:hover:bg-transparent"
                        title="Dashboard"
                    >
                        <LayoutDashboard className="h-5 w-5 md:hidden" />
                        <span className="hidden md:inline font-medium">Dashboard</span>
                    </Link>
                    <Link
                        href="/dashboard/architecture"
                        className="flex items-center justify-center min-w-[40px] min-h-[40px] p-2 rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-muted md:min-w-0 md:min-h-0 md:p-0 md:bg-transparent md:hover:bg-transparent"
                        title="Architecture"
                    >
                        <Network className="h-5 w-5 md:hidden" />
                        <span className="hidden md:inline">Architecture</span>
                    </Link>
                </nav>
                <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                    <div className="ml-auto flex items-center gap-4">
                        <Link href="/">
                            <Button variant="outline" size="sm">
                                <Home className="h-4 w-4" />
                            </Button>
                        </Link>
                        {/* User menu placeholder */}
                    </div>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {children}
            </main>
        </div>
    );
}
