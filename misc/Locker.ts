const lockers = {}
export default class Locker  {

    static Prevent = 0;
    static Before = 1;
    static After = 2;

    static intercept(target,func_name):Locker
    {
        if(lockers[target]){
            return lockers[target]
        }
        return new Locker(target,func_name,Locker.Prevent)
    }

    func_name:string;
    real_func:Function;
    target:any;

    agent:Function;
    activated:boolean = false;

    constructor(target,func_name,options){
        this.func_name = func_name;
        this.real_func = target[func_name];
        var proxy1 = new Proxy(this.real_func, {
            apply:function(target,thisarg,argumentsList){
                this.activated = true;
                if(options != Locker.Prevent)
                {
                    return target.apply(this,...argumentsList)
                }
            }
        });
        target[func_name] = proxy1
        this.target = target;
        lockers[target] = this;
    }

    release(){
        //还原
        this.target[this.func_name] = this.real_func;
        if(this.activated){
            this.real_func.apply(this.target)
        }
        delete lockers[this.target]
    }
}