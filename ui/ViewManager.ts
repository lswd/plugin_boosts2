import View from "./View";
import { Toast } from "./ToastManager";
import { MyLog } from "../../../Game/Script/RxGame/MyLog";

const { ccclass, property } = cc._decorator;

var TAG: string = "[ViewManager]"
@ccclass
export default class ViewManager extends cc.Component {

    // LIFE-CYCLE CALLBACKS:
    static instance: ViewManager;
    // onLoad () {}

    // baseDir:string = "assets/"

    _views: { [index: string]: View } = {}

    // 
    @property(cc.Node)
    modal: cc.Node = null;

    @property
    modalOpacity: number = 160;


    onLoad() {
        this.node.zIndex = 1000;
        ViewManager.instance = this;
        this.modal.active = false;
        this.modal.zIndex = 999;
        g.setGlobalInstance(this);
        // cc.game.addPersistRootNode(this.node);
        // this.node.getComponent(cc.Widget).target = cc.find("Canvas")
    }

    onEnable() {

    }

    onDestroy() {
        // cc.game.removePersistRootNode(this.node);
        for (var key in this._views) {
            delete this._views[key];
        }
    }

    start() {
        //load prefab

        // this.modal.active = false;
        // this.sprite = this.getComponent(cc.Sprite)
        // this.modal.zIndex = 999;
    }
    private getVisibleDialog() {
        for (var name in this._views) {
            let view = this._views[name]
            if (view.isDialog) {
                if (this.isVisible(name)) {
                    return view;
                }
            }
        }
        return null;
    }

    private hasVisibleDialog() {
        for (var name in this._views) {
            let view = this._views[name]
            if (view.isDialog) {
                if (this.isVisible(name)) {
                    return true
                }
            }
        }
        return false;
    }

    public isVisible(viewname) {
        let view = null;
        if (typeof (viewname) == "string")
            view = this._views[viewname]
        else
            view = viewname;
        //todo check type 
        if (view) {
            return view.node.active;
        }
        return false
    }

    view(name) {
        return this._views[name]
    }

    private attachViewComp(existingView: cc.Node): View {
        let viewComp = null;
        if (viewComp == null || viewComp == undefined) {
            viewComp = existingView.getComponent(View);
            if (viewComp == null) {
                viewComp = existingView.addComponent(View);
                viewComp.init(existingView.name);
            }
            this._views[existingView.name] = viewComp;
        }
        return viewComp;
    }

    private showView(view: View, ...params) {
        this.modal.active = view.isDialog;
        //check has popuped dialog and  all currentview is dialog show modal forcely.
        if (this.hasVisibleDialog() || view.isDialog) {
            this.modal.active = true;
        }
        if (view.isDialog) {
            this.modal.opacity = view.opacity;
        }
        // view.node.
        //reset zindex 
        if (!view.topMost)
            // view.node.setSiblingIndex(100)
            view.node.zIndex = 100;
        return view.show(...params);
    }

    showFromPrefab(prefab: cc.Prefab, prefabPath: string, ...params) {
        if(!this.isValid || this._views == null) return;
        let view = this._views[prefabPath];
        if (view == null) {
            let node = cc.instantiate(prefab)
            if(!node)
            {
                return;
            }
            view = node.getComponent(View)
            if (view == null) {
                view = node.addComponent(View);
                view.isDialog = true;
                //default is dialog
            }
            let widget = view.getComponent(cc.Widget);
            if (widget)
                widget.target = cc.find("Canvas")
            view.init(prefabPath);
            this._views[prefabPath] = view;
            if (view.isDialog) {
                this.node.addChild(node, 1000);
            } else {
                this.node.addChild(node, 1000);
            }
        }
        // node = view.node;
        this.node.color.setA(255);
        this.log(TAG, "show view:" + prefabPath)
        return this.showView(view, ...params);
    }

