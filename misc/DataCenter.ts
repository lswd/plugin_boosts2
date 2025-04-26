import { event } from "../utils/EventManager";

const all_class_properties = {}


const all_registed_class = {}
export function dc(name,serializable = true):Function
{
    return function (target:any)
    {
        // target.endRegister(name);
        let proto:any = target['prototype'].constructor;
        // let cls = all_class_properties[proto]
        all_registed_class[target] = {name,serializable};
    }
}
export function field(obj?:{default?:any}) {
    return function (target: any, propertyName: string) {
        if(obj && obj.default)
            target[propertyName] = obj.default;
        // target.register(propertyName,target[propertyName])
        let constructor = target.constructor
        let cls = all_class_properties[constructor]
        if(cls == null)
        {
            cls = []
            all_class_properties[constructor] = cls;
        }
        cls.push(propertyName);
    }
}


export default class DataCenter
{
    private __namespace:string = "DataCenter"
    static alldata = {}
    private kvs = {}
    private kts = {}
    private defaultKvs = {}
    constructor()
    {
        this.kvs = {}
        this.kts = {}
    }

    get allkeys()
    {
        return Object.keys(this.kvs);
    }

    public defaultValue(key)
    {
        return this.defaultKvs[key]
    }

    public resetValue(key)
    {
        // this.kvs[k] = a[k]
        this.setData(key,this.defaultKvs[key])
    }


    private registerFields(namespace?)
    {
        cc.log(this);
        let target = this["__proto__"].constructor 
        let cls = all_class_properties[target]
        let cfg = all_registed_class[target]
        // let proto:any = target['prototype'];
        for(var i in cls)
        {
            let k = cls[i];
            if(typeof(k) == "function") continue;
            this.register(k,this[k])
            delete this[k]; //删除默认属性 ,否则设置 setter getter 会失效
        }
        namespace = namespace ||  cfg.name;
        this.endRegister(namespace,cfg.serializable)
    }

    register(k,defaultValue)
    {
        let proto:any = this.constructor["prototype"]
        let self = this;
        proto.__defineGetter__(k,function(){
            return self.getData(k);
        })
        proto.__defineSetter__(k,function(s){
            self.setData(k,s)
        }) 
        this.defaultKvs[k] = defaultValue;
        this.kvs[k] = defaultValue;
        let type = typeof(defaultValue);
        this.kts[k] =  type;
        cc.log("[DataCenter] register :" + k + ":" + defaultValue +"("+type+")")
    }
 
    /**
     * setData 会发消息 
     * setValue 不会，只会改变值 
     */
    setValue(k,v){
        this.kvs[k] = v;
    }

    setData(k,nv)
    {
        let v = this.kvs[k]
        if(v == nv ) return;
        let type = this.kts[k]
        let kk =this._field_(k)
        if(type != typeof(nv))
        {
            console.warn("[DataCenter] wrong type <"+typeof(nv)+"> for :" + kk +"<"+type+"> ,converting...")
            if(type == "number")
                if(nv == null){
                    nv = 0
                }else{
                    nv = Number(nv)
                }
            else if(type == "boolean")
            {
                nv = (nv == "true") ? true :false
            }else if(type == "object"){
                nv = nv && this.parseJson(nv) || {};
            }
        }
        this.kvs[k] = nv;
        if(!cc.sys.isMobile)
            cc.log("[DataCenter] onValueChanged" , kk,nv);
        event.emit(kk,nv,v)
    }

    private _field_(k)
    {
        return this.__namespace +"." + k
    }

    getData(k)
    {
        return this.kvs[k];
    }

    limit(v,min,max)
    {
        if(v > max)
        {
            return max;
        }else if(v < min)
        {
            return 0;
        }else{
            return v;
        }
    }

    addData(k,c , autosave = false)
    {
        c = Number(c)
        if(c == null) return;
        let v = this.kvs[k]
        let nv =  Number(v) + c
        this.kvs[k] = nv
        event.emit(this._field_(k),nv,v)
        if(autosave)
            this.save(k);
    }

    onLoad(field_name){}
    onLoadAll(){}
    onBeforeSave(field_name){}
    onAfterSave(field_name){}
    onBeforeSaveAll(){}
    onAfterSaveAll(){}

