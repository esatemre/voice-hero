import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AnalyticsDashboard from '../../app/dashboard/[projectId]/analytics/page';

// Mock dependencies
vi.mock('next/navigation', () => ({
    useParams: () => ({ projectId: 'proj-123' }),
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/ui/card', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CardHeader: ({ children }: any) => <div>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CardTitle: ({ children }: any) => <div>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CardContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock Recharts since it uses ResizeObserver which isn't in JSDOM
vi.mock('recharts', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LineChart: ({ children }: any) => <div>{children}</div>,
    Line: () => <div>Line</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    Tooltip: () => <div>Tooltip</div>,
    CartesianGrid: () => <div>Grid</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BarChart: ({ children }: any) => <div>{children}</div>,
    Bar: () => <div>Bar</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: () => <div>Pie</div>,
    Cell: () => <div>Cell</div>,
}));

// Mock fetch
global.fetch = vi.fn();

describe('AnalyticsDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render loading state initially', () => {
        render(<AnalyticsDashboard />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should fetch and display analytics stats', async () => {
        const mockStats = {
            totalPlays: 150,
            uniqueVisitors: 100,
            completions: 75,
            listenThroughRate: 50,
            conversationStarts: 20,
            conversationRate: 13,
            avgResponseTime: 1200,
            segmentBreakdown: {
                new_visitor: { plays: 100, completions: 40, engagementRate: 40 },
                returning: { plays: 50, completions: 35, engagementRate: 70 },
            },
            versionBreakdown: {
                v1: { plays: 80, completions: 30, engagementRate: 37 },
                v2: { plays: 70, completions: 45, engagementRate: 64 },
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockStats,
        });

        render(<AnalyticsDashboard />);

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        // Check KPI cards
        expect(screen.getByText('150')).toBeInTheDocument(); // Total Plays
        expect(screen.getByText('100')).toBeInTheDocument(); // Unique Visitors
        expect(screen.getByText('50%')).toBeInTheDocument(); // Listen Rate
        expect(screen.getByText('1.2s')).toBeInTheDocument(); // Avg Response
    });

    it('should handle API errors gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockRejectedValue(new Error('API Error'));

        render(<AnalyticsDashboard />);

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    it('should allow date range filtering', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        render(<AnalyticsDashboard />);

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        // Verify date picker or buttons exist
        expect(screen.getByText(/last 7 days/i)).toBeInTheDocument();
        expect(screen.getByText(/last 30 days/i)).toBeInTheDocument();
    });
});
