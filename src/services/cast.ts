import { SmartHomeDevice } from '../types';

declare global {
  interface Window {
    chrome: {
      cast: {
        initialize: (apiConfig: any, successCallback: () => void, errorCallback: (error: Error) => void) => void;
        SessionRequest: new (appId: string) => any;
        ApiConfig: new (sessionRequest: any, sessionListener: (session: any) => void, receiverListener: (availability: string) => void, autoJoinPolicy?: string, defaultActionPolicy?: string) => any;
        isAvailable: boolean;
        requestSession: (successCallback: (session: any) => void, errorCallback: (error: Error) => void) => void;
      };
    };
  }
}

class CastService {
  private static instance: CastService;
  private session: any = null;
  private mediaSession: any = null;
  private isInitialized = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
        if (isAvailable) {
          this.initializeCastApi();
        }
      };
    }
  }

  public static getInstance(): CastService {
    if (!CastService.instance) {
      CastService.instance = new CastService();
    }
    return CastService.instance;
  }

  private initializeCastApi(): void {
    const sessionRequest = new window.chrome.cast.SessionRequest(
      'CC1AD845' // Default Media Receiver App ID
    );

    const apiConfig = new window.chrome.cast.ApiConfig(
      sessionRequest,
      (session) => this.sessionListener(session),
      (availability) => this.receiverListener(availability),
      'origin_scoped'
    );

    window.chrome.cast.initialize(
      apiConfig,
      () => {
        this.isInitialized = true;
        console.log('Cast API initialized');
      },
      (error) => console.error('Cast API initialization error:', error)
    );
  }

  private sessionListener(session: any): void {
    this.session = session;
    if (session.media && session.media.length > 0) {
      this.mediaSession = session.media[0];
    }

    session.addMediaListener((media: any) => {
      this.mediaSession = media;
    });

    session.addUpdateListener(() => this.sessionUpdateListener());
  }

  private sessionUpdateListener(): void {
    if (this.session.status === 'stopped') {
      this.session = null;
      this.mediaSession = null;
    }
  }

  private receiverListener(availability: string): void {
    if (availability === 'available') {
      console.log('Cast devices are available');
    }
  }

  public async togglePlayback(device: SmartHomeDevice): Promise<void> {
    if (!device.castingStatus || !this.mediaSession) return;

    try {
      if (device.castingStatus.isPlaying) {
        await this.mediaSession.pause(null);
      } else {
        await this.mediaSession.play(null);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }

  public async seekTo(device: SmartHomeDevice, time: number): Promise<void> {
    if (!this.mediaSession) return;

    try {
      const request = new chrome.cast.media.SeekRequest();
      request.currentTime = time;
      await this.mediaSession.seek(request);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }

  public isConnected(): boolean {
    return !!this.session;
  }

  public getCurrentSession(): any {
    return this.session;
  }
}

export const castService = CastService.getInstance();