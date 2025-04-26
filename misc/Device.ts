

export default class Device 
{

    static isSfxEnabled = true;

    static isBgmEnabled = true;

    static setSoundsEnable(b:boolean)
    {
        Device.setSFXEnable(b);
        Device.setBGMEnable(b);
    }

    static setSFXEnable(b)
    {
        cc.audioEngine.setEffectsVolume(b == true?1:0);
        Device.isSfxEnabled = b;
        if(!b)
        {
            cc.audioEngine.pauseAllEffects()
        }else{
            cc.audioEngine.resumeAllEffects();
        }
    }

    static _useCCAudioEngine = false;

    static useCCAudioEngine()
    {
        this._useCCAudioEngine = true;
    }

    static useDefaultAudioEngine()
    {
        this._useCCAudioEngine = false;
    }

    static setBGMEnable(b)
    {   
        cc.audioEngine.setMusicVolume(b == true?0.5:0);
        Device.isBgmEnabled = b;
        if(!b)
        {
            cc.audioEngine.pauseMusic()
        }else{
            cc.audioEngine.resumeMusic()
        }
    }


    static playEffect(clip,loop = false)
    {
        if(Device.isSfxEnabled)
        {
            // if(cc.sys.platform == cc.sys.QQ_PLAY)
            // {
            //     if(this._useCCAudioEngine)
            //     {
            //         return cc.audioEngine.playEffect(clip,loop)
            //     }else{
            //         SoundHelper.playSound(clip);
            //     }
            // }else

            return cc.audioEngine.playEffect(clip,loop);

        }
    }

    static stopEffect(audio)
    {
        cc.audioEngine.stopEffect(audio)
    }

    static playEffectURL(clip,loop = false)
    {
        if(Device.isSfxEnabled)
        {
            if(typeof clip == "string"){
                cc.loader.loadRes(clip, cc.AudioClip, function (err, clipGet) {
                    clipGet && cc.audioEngine.playEffect(clipGet, loop);
                });
            }
        }    
    }

    static stopMusic()
    {
        cc.audioEngine.stopMusic();
    }

    static playMusic(clip,loop = true)
    {
        cc.log("Device.isBgmEnabled",Device.isBgmEnabled,clip);
        if(Device.isBgmEnabled)
        {
            if(typeof clip == "string"){
                cc.loader.loadRes(clip, cc.AudioClip, function (err, clipGet) {
                    clipGet && cc.audioEngine.playMusic(clipGet, loop);
                    cc.audioEngine.setMusicVolume(0.5);
                });
            }else if(clip instanceof cc.AudioClip){
                return cc.audioEngine.playMusic(clip,loop),cc.audioEngine.setMusicVolume(0.5);
            }
            
        }
    }

    static vibrate()
    {
        if(cc.sys.WECHAT_GAME == cc.sys.platform)
        {
          //  wx.vibrateLong()
        }else{
            cc.log("not support vibrate on except-wx platfrom ")
        }
    }
}