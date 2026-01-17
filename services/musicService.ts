import { MusicTrack, MUSIC_TRACKS } from '../constants';

class MusicService {
    private bgmAudio: HTMLAudioElement;
    private exitAAudio: HTMLAudioElement;
    private exitBAudio: HTMLAudioElement;
    private previewAudio: HTMLAudioElement;

    private bgmTrackId: string | null = null;
    private exitATrackId: string | null = null;
    private exitBTrackId: string | null = null;

    // 追踪出口音乐是否已经开始播放过
    private exitAStarted: boolean = false;
    private exitBStarted: boolean = false;

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

    // 初始化关卡：加载 3 首曲目，但只播放 BGM
    initLevel(bgmTrack: MusicTrack, exitATrack: MusicTrack, exitBTrack: MusicTrack) {
        // 停止旧的
        this.stopGameTracks();

        this.bgmTrackId = bgmTrack.id;
        this.exitATrackId = exitATrack.id;
        this.exitBTrackId = exitBTrack.id;

        // 重置播放状态
        this.exitAStarted = false;
        this.exitBStarted = false;

        // 加载所有 3 轨
        this.loadTrack(this.bgmAudio, bgmTrack);
        this.loadTrack(this.exitAAudio, exitATrack);
        this.loadTrack(this.exitBAudio, exitBTrack);

        // 仅播放 BGM
        this.bgmAudio.volume = this.maxVolume;
        this.bgmAudio.play().catch(e => console.error("BGM play failed:", e));

        // Exit A/B 仅加载，不播放
        this.exitAAudio.volume = 0;
        this.exitBAudio.volume = 0;
    }

    // 踩到 Exit A
    onEnterExitA() {
        // BGM 静音
        this.fadeTo(this.bgmAudio, 0);

        // 如果 Exit A 尚未播放，开始播放
        if (!this.exitAStarted) {
            this.exitAAudio.play().catch(e => console.error("ExitA play failed:", e));
            this.exitAStarted = true;
        }
        this.fadeTo(this.exitAAudio, this.maxVolume);

        // Exit B 静音
        this.fadeTo(this.exitBAudio, 0);
    }

    // 踩到 Exit B
    onEnterExitB() {
        // BGM 静音
        this.fadeTo(this.bgmAudio, 0);

        // 如果 Exit B 尚未播放，开始播放
        if (!this.exitBStarted) {
            this.exitBAudio.play().catch(e => console.error("ExitB play failed:", e));
            this.exitBStarted = true;
        }
        this.fadeTo(this.exitBAudio, this.maxVolume);

        // Exit A 静音
        this.fadeTo(this.exitAAudio, 0);
    }

    // 离开出口
    onLeaveExit() {
        // BGM 恢复
        this.fadeTo(this.bgmAudio, this.maxVolume);

        // Exit A/B 静音但继续播放
        this.fadeTo(this.exitAAudio, 0);
        this.fadeTo(this.exitBAudio, 0);
    }

    // 确认进入出口，返回新 BGM 的 trackId
    confirmExit(type: 'A' | 'B'): string | null {
        const newBgmId = type === 'A' ? this.exitATrackId : this.exitBTrackId;

        // 停止旧 BGM
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;

        // 停止未选中的出口音乐
        if (type === 'A') {
            this.exitBAudio.pause();
            this.exitBAudio.currentTime = 0;
        } else {
            this.exitAAudio.pause();
            this.exitAAudio.currentTime = 0;
        }

        // 选中的出口音乐将在下次 initLevel 时成为新 BGM
        // 这里也停止它，因为 initLevel 会重新加载
        if (type === 'A') {
            this.exitAAudio.pause();
            this.exitAAudio.currentTime = 0;
        } else {
            this.exitBAudio.pause();
            this.exitBAudio.currentTime = 0;
        }

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
        this.pauseGameAudio();
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

    // 停止游戏播放轨道
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
        this.exitAStarted = false;
        this.exitBStarted = false;
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

        const stepTime = 50;
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
