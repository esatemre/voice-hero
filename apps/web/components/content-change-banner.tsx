'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentChangeBannerProps {
    onRegenerate: () => void;
    loading?: boolean;
}

export default function ContentChangeBanner({
    onRegenerate,
    loading = false,
}: ContentChangeBannerProps) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
                <span className="font-medium">Page content has changed.</span>{' '}
                <span className="text-amber-700">
                    Consider regenerating the script to keep it aligned with the latest copy.
                </span>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={loading}
                className="border-amber-300 bg-white hover:bg-amber-100"
            >
                <RefreshCw className={`mr-1 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Regenerate
            </Button>
        </div>
    );
}
