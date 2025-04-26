import PsFx from "./PsFx";
import Device from "../misc/Device";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PsFxPlayer extends cc.Component {

    @property(cc.Prefab)
    prefab:cc.Prefab = null

    _fx:PsFx = null;

    @property(cc.SpriteFrame)
    spriteFrame:cc.SpriteFrame = null

    @property(cc.AudioClip)
    audioClip:cc.AudioClip;

    @property
    duration:number = -1;

    @property
    randomRotaion: boolean = false;

    start () {
    }

    get fx()
    {
        if(this._fx == null && this.prefab)
        {
            let node = cc.instantiate(this.prefab);
            if(node == null) return null;
            let fx = node.getComponent(PsFx)
            if(fx == null)
            {
                fx = this.addComponent(PsFx);
            }
            node.setPosition(0,0);
            node.setParent(this.node);
            this._fx = fx;
        }
        return this._fx;
    }

    isPlaying()
    {
        return this.fx.isPlaying;
    }

    onEnable()
    {
        
    }

    onDisable()
    {
        let fx = this._fx;
        if(fx)
            fx.node.active = false;
    }

    sleep(sec){
        return new Promise((resolve,reject)=>{
            setTimeout(_=>{
                resolve();
            } , sec)
        })
    };

    async play(spriteFrame?:cc.SpriteFrame|string,audio?)
    {
        Device.playEffect(this.audioClip,false);
        let fx = this.fx;
        if(fx)
        {
            fx.node.active = true;
            if(this.randomRotaion)
                fx.node.rotation = g.randomInt(0,360);  
            fx.reset();
            return fx.play(audio||this.audioClip,spriteFrame || this.spriteFrame);
        }else{
            if(this.duration > 0 )
                await this.sleep(this.duration * 1000);
        }
    }

    // update (dt) {}
}