    private load()
    {
        for (var k in this.kvs)
        {
            let fromstroage = localStorage.getItem(this._field_(k))
            let v:any = fromstroage
            if(fromstroage)
            {
                let type = this.kts[k]
                if(type == "number")
                {
                    v = Number(fromstroage);
                }else if(type == "boolean")
                {
                    v = fromstroage == "true"?true:false;
                }else if(type == "object")
                {
                    v = this.parseJson(fromstroage);
                }
            }else{
                v = this.getData(k);
            }
            this.kvs[k] = v;
            this.onLoad(k);
        }
        this.onLoadAll();
        
    }



    private _saveAll()
    {
        for (var k in this.kvs)
        {
            let v = this.kvs[k]
            let t = this.kts[k]
            let kk = this._field_(k)
            this.onBeforeSave(k);
            if(v!=null){
                if(t == "object"){
                    localStorage.setItem(kk,JSON.stringify(v));
                }else{
                    localStorage.setItem(kk,v.toString());
                }
            }
            this.onAfterSave(k);
            cc.log(cc.js.formatStr("%s:%s" ,kk,v))
        }
    }

    /**
     * 保存数据 
     * @param keys 需要保存的key[list]，如果为空 ，则保存全部字段
     */
    save(...keys)
    {
        cc.log("[DataCenter] save :==================================")
        if(keys.length == 0){
            this.onBeforeSaveAll()
            this._saveAll();
            this.onAfterSaveAll()
        }else{
            for (var i in keys)
            {
                let k = keys[i]
                let v = this.kvs[k]
                let t = this.kts[k]
                let kk = this._field_(k)
                this.onBeforeSave(k);
                if(t == "object"){
                    localStorage.setItem(kk,JSON.stringify(v));
                }else{
                    localStorage.setItem(kk,v.toString());
                }
                this.onAfterSave(k);
                cc.log(cc.js.formatStr("%s:%s" ,kk,v))
            }
        }
        cc.log("[DataCenter] save succ :==================================")
        // localStorage.setItem("#1_coin",this.getData("coin"));
    }

    toString(){
        let s = JSON.stringify(this.kvs,function (key, value) {
            if (typeof value == 'string') {
                let c =  value.replace(/\\?\"/g,"'")
                return c;
            }
            return value
        })
        cc.log('dc.tostring:',s);
        return s
    }

    loadFromJsonObject(a)
    {
        for (var k in this.kvs){
            // this.kvs[k] = a[k]
            this.setData(k,a[k])
            this.onLoad(k);
        }
        this.onLoadAll();
    }

    loadFromString(s){
        let a = JSON.parse(s);
        this.loadFromJsonObject(a);
    }

    resetAndSave(initValues?){
        this.reset();
        for (var k in initValues)
        {
            this.setData(k,initValues[k])
        }
        this.save();
        return true;
    }

    reset(){
        for (var k in this.kvs){
            // this.kvs[k] = a[k]
            this.setData(k,this.defaultKvs[k])
            this.onLoad(k);
        }
        this.onLoadAll()
    }

    parseJson(s)
    {
        return JSON.parse(s.replace(/\\?\'/g,'"'))
    }

    private endRegister(s ,serializable = true)
    {
        this.__namespace = s;
        DataCenter.alldata[s] = this;
        if(serializable)
        {
            this.load()
            // this.save();
        }
    }

    static off(k,callback,target?)
    {
        event.off(k,callback,target);
    }

    static on(k,callback,target?)
    {
       event.on(k ,callback,target)
       this.set(k,this.get(k)) 
    }

    static get(k)
    {
        let strs = k.split(".")
        let namespace = strs[0];
        let name = strs[1];
        let target = DataCenter.alldata[namespace]
        if(target)
            return target[name]
        else 
            return null;
    }

    static set(k,v)
    {
        let strs = k.split(".")
        let namespace = strs[0];
        let name = strs[1];
        let target = DataCenter.alldata[namespace]
        if(target)
        {
            target[name] = v;
        }
    }

    static register(cls)
    {
        let v = new cls();
        let d = all_registed_class[cls]
        g.setGlobalInstance(v,d.name)
        v.registerFields()
        return v;
    }

}