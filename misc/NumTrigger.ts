const {ccclass, property} = cc._decorator;

class TriggerPoint {
    min:number = Number.MIN_VALUE;
    max:number = Number.MAX_VALUE;
    callback:Function;
    id:number = 0;
    triggered:boolean = false;
    constructor(min,max,callback){
        this.min = min;
        this.max = max;
        this.callback = callback;
    }
}

@ccclass
export default class NumTrigger  {

    points:TriggerPoint[] = []
    
    add(min,max,callback)
    {
        let a = new TriggerPoint(min,max,callback);
        // TODO:是否和已有的point 有交集
        this.points.push(a);
    }

    //
    reset()
    {
        this.points.forEach(v=>v.triggered = false)
    }

    private trigger(v,p:TriggerPoint)
    {
        if(p.triggered)
            return false;
        if(v >= p.min && v <=p.max)
        {
            p.triggered = true;
            p.callback()
            return true;
        }
        return false
    }

    update(v)
    {
        this.points.some(p=>this.trigger(v,p))
    }
}