/**
 * VoiceHero Widget
 * 
 * A self-contained widget for playing voice intros.
 * Exposed as window.VoiceHero for control and testing.
 */
(function (window, document) {
  'use strict';

  /**
   * Bot Detection Function
   * Returns true if the widget should skip loading (bot, scraper, or test environment)
   * @returns {boolean} True if should skip loading
   */
  function shouldSkipLoading() {
    // Skip loading if not in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return true;
    }

    // Skip loading during tests (unit tests and e2e tests)
    const isTest =
      (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') ||
      (window.navigator?.userAgent?.includes('Playwright')) ||
      (window.navigator?.userAgent?.includes('HeadlessChrome'));

    if (isTest) {
      return true;
    }

    // Skip loading for bots, scrapers, and non-browser user agents
    const userAgent = window.navigator?.userAgent?.toLowerCase() || '';
    
    // Check for missing user agent (very suspicious)
    if (!userAgent) {
      return true;
    }
    
    // Check for known bot/scraper patterns (be very specific to avoid false positives)
    // Only match patterns that are very unlikely to appear in legitimate browsers
    const botPatterns = [
      '/bot', '/crawler', '/spider', '/scraper', // Require leading slash to avoid false matches
      'curl/', 'wget/', 'python-requests/', 'node-fetch/', 'axios/', 'go-http-client/',
      'java/', 'php/', 'ruby/', 'perl/',
      'googlebot/', 'bingbot/', 'slurp/', 'duckduckbot/',
      'chatgpt', 'claude', 'anthropic', 'openai',
      'headlesschrome', 'phantomjs'
    ];
    
    // Check if user agent contains any bot pattern (case-insensitive)
    const isBotOrScraper = botPatterns.some(pattern => {
      const lowerPattern = pattern.toLowerCase();
      return userAgent.includes(lowerPattern);
    });
    
    if (isBotOrScraper) {
      return true;
    }

    // Check for automation frameworks (more specific checks)
    const isAutomation =
      window.navigator?.webdriver === true ||
      userAgent.includes('selenium') ||
      userAgent.includes('puppeteer') ||
      userAgent.includes('playwright') ||
      userAgent.includes('webdriver');

    if (isAutomation) {
      return true;
    }

    // Check for missing critical browser APIs
    // Note: localStorage might be blocked in some privacy modes, so only check fetch and navigator
    if (!window.fetch || !window.navigator) {
      return true;
    }

    // Check for suspicious screen dimensions
    const screenWidth = window.screen?.width || 0;
    const screenHeight = window.screen?.height || 0;
    const isSuspiciousScreen =
      screenWidth === 0 ||
      screenHeight === 0 ||
      (screenWidth < 100 && screenHeight < 100) ||
      screenWidth > 10000 ||
      screenHeight > 10000;

    if (isSuspiciousScreen) {
      return true;
    }

    return false;
  }

  // Early exit if bot detected
  if (shouldSkipLoading()) {
    // Debug: Log why widget was skipped (remove in production if needed)
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('VoiceHero: Widget loading skipped (bot/scraper detected)');
    }
    return;
  }

  /**
   * Analytics Manager
   * Handles event tracking with real-time and batch fallback modes
   */
  class AnalyticsManager {
    constructor(config) {
      this.config = config;
      this.sessionId = this.getOrCreateSessionId();
      this.eventQueue = [];
      this.isRealTimeMode = true;
      this.batchInterval = null;
      this.currentSegment = null;
      this.isBot = this.detectBot();

      // Start batch interval as fallback
      this.startBatchInterval();

      // Note: setupUnloadListener will be called from VoiceHeroWidget with widget instance
    }

    /**
     * Detects if the current environment is a bot/scraper.
     * Provides defense-in-depth in case bot detection is bypassed during initialization.
     * @returns {boolean} True if bot detected
     */
    detectBot() {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return true;
      }

      const userAgent = window.navigator?.userAgent?.toLowerCase() || '';
      return (
        !userAgent ||
        userAgent.includes('bot') ||
        userAgent.includes('crawler') ||
        userAgent.includes('spider') ||
        userAgent.includes('scraper') ||
        userAgent.includes('curl') ||
        userAgent.includes('wget') ||
        userAgent.includes('python') ||
        userAgent.includes('node-fetch') ||
        userAgent.includes('axios') ||
        userAgent.includes('go-http-client') ||
        userAgent.includes('java/') ||
        userAgent.includes('php') ||
        userAgent.includes('ruby') ||
        userAgent.includes('perl') ||
        userAgent.includes('googlebot') ||
        userAgent.includes('bingbot') ||
        userAgent.includes('chatgpt') ||
        userAgent.includes('claude') ||
        userAgent.includes('anthropic') ||
        userAgent.includes('openai') ||
        window.navigator?.webdriver === true ||
        !window.navigator?.cookieEnabled
      );
    }

    /**
     * Sets up a listener to flush the event queue when the page is unloaded or hidden.
     * Also tracks abandoned audio playback if user leaves before completion.
     * Uses navigator.sendBeacon for reliable delivery.
     */
    setupUnloadListener(widgetInstance) {
      const flush = () => {
        // Track abandoned audio if playing
        if (widgetInstance && widgetInstance.state.audio && widgetInstance.state.isPlaying) {
          const audio = widgetInstance.state.audio;
          if (audio.duration && audio.currentTime > 0) {
            const listeningDuration = audio.currentTime;
            const completionRate = (listeningDuration / audio.duration) * 100;
            
            const abandonedEvent = {
              sessionId: this.sessionId,
              eventType: 'audio.abandoned',
              timestamp: Date.now(),
              projectId: this.config.siteId,
              segmentType: this.currentSegment?.type || 'default',
              segmentId: this.currentSegment?.id || 'default',
              audioVersion: this.currentSegment?.version ? `v${this.currentSegment.version}` : 'v1',
              scriptVersion: this.currentSegment?.version?.toString() || '1',
              audioUrl: this.currentSegment?.audioUrl,
              metadata: {
                listeningDuration: listeningDuration,
                completionRate: Math.round(completionRate * 100) / 100,
                audioDuration: audio.duration,
              },
              userContext: this.getContext(),
            };

            // Send abandoned event via beacon
            const blob = new Blob([JSON.stringify({ event: abandonedEvent })], { type: 'application/json' });
            navigator.sendBeacon(`${this.config.apiBase}/api/analytics`, blob);
          }
        }

        // Flush queued events
        if (this.eventQueue.length > 0) {
          const events = [...this.eventQueue];
          this.eventQueue = [];
          const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
          navigator.sendBeacon(`${this.config.apiBase}/api/analytics`, blob);
        }
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          flush();
        }
      });

      // Fallback for older browsers
      window.addEventListener('pagehide', flush);
    }

    /**
     * Retrieves or creates a persistent session ID.
     * Falls back to a temporary ID if localStorage is blocked.
     * @returns {string} The session ID
     */
    getOrCreateSessionId() {
      try {
        let sessionId = localStorage.getItem('vh-session-id');
        if (!sessionId) {
          sessionId = 'vh-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('vh-session-id', sessionId);
        }
        return sessionId;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Fallback if localStorage is blocked
        return 'vh-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
    }

    /**
     * Collects user context information including device type, screen resolution, and UTM params.
     * @returns {Object} Context object
     */
    getContext() {
      return {
        deviceType: this.getDeviceType(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: window.screen.width + 'x' + window.screen.height,
        referrer: document.referrer,
        pageUrl: window.location.href,
        pageTitle: document.title,
        ...this.getUTMParams(),
      };
    }

    /**
     * Determines the device type based on user agent.
     * @returns {'mobile' | 'tablet' | 'desktop'} Device type
     */
    getDeviceType() {
      const ua = navigator.userAgent.toLowerCase();
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
      }
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
      }
      return 'desktop';
    }

    /**
     * Extracts UTM parameters from the URL.
     * @returns {Object} Object containing utmSource, utmMedium, utmCampaign
     */
    getUTMParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
      };
    }

    /**
     * Sets the current segment information for tracking.
     * @param {Object} segment - The segment object
     */
    setSegment(segment) {
      this.currentSegment = segment;
    }

    /**
     * Tracks an analytics event.
     * @param {string} eventType - The type of event (e.g., 'audio.play')
     * @param {Object} [metadata={}] - Additional metadata for the event
     */
    track(eventType, metadata = {}) {
      // Skip tracking if bot detected
      if (this.isBot) {
        return;
      }

      const event = {
        sessionId: this.sessionId,
        eventType,
        timestamp: Date.now(),
        projectId: this.config.siteId,
        segmentType: this.currentSegment?.type || 'default',
        segmentId: this.currentSegment?.id || 'default',
        audioVersion: this.currentSegment?.version ? `v${this.currentSegment.version}` : 'v1',
        scriptVersion: this.currentSegment?.version?.toString() || '1',
        audioUrl: this.currentSegment?.audioUrl,
        metadata,
        userContext: this.getContext(),
      };

      if (this.isRealTimeMode) {
        this.sendEvent(event);
      } else {
        this.queueEvent(event);
      }
    }

    /**
     * Sends a single event immediately. Switches to batch mode on failure.
     * @param {Object} event - The event to send
     */
    async sendEvent(event) {
      try {
        const response = await fetch(`${this.config.apiBase}/api/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event }),
        });

        if (!response.ok) {
          throw new Error('Analytics error');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.warn('VoiceHero Analytics: Failed to send event, switching to batch mode');
        this.isRealTimeMode = false;
        this.queueEvent(event);
      }
    }

    /**
     * Queues an event for batch sending. Caps queue size at 100.
     * @param {Object} event - The event to queue
     */
    queueEvent(event) {
      // Cap queue size to prevent memory leaks
      if (this.eventQueue.length >= 100) {
        // Drop oldest event
        this.eventQueue.shift();
      }

      this.eventQueue.push(event);

      // If queue is getting full, send immediately
      if (this.eventQueue.length >= 50) {
        this.flushQueue();
      }
    }

    /**
     * Flushes the event queue to the server.
     * Restores real-time mode on success.
     */
    async flushQueue() {
      if (this.eventQueue.length === 0) return;

      const events = [...this.eventQueue];
      this.eventQueue = [];

      try {
        const response = await fetch(`${this.config.apiBase}/api/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });

        if (response.ok) {
          // Back to real-time mode if batch succeeded
          this.isRealTimeMode = true;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Re-queue events if send failed
        this.eventQueue = [...events, ...this.eventQueue];
        // Re-enforce cap after re-queueing
        if (this.eventQueue.length > 100) {
          this.eventQueue = this.eventQueue.slice(-100);
        }
        console.warn('VoiceHero Analytics: Batch send failed');
      }
    }

    /**
     * Starts the interval for batch sending (every 10 seconds).
     */
    startBatchInterval() {
      // Send queued events every 10 seconds
      this.batchInterval = setInterval(() => {
        if (!this.isRealTimeMode) {
          this.flushQueue();
        }
      }, 10000);
    }
  }

  class VoiceHeroWidget {
    constructor() {
      this.config = {
        scriptUrl: document.currentScript ? document.currentScript.src : '',
        siteId: document.currentScript ? document.currentScript.getAttribute('data-site-id') : null,
        apiBase: document.currentScript ? document.currentScript.getAttribute('data-api-url') : '',
      };

      if (!this.config.apiBase && this.config.scriptUrl) {
        try {
          this.config.apiBase = new URL(this.config.scriptUrl).origin;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          console.error('VoiceHero: Invalid script URL');
        }
      }

      this.state = {
        audio: null,
        isPlaying: false,
        data: null,
        hasInteracted: false,
      };

      this.elements = {
        container: null,
        bubble: null,
        player: null,
        playBtn: null,
        progressBar: null,
      };

      // Initialize analytics
      this.analytics = new AnalyticsManager(this.config);
      
      // Pass widget instance to analytics for unload tracking
      this.analytics.setupUnloadListener(this);

      this.init();
    }

    init() {
      if (!this.config.siteId) {
        console.error('VoiceHero: data-site-id is required');
        return;
      }

      this.injectStyles();
      this.createDOM();
      this.fetchData();

      // Track widget loaded
      this.analytics.track('widget.loaded', {
        loadTime: performance.now(),
      });
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
                .vh-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 10px;
                }
                .vh-bubble {
                    background: #000;
                    color: #fff;
                    padding: 12px 20px;
                    border-radius: 50px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 14px;
                    font-weight: 500;
                    transform-origin: bottom right;
                }
                .vh-bubble:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
                }
                .vh-player {
                    background: #fff;
                    border: 1px solid #eee;
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    width: 320px;
                    display: none;
                    flex-direction: column;
                    gap: 16px;
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .vh-player.active {
                    display: flex;
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                .vh-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .vh-title {
                    font-weight: 700;
                    font-size: 16px;
                    color: #111;
                }
                .vh-close {
                    cursor: pointer;
                    opacity: 0.4;
                    padding: 4px;
                    transition: opacity 0.2s;
                }
                .vh-close:hover {
                    opacity: 1;
                }
                .vh-transcript {
                    font-size: 14px;
                    color: #555;
                    line-height: 1.5;
                    max-height: 120px;
                    overflow-y: auto;
                    padding-right: 8px;
                    scrollbar-width: thin;
                }
                .vh-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #f5f5f5;
                    padding: 12px;
                    border-radius: 12px;
                }
                .vh-play-btn {
                    background: #000;
                    color: #fff;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.1s;
                    flex-shrink: 0;
                }
                .vh-play-btn:active {
                    transform: scale(0.95);
                }
                .vh-progress-container {
                    flex: 1;
                    height: 4px;
                    background: #ddd;
                    border-radius: 2px;
                    overflow: hidden;
                    position: relative;
                }
                .vh-progress-bar {
                    width: 0%;
                    height: 100%;
                    background: #000;
                    transition: width 0.1s linear;
                }
                /* Wave Animation */
                .vh-wave {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    height: 16px;
                    margin-left: auto;
                }
                .vh-bar {
                    width: 3px;
                    background: #000;
                    border-radius: 2px;
                    animation: vh-wave 1s ease-in-out infinite;
                }
                @keyframes vh-wave {
                    0%, 100% { height: 4px; }
                    50% { height: 16px; }
                }
                      .vh-mic-btn {
                    background: #f0f0f0;
                    color: #000;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .vh-mic-btn:hover {
                    background: #e0e0e0;
                }
                .vh-mic-btn.recording {
                    background: #ff4444;
                    color: #fff;
                    animation: vh-pulse 1.5s infinite;
                }
                .vh-mic-btn.processing {
                    background: #f0f0f0;
                    color: #999;
                    cursor: wait;
                }
                @keyframes vh-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(255, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
                }
            `;
      document.head.appendChild(style);
    }

    createDOM() {
      this.elements.container = document.createElement('div');
      this.elements.container.className = 'vh-widget';
      document.body.appendChild(this.elements.container);
    }

    getContext() {
      const params = new URLSearchParams(window.location.search);
      return {
        siteId: this.config.siteId,
        lang: navigator.language,
        isReturning: document.cookie.includes('vh_returning=true'),
        utmSource: params.get('utm_source'),
        pageUrl: window.location.href.split('?')[0],
      };
    }

    async fetchData() {
      const context = this.getContext();
      const query = new URLSearchParams(context).toString();

      try {
        const res = await fetch(`${this.config.apiBase}/api/playback?${query}`);
        if (!res.ok) return;

        this.state.data = await res.json();

        // Check if voice is disabled for this page
        if (this.state.data.voiceDisabled) {
          console.log('VoiceHero: Voice is disabled for this page');
          return;
        }

        // Set segment for analytics tracking
        if (this.state.data.segments && this.state.data.segments.length > 0) {
          this.analytics.setSegment(this.state.data.segments[0]);
        }

        this.render();

        // Mark as returning visitor
        document.cookie = "vh_returning=true; path=/; max-age=31536000";
      } catch (e) {
        console.error('VoiceHero Error:', e);
      }
    }

    render() {
      if (!this.state.data) return;

      // Bubble
      this.elements.bubble = document.createElement('div');
      this.elements.bubble.className = 'vh-bubble';
      this.elements.bubble.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                <span>Hear a quick intro</span>
            `;
      this.elements.bubble.onclick = () => this.expand();

      // Player
      this.elements.player = document.createElement('div');
      this.elements.player.className = 'vh-player';
      this.elements.player.innerHTML = `
                <div class="vh-header">
                    <div class="vh-title">${this.state.data.label || 'Overview'}</div>
                    <div class="vh-close">✕</div>
                </div>
                <div class="vh-transcript">${this.state.data.transcript}</div>
                <div class="vh-controls">
                    <button class="vh-play-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                    <div class="vh-progress-container">
                        <div class="vh-progress-bar"></div>
                    </div>
                    <button class="vh-mic-btn" title="Ask a question">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    </button>
                </div>
            `;

      this.elements.playBtn = this.elements.player.querySelector('.vh-play-btn');
      this.elements.micBtn = this.elements.player.querySelector('.vh-mic-btn');
      this.elements.progressBar = this.elements.player.querySelector('.vh-progress-bar');
      this.elements.closeBtn = this.elements.player.querySelector('.vh-close');
      this.elements.transcript = this.elements.player.querySelector('.vh-transcript');

      this.elements.playBtn.onclick = () => this.togglePlay();
      this.elements.micBtn.onclick = () => this.toggleRecording();
      this.elements.closeBtn.onclick = () => this.collapse();

      this.elements.container.appendChild(this.elements.bubble);
      this.elements.container.appendChild(this.elements.player);

      // Initialize Audio
      this.playAudio(this.state.data.audioUrl);
    }

    playAudio(url) {
      if (this.state.audio) {
        this.state.audio.pause();
        this.state.audio = null;
      }

      this.state.audio = new Audio(url);
      this.progressMilestones = { 25: false, 50: false, 75: false, 100: false };
      this.playStartTime = null;
      this.audioStartTime = 0;

      // Wait for audio metadata to load before tracking
      this.state.audio.addEventListener('loadedmetadata', () => {
        // Track audio.play event with duration
        this.analytics.track('audio.play', {
          audioDuration: this.state.audio.duration || 0,
        });
      });

      this.state.audio.ontimeupdate = () => {
        this.updateProgress();
        this.trackProgressMilestones();
      };

      this.state.audio.onended = () => {
        this.state.isPlaying = false;
        this.updatePlayBtn();
        
        // Track completion with listening duration
        const listeningDuration = this.state.audio.duration || 0;
        const completionRate = 100;
        
        this.analytics.track('audio.complete', {
          listeningDuration: listeningDuration,
          completionRate: completionRate,
          audioDuration: this.state.audio.duration || 0,
        });
        
        // Reset tracking state
        this.playStartTime = null;
        this.audioStartTime = 0;
      };
    }

    trackProgressMilestones() {
      if (!this.state.audio) return;

      const progress = (this.state.audio.currentTime / this.state.audio.duration) * 100;

      [25, 50, 75].forEach(milestone => {
        if (progress >= milestone && !this.progressMilestones[milestone]) {
          this.analytics.track(`audio.progress.${milestone}`, {
            currentTime: this.state.audio.currentTime,
          });
          this.progressMilestones[milestone] = true;
        }
      });
    }

    expand() {
      // Track bubble click
      this.analytics.track('bubble.clicked', {});

      this.elements.bubble.style.display = 'none';
      this.elements.player.classList.add('active');
      this.togglePlay();
    }

    collapse() {
      if (this.state.audio && this.state.isPlaying) {
        // Track pause when collapsing widget
        const listeningDuration = this.state.audio.currentTime || 0;
        const audioDuration = this.state.audio.duration || 0;
        const completionRate = audioDuration > 0 
          ? Math.round((listeningDuration / audioDuration) * 100 * 100) / 100 
          : 0;
        
        this.analytics.track('audio.pause', {
          listeningDuration: listeningDuration,
          completionRate: completionRate,
          audioDuration: audioDuration,
        });
        
        this.state.audio.pause();
      }
      this.state.isPlaying = false;
      this.elements.player.classList.remove('active');

      // Small delay to allow transition to finish before showing bubble
      setTimeout(() => {
        this.elements.bubble.style.display = 'flex';
      }, 300);
    }

    togglePlay() {
      if (!this.state.audio) return;

      if (this.state.isPlaying) {
        // Pausing - track listening duration
        const listeningDuration = this.state.audio.currentTime || 0;
        const audioDuration = this.state.audio.duration || 0;
        const completionRate = audioDuration > 0 
          ? Math.round((listeningDuration / audioDuration) * 100 * 100) / 100 
          : 0;
        
        this.analytics.track('audio.pause', {
          listeningDuration: listeningDuration,
          completionRate: completionRate,
          audioDuration: audioDuration,
        });
        
        this.state.audio.pause();
      } else {
        // Starting to play - track start time
        this.playStartTime = Date.now();
        this.audioStartTime = this.state.audio.currentTime || 0;
        this.state.audio.play();
      }
      this.state.isPlaying = !this.state.isPlaying;
      this.updatePlayBtn();
    }

    async toggleRecording() {
      if (this.state.isRecording) {
        this.stopRecording();
      } else {
        await this.startRecording();
      }
    }

    async startRecording() {
      try {
        this.conversationStartTime = Date.now();

        // Track conversation start
        this.analytics.track('conversation.start', {});

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/mp3' });
          await this.processConversation(audioBlob);
        };

        this.mediaRecorder.start();
        this.state.isRecording = true;
        this.updateMicBtn();

        // Pause playback if playing
        if (this.state.isPlaying) this.togglePlay();

      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please allow permissions.');
      }
    }

    stopRecording() {
      if (this.mediaRecorder && this.state.isRecording) {
        this.mediaRecorder.stop();
        this.state.isRecording = false;
        this.updateMicBtn();
      }
    }

    async processConversation(audioBlob) {
      this.elements.micBtn.classList.add('processing');
      this.elements.transcript.innerText = "Processing...";

      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('siteId', this.config.siteId);

      try {
        const res = await fetch(`${this.config.apiBase}/api/conversation`, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) throw new Error('API Error');

        const data = await res.json();

        // Show confirmation message with transcription
        if (data.transcription && data.transcription.trim()) {
          this.elements.transcript.innerText = `"${data.transcription}"\n\n${data.message || 'Thank you for your feedback!'}`;
        } else {
          this.elements.transcript.innerText = data.message || 'Thank you for your feedback!';
        }

        // Track interaction saved
        this.analytics.track('interaction.saved', {
          hasTranscription: !!data.transcription,
        });

        // Do NOT play audio response - just show confirmation

      } catch (error) {
        console.error('Conversation Error:', error);
        this.elements.transcript.innerText = "Sorry, I couldn't process that. Please try again.";
      } finally {
        this.elements.micBtn.classList.remove('processing');
      }
    }

    updateMicBtn() {
      if (this.state.isRecording) {
        this.elements.micBtn.classList.add('recording');
        this.elements.micBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>';
      } else {
        this.elements.micBtn.classList.remove('recording');
        this.elements.micBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
      }
    }

    updatePlayBtn() {
      this.elements.playBtn.innerHTML = this.state.isPlaying
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }

    updateProgress() {
      if (!this.state.audio) return;
      const progress = (this.state.audio.currentTime / this.state.audio.duration) * 100;
      this.elements.progressBar.style.width = `${progress}%`;
    }
  }

  // Expose to window for testing
  window.VoiceHeroWidget = VoiceHeroWidget;
  window.VoiceHero = new VoiceHeroWidget();

})(window, document);
