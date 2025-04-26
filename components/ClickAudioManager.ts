import ClickAudio from "./ClickAudio";
const {ccclass, property,disallowMultiple} = cc._decorator;

@ccclass
@disallowMultiple
export default class ClickAudioManager extends cc.Component {

    @property(cc.AudioClip)
    audio :cc.AudioClip = null;

    @property
    elastic:boolean = false;

    @property
    withSiblings:boolean = true;

    @property
    withChildren:boolean = true;


    onLoad () {
        if(this.withSiblings)
        {
            this.make(this.node.parent);
        }
        if(this.withChildren)
        {
            this.make(this.node);
        }
    }
    
    make(node)
    {
        node.walk(this.each.bind(this),_=>0)
        node.on(cc.Node.EventType.CHILD_ADDED,this.onChildAdd,this);
    }

    onChildAdd(node)
    {
        node.walk(this.each.bind(this),_=>0)
    }

    onDestroy()
    {
        this.node.parent.off(cc.Node.EventType.CHILD_ADDED,this.onChildAdd,this);
        this.node.off(cc.Node.EventType.CHILD_ADDED,this.onChildAdd,this);
    }
    
    each(item:cc.Node)
    {
        //if button 
        if (!item.getComponent(cc.Button)) return;
        let comp = item.getComponent(ClickAudio)
        if(comp == null)
        {
            comp = item.addComponent(ClickAudio);
            comp.elastic = this.elastic
            comp.audio = this.audio;
        }
    }
    start () {

    }

    // update (dt) {}
}
