import { MusicTrack, MUSIC_TRACKS } from '../constants';

class MusicService {
    private audioA: HTMLAudioElement;
    private audioB: HTMLAudioElement;
    private previewAudio: HTMLAudioElement;

    // Track references logic
    private bgmAudio: HTMLAudioElement;
    private exitAudio: HTMLAudioElement;

    private fadeIntervals: Map<HTMLAudioElement, number> = new Map();
    private maxVolume = 0.8;
    private crossfadeDuration = 1000;

    constructor() {
        this.audioA = new Audio();
        this.audioB = new Audio();
        this.previewAudio = new Audio();

        [this.audioA, this.audioB, this.previewAudio].forEach(audio => {
            audio.loop = true;
            audio.preload = "auto";
            audio.volume = 0;
        });
        this.previewAudio.loop = true; // Preview loops too? Assuming yes based on "terminate" description only on close.

        this.bgmAudio = this.audioA;
        this.exitAudio = this.audioB;
    }

    getRandomTrack(excludeIds: string[] = []): MusicTrack {
        const available = MUSIC_TRACKS.filter(t => !excludeIds.includes(t.id));
        const pool = available.length > 0 ? available : MUSIC_TRACKS;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getTrackById(id: string): MusicTrack | null {
        return MUSIC_TRACKS.find(t => t.id === id) || null;
    }

    // Initialize the first BGM
    playInitialBGM(track: MusicTrack) {
        this.stopAll();
        this.loadTrack(this.bgmAudio, track);
        this.bgmAudio.volume = 0;
        this.bgmAudio.play().catch(e => console.error("Initial play failed:", e));
        this.fadeTo(this.bgmAudio, this.maxVolume);
    }

    // Logic for interacting with Exit Tiles
    previewExit(track: MusicTrack) {
        // Ensure BGM continues playing but fades to 0
        this.fadeTo(this.bgmAudio, 0);

        // Load and play exit music on exitAudio
        // Only load if different to avoid reset
        const currentSrc = this.exitAudio.src;
        const newSrc = this.getTrackUrl(track);

        // Check if we need to load (using simple string include check as src is full URL)
        // Or simpler: always load if logic demands, but check if already playing same track?
        // Optimization: if exitAudio is already playing this track (maybe paused or vol 0), just fade in.
        // But src check is tricky due to base url.

        if (!currentSrc.includes(track.filename)) {
            this.loadTrack(this.exitAudio, track);
            this.exitAudio.play().catch(e => console.error("Exit play failed:", e));
        } else {
            if (this.exitAudio.paused) this.exitAudio.play();
        }

        this.fadeTo(this.exitAudio, this.maxVolume);
    }

    cancelExitPreview() {
        // Restore BGM
        this.fadeTo(this.bgmAudio, this.maxVolume);

        // Silence Exit Audio
        // "Leaving A/B... volume down to 0"
        this.fadeTo(this.exitAudio, 0, () => {
            // Optional: Pause after fade to save resources? 
            // User didn't strictly forbid pausing Aux tracks, only BGM persistence.
            // But let's pause to be safe and clean.
            // this.exitAudio.pause(); 
        });
    }

    confirmExit() {
        // The current Exit Audio becomes the new BGM
        this.fadeTo(this.exitAudio, this.maxVolume); // Ensure it's full vol

        // The old BGM stops (or just silent reset)
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
        this.bgmAudio.volume = 0;

        // Swap roles
        const temp = this.bgmAudio;
        this.bgmAudio = this.exitAudio;
        this.exitAudio = temp;
    }

    // Logic for Menu Preview
    playMenuPreview(track: MusicTrack) {
        // Fade out ALL game audio (BGM and potential Exit)
        this.fadeTo(this.bgmAudio, 0);
        this.fadeTo(this.exitAudio, 0);

        // Play Preview
        this.loadTrack(this.previewAudio, track);
        this.previewAudio.currentTime = 0;
        this.previewAudio.play().catch(e => console.error("Preview play failed:", e));
        this.fadeTo(this.previewAudio, this.maxVolume);
    }

    stopMenuPreview() {
        // Fade out Preview and STOP
        this.fadeTo(this.previewAudio, 0, () => {
            this.previewAudio.pause();
            this.previewAudio.currentTime = 0;
        });

        // Restore Game Audio
        // We need to know if we are on an exit or not? 
        // App.tsx logic will typically call previewExit or cancelExitPreview on update.
        // But simpler: Restore BGM to max. If we are on exit, App.tsx will trigger previewExit again?
        // Or we just restore BGM generally.
        // Wait, if we are on Exit, BGM should be 0, Exit should be 0.8.
        // If we blindly restore BGM to 0.8, we might hear wrong thing.
        // Strategy: Just stop preview. Let App.tsx component state (useEffect) handle restoring the correct game track state.
        // However, we can provide a helper "dampenAll" / "restoreAll" or just leave it to specific calls.
        // User requirement: "ESC window closed... Maze BGM volume to 80%".
        // This implies valid state is "Maze BGM". If we were on Exit, maybe we should hear Exit?
        // Let's assume standard restore is BGM -> 0.8. 
        // But `cancelExitPreview` does exactly that. 
        // We will expose a `restoreGameAudio()` that restores BGM, and allow App to override if on exit.

        // For now, to meet exact requirement:
        // "Maze bgm volume gradually increases to 80%".
        this.fadeTo(this.bgmAudio, this.maxVolume);

        // If Exit audio was playing, it stays 0 unless App triggers it again.
    }

    stopAll() {
        [this.audioA, this.audioB, this.previewAudio].forEach(audio => {
            audio.pause();
            audio.volume = 0;
            if (this.fadeIntervals.has(audio)) {
                clearInterval(this.fadeIntervals.get(audio));
                this.fadeIntervals.delete(audio);
            }
        });
        // Reset roles
        this.bgmAudio = this.audioA;
        this.exitAudio = this.audioB;
    }

    private loadTrack(audio: HTMLAudioElement, track: MusicTrack) {
        audio.src = `${import.meta.env.BASE_URL}music/${track.filename}`;
        audio.load();
    }

    private getTrackUrl(track: MusicTrack): string {
        return `${import.meta.env.BASE_URL}music/${track.filename}`;
    }

    private fadeTo(audio: HTMLAudioElement, targetVol: number, onComplete?: () => void) {
        if (this.fadeIntervals.has(audio)) {
            clearInterval(this.fadeIntervals.get(audio));
            this.fadeIntervals.delete(audio);
        }

        const startVol = audio.volume;
        const diff = targetVol - startVol;
        if (Math.abs(diff) < 0.01) {
            audio.volume = targetVol;
            if (onComplete) onComplete();
            return;
        }

        const stepTime = 50; // ms
        const steps = this.crossfadeDuration / stepTime;
        const volStep = diff / steps;

        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const newVol = startVol + (volStep * currentStep);

            // Clamp
            if (diff > 0) {
                audio.volume = Math.min(newVol, targetVol);
            } else {
                audio.volume = Math.max(newVol, targetVol);
            }

            if (currentStep >= steps) {
                audio.volume = targetVol;
                clearInterval(interval);
                this.fadeIntervals.delete(audio);
                if (onComplete) onComplete();
            }
        }, stepTime);

        this.fadeIntervals.set(audio, interval as unknown as number);
    }
}

export const musicService = new MusicService();
