// Singleton manager for YouTube IFrame API audio playback

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export function extractYouTubePlaylistId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Standard YouTube playlist IDs typically begin with PL, UU, LL, RD, or OLAK5uy_
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^(?:PL|UU|LL|RD|OLAK5uy_)[\w-]{10,}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export class YouTubeManager {
  private static instance: YouTubeManager;
  private player: any = null;
  private isReady = false;
  private pendingVideoId: string | null = null;
  private pendingPlaylistId: string | null = null;
  private stateChangeCallbacks: Array<(state: { isPlaying: boolean; title?: string }) => void> = [];
  public isYtActive = false;
  public isHardwareMuted = false;

  private constructor() {
    this.initScript();
  }

  public static getInstance(): YouTubeManager {
    if (!YouTubeManager.instance) {
      YouTubeManager.instance = new YouTubeManager();
    }
    return YouTubeManager.instance;
  }

  private initScript() {
    if (typeof window === 'undefined') return;

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        this.createPlayer();
      };
    } else if ((window as any).YT && (window as any).YT.Player) {
      this.createPlayer();
    }
  }

  private createPlayer() {
    if (this.player) return;

    let container = document.getElementById('yt-audio-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'yt-audio-container';
      container.style.position = 'fixed';
      container.style.bottom = '-100px';
      container.style.right = '-100px';
      container.style.width = '10px';
      container.style.height = '10px';
      container.style.opacity = '0.01';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-999';
      document.body.appendChild(container);
    }

    const placeholder = document.createElement('div');
    placeholder.id = 'yt-iframe-slot';
    container.appendChild(placeholder);

    this.player = new (window as any).YT.Player('yt-iframe-slot', {
      height: '10',
      width: '10',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: () => {
          this.isReady = true;
          if (this.pendingPlaylistId) {
            const pid = this.pendingPlaylistId;
            this.pendingPlaylistId = null;
            this.loadPlaylist(pid);
          } else if (this.pendingVideoId) {
            const vid = this.pendingVideoId;
            this.pendingVideoId = null;
            this.loadVideo(vid);
          }
        },
        onStateChange: (event: any) => {
          // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
          const isPlaying = event.data === 1;
          let trackTitle: string | undefined = undefined;
          try {
            if (this.player && typeof this.player.getVideoData === 'function') {
              const data = this.player.getVideoData();
              if (data && data.title) {
                trackTitle = data.title;
              }
            }
          } catch {}
          this.notifyStateChange(isPlaying, trackTitle);
        },
        onError: (err: any) => {
          console.warn("YouTube Player error:", err);
          this.notifyStateChange(false);
        }
      }
    });
  }

  public onStateChange(cb: (state: { isPlaying: boolean; title?: string }) => void) {
    this.stateChangeCallbacks.push(cb);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(c => c !== cb);
    };
  }

  private notifyStateChange(isPlaying: boolean, title?: string) {
    this.stateChangeCallbacks.forEach(cb => cb({ isPlaying, title }));
  }

  public setHardwareMute(mute: boolean) {
    this.isHardwareMuted = mute;
    if (this.player && this.isReady) {
      try {
        if (mute) {
          this.player.mute();
          this.player.setVolume(0);
          this.player.pauseVideo();
        } else {
          this.player.unMute();
        }
      } catch (e) {}
    }
  }

  public loadVideo(videoId: string) {
    this.isYtActive = true;
    if (!this.isReady || !this.player) {
      this.pendingVideoId = videoId;
      return;
    }

    try {
      this.player.loadVideoById(videoId);
      if (!this.isHardwareMuted) {
        this.player.playVideo();
      } else {
        this.player.mute();
        this.player.pauseVideo();
      }
    } catch (e) {
      console.error("Failed to load video in YT Player", e);
    }
  }

  public loadPlaylist(playlistId: string) {
    this.isYtActive = true;
    if (!this.isReady || !this.player) {
      this.pendingPlaylistId = playlistId;
      return;
    }

    try {
      this.player.loadPlaylist({
        list: playlistId,
        listType: 'playlist',
        index: 0,
        startSeconds: 0
      });
      if (!this.isHardwareMuted) {
        this.player.playVideo();
      } else {
        this.player.mute();
        this.player.pauseVideo();
      }
    } catch (e) {
      console.error("Failed to load playlist in YT Player", e);
    }
  }

  public nextVideo() {
    if (this.player && this.isReady && this.isYtActive) {
      try {
        this.player.nextVideo();
      } catch (e) {}
    }
  }

  public previousVideo() {
    if (this.player && this.isReady && this.isYtActive) {
      try {
        this.player.previousVideo();
      } catch (e) {}
    }
  }

  public play() {
    if (this.isHardwareMuted) return;
    if (this.player && this.isReady && this.isYtActive) {
      try {
        this.player.playVideo();
      } catch (e) {}
    }
  }

  public pause() {
    if (this.player && this.isReady && this.isYtActive) {
      try {
        this.player.pauseVideo();
      } catch (e) {}
    }
  }

  public stop() {
    this.isYtActive = false;
    this.pendingVideoId = null;
    if (this.player) {
      try {
        this.player.setVolume(0);
      } catch (e) {}
      try {
        this.player.pauseVideo();
      } catch (e) {}
      try {
        this.player.stopVideo();
      } catch (e) {}
    }
    this.notifyStateChange(false);
  }

  public setVolume(volume: number, attenuated: boolean = false) {
    if (this.player && this.isReady) {
      try {
        let vol = this.isHardwareMuted ? 0 : Math.round(Math.max(0, Math.min(1, volume)) * 100);
        if (!this.isHardwareMuted && attenuated) vol = Math.round(vol * 0.2);
        this.player.setVolume(vol);
      } catch (e) {}
    }
  }

  public seek(delta: number) {
    if (this.player && this.isReady && this.isYtActive) {
      try {
        const current = this.player.getCurrentTime() || 0;
        this.player.seekTo(Math.max(0, current + delta), true);
      } catch (e) {}
    }
  }

  public getCurrentTime(): number {
    if (this.player && this.isReady && this.isYtActive) {
      try {
        return this.player.getCurrentTime() || 0;
      } catch (e) {}
    }
    return 0;
  }
}