    showFromPrefabPath(prefabPath: string, ...params) {
        let view = this._views[prefabPath]

        MyLog.d("=showFromPrefabPath==",params)
        if (view == null || view == undefined) {
            this.log("start load prefab:" + prefabPath)
            let beforeTime = new Date().getTime();
            cc.loader.loadRes(prefabPath, cc.Prefab, (e, prefab: cc.Prefab) => {
                this.log(TAG, "prefab loaded : " + prefabPath + " " + (new Date().getTime() - beforeTime) + "ms")
                this.showFromPrefab(prefab, prefabPath, ...params);
            })
        } else {
            // this.sprite.enabled = false;
            this.modal.active = view.isDialog;
            if (this.hasVisibleDialog() || view.isDialog) {
                this.modal.active = true;
                this.modal.opacity = view.opacity;
            }
            this.log(TAG, "show view:" + prefabPath, params)
            // let viewnode = view.node;
            // view.node.x = 0;
            // view.node.y = 0;
            return view.show(...params);
        }
    }

    preload(prefabPath: string) {
        let view = this._views[prefabPath]
        if (view == null || view == undefined) {
            cc.loader.loadRes(prefabPath, cc.Prefab, (e, prefab: cc.Prefab) => {
                this.log(TAG, "preload view" + prefabPath)
                let node = cc.instantiate(prefab)
                view = node.getComponent(View);
                let widget = view.getComponent(cc.Widget);
                if (widget)
                    widget.target = cc.find("Canvas")
                view.init(prefabPath);
                this._views[prefabPath] = view;
                // this.scheduleOnce(_=>node.active = false,0);
                if (view.isDialog) {
                    this.node.addChild(node, 1000);
                } else {
                    this.node.addChild(node, 1000);
                }
                view.hide();
            })
        } else {
        }
    }

    // will enableTouch next show up
    disableTouch(viewNode) {
        let view = viewNode.getComponent(View)
        if (view) {
            view.touchEnabled = false;
        }
    }

    enableTouch(viewNode) {
        let view = viewNode.getComponent(View)
        if (view) {
            view.touchEnabled = true;
        }
    }


    show(view, ...params) {
        MyLog.d("=ViewManager==show=",params)
        // disable current view 's touch 
        // this.node.setSiblingIndex(1); 
        // this._views.forEach((view,i)=>{
        //         if(view.topMost){
        //             v.setSiblingIndex(9999); 
        //         }
        // })
        let children = []
        for (var i = 0; i < this.node.childrenCount; i++) {
            children.push(this.node.children[i])
        }
        
        for (var i = 0; i < children.length; i++) {
            let v = children[i]
            let view = v.getComponent(View);
            if (view) {
                if (view.topMost) {
                    // v.setSiblingIndex(9999)
                    v.zIndex = 9999;
                } else {
                    // v.setSiblingIndex(i);
                    v.zIndex = i;
                }
            } else {
                // v.setSiblingIndex(99)
                v.zIndex = -1;
            }
        }

        if (typeof (view) == "string") {
            return this.showFromPrefabPath(view, ...params);
        }
        else {
            if (view == null || view == undefined) return;
            if (view.node) view = view.node;
            let v = this.attachViewComp(view)
            return this.showView(v, ...params);
        }
    }


    hide(viewname, playHideAnim = true) {
        if (typeof (viewname) != "string") {
            // get view name 
            if (viewname == null || viewname == undefined) return;
            this.attachViewComp(viewname)
            viewname = viewname.name;
        }
        let view = this._views[viewname]
        if (view != null && view != undefined) {
            view.node.active = false;
            if (view.isDialog) {
                //todo: should support dialog hide animtion  later 
                this.modal.active = false;
            }
            if (this.hasVisibleDialog()) {
                this.modal.active = true;
            }
            // if(view.isInHideAnimation())
            //     return;
            // view.hide();
            if (playHideAnim)
                view.doHideAnimation();
            view.onHidden();
        }
    }

    checkViewStacks() {
        let dialog = this.getVisibleDialog()
        if (dialog) {
            this.modal.active = true;
            this.modal.opacity = dialog.opacity;
        }
    }



    hideAll() {
        for (var viewname in this._views) {
            // let view = this._views[viewname]
            this.hide(viewname);
        }
    }

    // update (dt) {}
}
