import { MusicTrack, MUSIC_TRACKS } from '../constants';

class MusicService {
    // 音频对象池：固定 3 个音频对象，循环使用
    private pool: HTMLAudioElement[] = [];
    private POOL_SIZE = 3;

    // 当前活跃的音频对象引用
    private activeAudios: {
        bgm: HTMLAudioElement | null;
        exitA: HTMLAudioElement | null;
        exitB: HTMLAudioElement | null;
    } = { bgm: null, exitA: null, exitB: null };

    private previewAudio: HTMLAudioElement;

    // 当前活跃的 Track ID
    private bgmTrackId: string | null = null;
    private exitATrackId: string | null = null;
    private exitBTrackId: string | null = null;

    // 追踪出口音乐是否已经开始播放过
    private exitAStarted: boolean = false;
    private exitBStarted: boolean = false;

    private fadeIntervals: Map<HTMLAudioElement, number> = new Map();
    private targetVolumes: Map<HTMLAudioElement, number> = new Map();

    private maxVolume = 0.8;
    private crossfadeDuration = 1000;

    // 音量快照 for menu pause/resume
    private volumeSnapshot: { bgm: number, exitA: number, exitB: number } | null = null;

    constructor() {
        // 初始化池
        for (let i = 0; i < this.POOL_SIZE; i++) {
            const audio = new Audio();
            audio.loop = true;
            audio.preload = "auto";
            audio.volume = 0;
            this.pool.push(audio);
        }
        this.previewAudio = new Audio();
        this.previewAudio.loop = true;
        this.previewAudio.volume = 0;
    }

