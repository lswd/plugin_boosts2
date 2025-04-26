import LocalizationManager from "../../../Game/Script/RxGame/language/LocalizationManager";
import { MyLog } from "../../../Game/Script/RxGame/MyLog";
import Signal from "../misc/Signal";

const { ccclass, property } = cc._decorator;

export let Guider: NoobGuider = null;
const DOUBLECLICK_TIMEOUT = 300;
@ccclass
export default class NoobGuider extends cc.Component {

    _lastClickedTime: number = 0;

    @property(cc.Node)
    pointer: cc.Node = null;

    @property(cc.Node)
    msgNode: cc.Node = null;

    @property(cc.Label)
    msgLabel: cc.Label = null;

    clickSignal: Signal = new Signal();
    clickBackground: Signal = new Signal();
    doubleClickSignal: Signal = new Signal();

    @property(cc.Node)
    background: cc.Node = null;

    @property(cc.Node)
    pointAvatar: cc.Node = null;

    @property(cc.Node)
    highlight: cc.Node = null;

    @property(cc.SpriteFrame)
    maskStencilSp1: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    maskStencilSp2: cc.SpriteFrame = null;

    maskComp: cc.Mask = null;

    onLoad() {
        this.maskComp = this.highlight.getComponent(cc.Mask)
        this.pointAvatar.on(cc.Node.EventType.TOUCH_END, this.onPointClick, this)
        this.node.on(cc.Node.EventType.TOUCH_END, this.clickBackground.fire, this.clickBackground)
        this.hidePointer()
        this.hideMessage();
    }

    onDestroy() {
        this.pointAvatar.off(cc.Node.EventType.TOUCH_END, this.onPointClick, this)
        this.node.off(cc.Node.EventType.TOUCH_END, this.clickBackground.fire, this.clickBackground)
    }

    onShown() {

    }

    hideMask() {
        this.background.active = false;
    }

    showMask() {
        this.background.active = true;
    }

    hidePointer() {
        // this.pointer.active = false;
        this.pointer.x = -1000;
        this.background.getComponent(cc.Widget).updateAlignment();
    }

    showPointer(node: cc.Node | cc.Vec2 = cc.Vec2.ZERO, avatar = 0) {
        let p = node;
        let avatarNode = null
        this.pointAvatar.children.forEach((v, i) => {
            v.active = avatar == i
            if (v.active)
                avatarNode = v;
        })
        if (node instanceof cc.Node) {
            let rect = node.getBoundingBoxToWorld()
            p = this.node.convertToNodeSpaceAR(rect.center);
            let ratio = rect.width / rect.height;
            this.highlight.width = rect.width;
            this.highlight.height = rect.height;
            if (avatar == 0) {
                this.highlight.y = 0;
                this.maskComp.type = cc.Mask.Type.IMAGE_STENCIL;
                if (ratio > 1.5 && ratio < 2.0) {
                    this.maskComp.spriteFrame = this.maskStencilSp2;
                } else if (ratio > 2.0) {
                    if (node.getComponent(cc.Sprite))
                        this.maskComp.spriteFrame = node.getComponent(cc.Sprite).spriteFrame;
                    else {
                        this.maskComp.spriteFrame = this.maskStencilSp1;
                    }
                } else {
                    this.maskComp.spriteFrame = this.maskStencilSp1;
                }
            } else {
                this.highlight.width = 203;
                this.highlight.height = 136;
                this.highlight.y = 12;
                this.maskComp.type = cc.Mask.Type.ELLIPSE
            }
        }
        this.showMask();

        this.pointer.active = true
        this.pointer.x = p.x
        this.pointer.y = p.y;

        this.background.getComponent(cc.Widget).updateAlignment();
    }

    hideMessage() {
        this.msgNode.active = false;
    }

    showMessage(msg: string, x?, y?, w?, h?) {
        msg = msg.replace(/\/r?\/n/g, "\n")
        this.msgNode.x = x || 0;
        this.msgNode.y = y || 0;
        this.msgNode.width = w;
        this.msgNode.height = h;
        this.msgNode.active = true;
        var number = 0;
        var msgList = LocalizationManager.getStringChanese();
        console.log("====msgList=====" + msg)
        function filterChinese(str: string): string {
            // 使用正则表达式匹配所有中文字符
            return str.replace(/[^\u4e00-\u9fff]/g, '');
        }



        for (const key in msgList) {
            var element = msgList[key];
            element=filterChinese(element);
            var data =filterChinese(msg);
            if (element.includes(data)) {
                number = parseInt(key);
            }
        }
        if (number > 0) {
            console.log("====msgList=number====" + number)
            LocalizationManager.changeLable(this.msgLabel, number)
        } else {
            this.msgLabel.string = msg;
        }
    }



    onPointClick() {
        let now = Date.now()
        let offset = now - this._lastClickedTime
        if (offset < DOUBLECLICK_TIMEOUT) {
            this.doubleClickSignal.fire();
        } else {
            this.clickSignal.fire();
        }
        this._lastClickedTime = now;
    }

    async waitClick(node: cc.Node, avatar = 0) {
        this.showPointer(node, avatar);
        // btn.clickEvents.
        return new Promise((resolve, reject) => {
            this.clickSignal.on(() => {
                let btn = node.getComponent(cc.Button) || node.getComponentInChildren(cc.Button);
                if (btn)
                    cc.Component.EventHandler.emitEvents(btn.clickEvents, { target: btn.node });
                else
                    cc.log("warnning: btn has no handler")
                this.clickSignal.clear();
                resolve();
            })
        })
    }

    async waitDoubleClick(node, avatar = 0) {
        this.showPointer(node, avatar);
        return new Promise((resolve, reject) => {
            this.doubleClickSignal.on(() => {
                node.getComponents(cc.Component).forEach(v => {
                    let func = v['onDoubleClick'] as Function
                    if (func) {
                        func.call(v);
                    }
                })
                resolve();
            })
        })
    }

    async waitAnyKey() {
        return new Promise((resolve, reject) => {
            this.clickBackground.on(() => {
                this.clickBackground.clear();
                resolve();
            })
        })
    }

}