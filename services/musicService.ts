import { MusicTrack, MUSIC_TRACKS } from '../constants';

class MusicService {
    private bgmAudio: HTMLAudioElement;
    private exitAAudio: HTMLAudioElement;
    private exitBAudio: HTMLAudioElement;
    private previewAudio: HTMLAudioElement;

    private bgmTrackId: string | null = null;
    private exitATrackId: string | null = null;
    private exitBTrackId: string | null = null;

    private fadeIntervals: Map<HTMLAudioElement, number> = new Map();
    private maxVolume = 0.8;
    private crossfadeDuration = 1000;

    // 音量快照 for menu pause/resume
    private volumeSnapshot: { bgm: number, exitA: number, exitB: number } | null = null;

    constructor() {
        this.bgmAudio = new Audio();
        this.exitAAudio = new Audio();
        this.exitBAudio = new Audio();
        this.previewAudio = new Audio();

        [this.bgmAudio, this.exitAAudio, this.exitBAudio, this.previewAudio].forEach(audio => {
            audio.loop = true;
            audio.preload = "auto";
            audio.volume = 0;
        });
    }

    getRandomTrack(excludeIds: string[] = []): MusicTrack {
        const available = MUSIC_TRACKS.filter(t => !excludeIds.includes(t.id));
        const pool = available.length > 0 ? available : MUSIC_TRACKS;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getTrackById(id: string): MusicTrack | null {
        return MUSIC_TRACKS.find(t => t.id === id) || null;
    }

    // 初始化关卡：同时加载并播放 3 首曲目
    initLevel(bgmTrack: MusicTrack, exitATrack: MusicTrack, exitBTrack: MusicTrack) {
        // 停止旧的
        this.stopGameTracks();

        this.bgmTrackId = bgmTrack.id;
        this.exitATrackId = exitATrack.id;
        this.exitBTrackId = exitBTrack.id;

        this.loadTrack(this.bgmAudio, bgmTrack);
        this.loadTrack(this.exitAAudio, exitATrack);
        this.loadTrack(this.exitBAudio, exitBTrack);

        // 初始音量
        this.bgmAudio.volume = this.maxVolume;
        this.exitAAudio.volume = 0;
        this.exitBAudio.volume = 0;

        // 同时开始播放
        this.bgmAudio.play().catch(e => console.error("BGM play failed:", e));
        this.exitAAudio.play().catch(e => console.error("ExitA play failed:", e));
        this.exitBAudio.play().catch(e => console.error("ExitB play failed:", e));
    }

    // 踩到 Exit A
    onEnterExitA() {
        this.fadeTo(this.bgmAudio, 0);
        this.fadeTo(this.exitAAudio, this.maxVolume);
        this.fadeTo(this.exitBAudio, 0); // 确保 B 静音
    }

    // 踩到 Exit B
    onEnterExitB() {
        this.fadeTo(this.bgmAudio, 0);
        this.fadeTo(this.exitBAudio, this.maxVolume);
        this.fadeTo(this.exitAAudio, 0); // 确保 A 静音
    }

    // 离开出口
    onLeaveExit() {
        this.fadeTo(this.bgmAudio, this.maxVolume);
        this.fadeTo(this.exitAAudio, 0);
        this.fadeTo(this.exitBAudio, 0);
    }

    // 确认进入出口，返回当前应为新 BGM 的 trackId
    confirmExit(type: 'A' | 'B'): string | null {
        const newBgmId = type === 'A' ? this.exitATrackId : this.exitBTrackId;
        // 调用方将使用这个 ID 作为下一关的 BGM，并调用 initLevel
        return newBgmId;
    }

    // 菜单打开：暂停（静音）所有游戏音轨
    pauseGameAudio() {
        this.volumeSnapshot = {
            bgm: this.bgmAudio.volume,
            exitA: this.exitAAudio.volume,
            exitB: this.exitBAudio.volume
        };
        this.fadeTo(this.bgmAudio, 0);
        this.fadeTo(this.exitAAudio, 0);
        this.fadeTo(this.exitBAudio, 0);
    }

    // 菜单关闭：恢复游戏音轨音量
    resumeGameAudio() {
        if (this.volumeSnapshot) {
            this.fadeTo(this.bgmAudio, this.volumeSnapshot.bgm);
            this.fadeTo(this.exitAAudio, this.volumeSnapshot.exitA);
            this.fadeTo(this.exitBAudio, this.volumeSnapshot.exitB);
            this.volumeSnapshot = null;
        } else {
            // 默认恢复 BGM
            this.fadeTo(this.bgmAudio, this.maxVolume);
        }
    }

    // 菜单历史记录预览
    playMenuPreview(track: MusicTrack) {
        this.pauseGameAudio(); // 先静音游戏音轨
        this.loadTrack(this.previewAudio, track);
        this.previewAudio.currentTime = 0;
        this.previewAudio.play().catch(e => console.error("Preview play failed:", e));
        this.fadeTo(this.previewAudio, this.maxVolume);
    }

    stopMenuPreview() {
        this.fadeTo(this.previewAudio, 0, () => {
            this.previewAudio.pause();
            this.previewAudio.currentTime = 0;
        });
        this.resumeGameAudio();
    }

    // 停止游戏播放轨道 (用于关卡切换)
    private stopGameTracks() {
        [this.bgmAudio, this.exitAAudio, this.exitBAudio].forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0;
            if (this.fadeIntervals.has(audio)) {
                clearInterval(this.fadeIntervals.get(audio));
                this.fadeIntervals.delete(audio);
            }
        });
    }

    stopAll() {
        [this.bgmAudio, this.exitAAudio, this.exitBAudio, this.previewAudio].forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0;
            if (this.fadeIntervals.has(audio)) {
                clearInterval(this.fadeIntervals.get(audio));
                this.fadeIntervals.delete(audio);
            }
        });
        this.bgmTrackId = null;
        this.exitATrackId = null;
        this.exitBTrackId = null;
        this.volumeSnapshot = null;
    }

    private loadTrack(audio: HTMLAudioElement, track: MusicTrack) {
        audio.src = `${import.meta.env.BASE_URL}music/${track.filename}`;
        audio.load();
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