    getRandomTrack(excludeIds: string[] = []): MusicTrack {
        const available = MUSIC_TRACKS.filter(t => !excludeIds.includes(t.id));
        const pool = available.length > 0 ? available : MUSIC_TRACKS;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getTrackById(id: string): MusicTrack | null {
        return MUSIC_TRACKS.find(t => t.id === id) || null;
    }

    // 初始化关卡：智能分配音频对象
    initLevel(bgmTrack: MusicTrack, exitATrack: MusicTrack, exitBTrack: MusicTrack) {
        console.log(`initLevel: BGM=${bgmTrack.id}, ExitA=${exitATrack.id}, ExitB=${exitBTrack.id}`);

        // 1. 确定 BGM 音频对象
        // 尝试从池中找到正在播放且 src 匹配新 BGM 的对象（即上一个关卡的出口音乐）
        const bgmUrl = `${import.meta.env.BASE_URL}music/${bgmTrack.filename}`;

        let newBgmAudio = this.pool.find(audio => {
            // 解决 URL 编码问题 (例如空格变成 %20)
            const decodedSrc = decodeURIComponent(audio.src);
            const isMatch = (audio.src.includes(bgmTrack.filename) || decodedSrc.includes(bgmTrack.filename));

            console.log(`Checking audio: src=${audio.src}, decoded=${decodedSrc}, match=${isMatch}, paused=${audio.paused}, vol=${audio.volume}`);

            return isMatch && !audio.paused && audio.volume > 0;
        });

        if (newBgmAudio) {
            console.log("Seamless transition: Reusing existing audio for BGM");
            // 确保音量恢复到最大（如果之前是淡出状态或者未满）
            this.fadeTo(newBgmAudio, this.maxVolume);
        } else {
            console.log("Cold start: Allocating new audio for BGM");
            // 正常的冷启动或未找到匹配项
            // 选择一个空闲的（未在播放的）作为 BGM，如果没有则强制抢占第一个（极少情况）
            newBgmAudio = this.getFreeAudio() || this.pool[0];
            this.loadTrack(newBgmAudio, bgmTrack);
            newBgmAudio.volume = this.maxVolume;
            newBgmAudio.play().catch(e => console.error("BGM play failed:", e));
        }

        this.activeAudios.bgm = newBgmAudio;
        this.bgmTrackId = bgmTrack.id;

        // 2. 分配 Exit A 和 Exit B
        // 从池中排除掉已经被分配给 BGM 的对象
        const remainingPool = this.pool.filter(a => a !== newBgmAudio);

        // 分配 Exit A
        this.activeAudios.exitA = remainingPool[0];
        this.loadTrack(this.activeAudios.exitA, exitATrack);
        this.activeAudios.exitA.volume = 0; // 初始静音
        // 确保它不播放（如果是复用停止的）
        if (!this.activeAudios.exitA.paused) {
            this.activeAudios.exitA.pause();
            this.activeAudios.exitA.currentTime = 0;
        }

        // 分配 Exit B
        this.activeAudios.exitB = remainingPool[1];
        this.loadTrack(this.activeAudios.exitB, exitBTrack);
        this.activeAudios.exitB.volume = 0; // 初始静音
        if (!this.activeAudios.exitB.paused) {
            this.activeAudios.exitB.pause();
            this.activeAudios.exitB.currentTime = 0;
        }

        this.exitATrackId = exitATrack.id;
        this.exitBTrackId = exitBTrack.id;

        // 重置播放状态
        this.exitAStarted = false;
        this.exitBStarted = false;
    }

    private getFreeAudio(): HTMLAudioElement | undefined {
        return this.pool.find(a => a.paused || a.volume === 0);
    }

    // 踩到 Exit A
    onEnterExitA() {
        if (!this.activeAudios.bgm || !this.activeAudios.exitA || !this.activeAudios.exitB) return;

        // BGM 静音
        this.fadeTo(this.activeAudios.bgm, 0);

        // 如果 Exit A 尚未播放，开始播放
        if (!this.exitAStarted) {
            this.activeAudios.exitA.play().catch(e => console.error("ExitA play failed:", e));
            this.exitAStarted = true;
        }
        this.fadeTo(this.activeAudios.exitA, this.maxVolume);

        // Exit B 静音
        this.fadeTo(this.activeAudios.exitB, 0);
    }

    // 踩到 Exit B
    onEnterExitB() {
        if (!this.activeAudios.bgm || !this.activeAudios.exitA || !this.activeAudios.exitB) return;

        // BGM 静音
        this.fadeTo(this.activeAudios.bgm, 0);

        // 如果 Exit B 尚未播放，开始播放
        if (!this.exitBStarted) {
            this.activeAudios.exitB.play().catch(e => console.error("ExitB play failed:", e));
            this.exitBStarted = true;
        }
        this.fadeTo(this.activeAudios.exitB, this.maxVolume);

        // Exit A 静音
        this.fadeTo(this.activeAudios.exitA, 0);
    }

    // 离开出口
    onLeaveExit() {
        if (!this.activeAudios.bgm || !this.activeAudios.exitA || !this.activeAudios.exitB) return;

        // BGM 恢复
        this.fadeTo(this.activeAudios.bgm, this.maxVolume);

        // Exit A/B 静音但继续播放
        this.fadeTo(this.activeAudios.exitA, 0);
        this.fadeTo(this.activeAudios.exitB, 0);
    }

    // 确认进入出口，返回新 BGM 的 trackId
    confirmExit(type: 'A' | 'B'): string | null {
        const newBgmId = type === 'A' ? this.exitATrackId : this.exitBTrackId;
        console.log(`confirmExit: type=${type}, newBgmId=${newBgmId}`);

        // 停止旧 BGM
        if (this.activeAudios.bgm) {
            this.fadeTo(this.activeAudios.bgm, 0, () => {
                this.activeAudios.bgm?.pause();
                this.activeAudios.bgm!.currentTime = 0;
            });
        }

        // 停止未选中的出口音乐
        // 注意：选中的出口音乐（exitA 或 exitB）保持播放！
        // 它将在 initLevel 中被识别并无缝转换为 activeAudios.bgm
        if (type === 'A') {
            if (this.activeAudios.exitB) {
                this.activeAudios.exitB.pause();
                this.activeAudios.exitB.currentTime = 0;
            }
        } else {
            if (this.activeAudios.exitA) {
                this.activeAudios.exitA.pause();
                this.activeAudios.exitA.currentTime = 0;
            }
        }

        return newBgmId;
    }

    // 菜单打开：暂停（静音）所有游戏音轨
    pauseGameAudio() {
        if (!this.activeAudios.bgm) return;

        this.volumeSnapshot = {
            bgm: this.activeAudios.bgm?.volume || 0,
            exitA: this.activeAudios.exitA?.volume || 0,
            exitB: this.activeAudios.exitB?.volume || 0
        };

        [this.activeAudios.bgm, this.activeAudios.exitA, this.activeAudios.exitB].forEach(audio => {
            if (audio) this.fadeTo(audio, 0);
        });
    }

    // 菜单关闭：恢复游戏音轨音量
    resumeGameAudio() {
        if (this.volumeSnapshot && this.activeAudios.bgm) {
            if (this.activeAudios.bgm) this.fadeTo(this.activeAudios.bgm, this.volumeSnapshot.bgm);
            if (this.activeAudios.exitA) this.fadeTo(this.activeAudios.exitA, this.volumeSnapshot.exitA);
            if (this.activeAudios.exitB) this.fadeTo(this.activeAudios.exitB, this.volumeSnapshot.exitB);
            this.volumeSnapshot = null;
        } else {
            // 默认恢复 BGM
            if (this.activeAudios.bgm) this.fadeTo(this.activeAudios.bgm, this.maxVolume);
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
        this.pool.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0;
            if (this.fadeIntervals.has(audio)) {
                clearInterval(this.fadeIntervals.get(audio));
                this.fadeIntervals.delete(audio);
            }
            if (this.targetVolumes.has(audio)) {
                this.targetVolumes.delete(audio);
            }
        });
    }

