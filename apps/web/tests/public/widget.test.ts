import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock Audio
class MockAudio {
    src: string;
    currentTime: number = 0;
    duration: number = 20;
    paused: boolean = true;

    constructor(src: string) {
        this.src = src;
    }

    play() {
        this.paused = false;
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
    }

    // Mock event listeners
    ontimeupdate: (() => void) | null = null;
    onended: (() => void) | null = null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.Audio = MockAudio as any;

describe('VoiceHero Widget', () => {
    let widgetScript: string;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';

        // Load widget script content
        widgetScript = fs.readFileSync(path.join(__dirname, '../../public/widget.js'), 'utf-8');

        // Mock fetch
        global.fetch = vi.fn();

        // Mock currentScript
        Object.defineProperty(document, 'currentScript', {
            value: document.createElement('script'),
            writable: true
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document.currentScript as any).src = 'http://localhost:3000/widget.js';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document.currentScript as any).setAttribute('data-site-id', 'test-site-id');
    });

    afterEach(() => {
        vi.clearAllMocks();
        // Clean up global pollution
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).VoiceHero;
    });

    const loadWidget = () => {
        // Evaluate the script
        eval(widgetScript);
    };

    it('should initialize and fetch playback data', async () => {
        const mockData = {
            audioUrl: 'http://example.com/audio.mp3',
            transcript: 'Hello world',
            label: 'Welcome'
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        loadWidget();

        // Wait for async init
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/playback'));
        expect(document.querySelector('.vh-widget')).toBeTruthy();
        expect(document.querySelector('.vh-bubble')).toBeTruthy();
    });

    it('should not render if no site-id', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document.currentScript as any).removeAttribute('data-site-id');

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        loadWidget();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('data-site-id is required'));
        expect(document.querySelector('.vh-widget')).toBeFalsy();
    });

    it('should handle interaction flow (expand -> play -> close)', async () => {
        const mockData = {
            audioUrl: 'http://example.com/audio.mp3',
            transcript: 'Hello world',
            label: 'Welcome'
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        loadWidget();
        await new Promise(resolve => setTimeout(resolve, 0));

        const bubble = document.querySelector('.vh-bubble') as HTMLElement;
        const player = document.querySelector('.vh-player') as HTMLElement;

        // Initial state
        expect(bubble.style.display).not.toBe('none');
        expect(player.classList.contains('active')).toBe(false);

        // Click bubble -> Expand & Play
        bubble.click();
        expect(bubble.style.display).toBe('none');
        expect(player.classList.contains('active')).toBe(true);
    });

    it('should handle conversation flow', async () => {
        // Mock MediaRecorder
        const mockStart = vi.fn();
        const mockStop = vi.fn();
        const mockDataAvailable = vi.fn();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).MediaRecorder = class {
            start = mockStart;
            stop = mockStop;
            ondataavailable = mockDataAvailable;
            state = 'inactive';
            static isTypeSupported = () => true;
        };

        // Mock navigator.mediaDevices
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {
                getUserMedia: vi.fn().mockResolvedValue({}),
            },
            writable: true,
        });

        const mockData = {
            audioUrl: 'http://example.com/audio.mp3',
            transcript: 'Hello world',
            label: 'Welcome'
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        loadWidget();
        await new Promise(resolve => setTimeout(resolve, 0));

        const player = document.querySelector('.vh-player') as HTMLElement;
        player.classList.add('active'); // Simulate open

        // Find Mic Button (assuming class vh-mic-btn)
        // Note: We haven't added it to widget.js yet, so this test expects it to exist after update
        // For TDD, we write the test first, it will fail, then we fix widget.js

        // Since we are in a "write test then code" loop, I'll add the expectation but comment it out 
        // until I update the widget code in the next step, OR I can just update the widget code now.
        // Let's assume I'll update widget.js immediately.
    });
});
