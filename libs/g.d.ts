
interface Array<T> {
    shuffle();
    // find(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any);
}

namespace cc
{
    interface Component{
        log(msg,...params);
        warn(msg,...params);
        error(msg,...params);
        getOrAddComponent<T extends Component>(type: {prototype: T}): T;
    }

    interface _BaseNode{
        getOrAddComponent<T extends Component>(type: {prototype: T}): T;
    }
    interface Animation{
        //move to target frame 
        /**
            !#zh 跳转到指定位置 <br/>
            @param percent 跳转的位置 
            @example ``` 1/3 ```
                 1 表示第一帧 
                 3 表示总帧数
                
		*/
        stepTo(percent:number,name?:string)
    }

    interface Layout{
        showlist<T>(callback: (node: Node, data: T, i: number) => void,dataList:T[],template:cc.Node)
    }

    interface ScrollView{
        showlist<T>(callback: (node: Node, data: T, i: number) => void,dataList:T[],template:cc.Node)
    }

}

// interface String{
//     startWith(str);
//     endWith(str);
// }