    stopAll() {
        this.stopGameTracks();

        // Reset active refs
        this.activeAudios = { bgm: null, exitA: null, exitB: null };
        this.bgmTrackId = null;
        this.exitATrackId = null;
        this.exitBTrackId = null;
        this.exitAStarted = false;
        this.exitBStarted = false;
        this.volumeSnapshot = null;

        // Stop preview
        this.previewAudio.pause();
        this.previewAudio.currentTime = 0;
        this.previewAudio.volume = 0;
    }

    private loadTrack(audio: HTMLAudioElement, track: MusicTrack) {
        const path = `${import.meta.env.BASE_URL}music/${track.filename}`;
        // 只有当 src 真正改变时才重新加载，避免卡顿
        if (!audio.src.includes(track.filename)) {
            audio.src = path;
            audio.load();
        }
    }



    private fadeTo(audio: HTMLAudioElement, targetVol: number, onComplete?: () => void) {
        // 如果已经有一个针对该音频的渐变正在进行，且目标音量相同，则无需重复操作
        if (this.targetVolumes.has(audio) && Math.abs(this.targetVolumes.get(audio)! - targetVol) < 0.001) {
            return;
        }

        if (this.fadeIntervals.has(audio)) {
            clearInterval(this.fadeIntervals.get(audio));
            this.fadeIntervals.delete(audio);
        }

        // 更新当前的目标音量
        this.targetVolumes.set(audio, targetVol);

        const startVol = audio.volume;
        const diff = targetVol - startVol;
        if (Math.abs(diff) < 0.01) {
            audio.volume = targetVol;
            this.targetVolumes.delete(audio); // 完成后清理
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
                this.targetVolumes.delete(audio); // 完成后清理
                if (onComplete) onComplete();
            }
        }, stepTime);

        this.fadeIntervals.set(audio, interval as unknown as number);
    }
}

export const musicService = new MusicService();
