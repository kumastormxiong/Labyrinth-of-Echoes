import { MusicTrack, MUSIC_TRACKS } from '../constants';

class MusicService {
    private audioA: HTMLAudioElement;
    private audioB: HTMLAudioElement;
    private activePlayer: 'A' | 'B' = 'A';
    private currentTrack: MusicTrack | null = null;
    private fadeInterval: any = null;
    private maxVolume = 0.8;

    private previewAudio: HTMLAudioElement;

    constructor() {
        this.audioA = new Audio();
        this.audioB = new Audio();
        this.previewAudio = new Audio();
        this.audioA.loop = true;
        this.audioB.loop = true;
        this.audioA.preload = "auto";
        this.audioB.preload = "auto";
        this.audioA.volume = 0;
        this.audioB.volume = 0;
    }

    getRandomTrack(excludeIds: string[] = []): MusicTrack {
        const available = MUSIC_TRACKS.filter(t => !excludeIds.includes(t.id));
        const pool = available.length > 0 ? available : MUSIC_TRACKS;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getTrackById(id: string): MusicTrack | null {
        return MUSIC_TRACKS.find(t => t.id === id) || null;
    }

    playPreview(track: MusicTrack) {
        this.stopPreview();
        this.previewAudio.src = `${import.meta.env.BASE_URL}music/${track.filename}`;
        this.previewAudio.volume = 0.8;
        this.previewAudio.load();
        this.previewAudio.play().catch(e => console.error("Preview play failed:", e));
    }

    stopPreview() {
        this.previewAudio.pause();
        this.previewAudio.currentTime = 0;
    }

    playTrack(track: MusicTrack, crossfade: boolean = false) {
        if (this.currentTrack?.id === track.id) return; // Already playing or fading in

        const nextPlayer = this.activePlayer === 'A' ? this.audioB : this.audioA;
        const currentPlayer = this.activePlayer === 'A' ? this.audioA : this.audioB;

        this.currentTrack = track;

        // Reset state before loading new track to avoid 416 errors
        nextPlayer.pause();
        nextPlayer.currentTime = 0;
        nextPlayer.src = `${import.meta.env.BASE_URL}music/${track.filename}`;
        nextPlayer.load(); // Explicit load to reset headers and avoid Range issues

        nextPlayer.play().catch(e => {
            console.error("Audio play failed, retrying once:", e);
            // Simple retry logic
            setTimeout(() => {
                nextPlayer.load();
                nextPlayer.play().catch(e2 => console.error("Retry failed:", e2));
            }, 500);
        });

        if (crossfade) {
            this.startCrossfade(currentPlayer, nextPlayer);
        } else {
            if (this.fadeInterval) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
            }
            currentPlayer.pause();
            currentPlayer.volume = 0;
            nextPlayer.volume = 0;
            this.rampVolume(nextPlayer, 0, this.maxVolume, 1000);
        }

        this.activePlayer = this.activePlayer === 'A' ? 'B' : 'A';
    }

    private rampVolume(player: HTMLAudioElement, from: number, to: number, duration: number) {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            player.volume = from + (to - from) * progress;
            if (progress === 1) clearInterval(interval);
        }, 50);
    }

    private startCrossfade(outPlayer: HTMLAudioElement, inPlayer: HTMLAudioElement) {
        if (this.fadeInterval) clearInterval(this.fadeInterval);

        const duration = 2000;
        const start = Date.now();

        inPlayer.volume = 0;
        const initialOutVolume = outPlayer.volume;

        this.fadeInterval = setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);

            inPlayer.volume = progress * this.maxVolume;
            outPlayer.volume = initialOutVolume * (1 - progress);

            if (progress === 1) {
                outPlayer.pause();
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
            }
        }, 50);
    }

    stopAll() {
        this.audioA.pause();
        this.audioB.pause();
        this.previewAudio.pause();
        this.audioA.volume = 0;
        this.audioB.volume = 0;
    }
}

export const musicService = new MusicService();
