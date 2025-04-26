/**
 * @author renwang
 * @description csv-parser for creator ,work along with typing_csv.js
 */
var csv = {}
csv.__ID__ = "ID"
csv.__ROWS__ = "values"
csv.__SIZE__ = "size"
csv.__PS_INDEX__ = 0
csv.__TYPE_INDEX__ = 1;
csv.__HEADER_INDEX__ = 2;
csv.__DATA_INDEX__ = 3;
/**
 * @constuctor
 * @param {}
 * @private
 */
csv._StructData = function()
{
    this.header = []
    this.body = []
}

/**
 * @constructor
 * @param {Array.<number>}
 * @param {Array}
 */
csv._Row = function(keys,values,index)
{
    var self = this;
    // /**
    //  * @type {Array.<number>}
    //  */
    // this._values = values;
    // /**
    //  * @type {Array}
    //  */
    // this._keys = keys;
    this.index = index;

    let types = []
    let names = []
    keys.forEach(function(v,i){
        var [name,type] = v.split(":")
        if(type){
            var result = type.match(/\[(\w*)\]/)
            if(result ){
                if(result[1] == "" ||result[1] == "number")
                {
                    type = "array.number"
                }else{
                    type = "array.default"
                }
            }else{
                type = "default"
            }
        }else{
            type = "default"
        }
        names.push(name)
        types.push(type);
    })

    names.forEach(function(name,i){
        var val = values[i]
        //分析每个字段，并跟据字段类型进行解析成 object
        var type = types[i]
        if(type.startsWith("array")){
            if(val && val.length > 0){
                val = val.split(/[,\+&;\/\s]/)
                if(type.endsWith("number"))
                {
                    val = val.map(function(x){
                        return Number(x)
                    })
                }
            }else{
                val = []
            }
        }else if(type == "json")
        {
            val = JSON.parse(val);
        }else{
            var result = val.match(/\"(.*)\"/)
            if(result){
                val = result[1] || val;
            }else{
                var val_n = Number(val);
                if(!isNaN(val_n)){
                    val = val_n
                }
            }
        }
        Object.defineProperty(self,name,{
            value:val,
            writable:false
        })
    });
}


csv._Row.prototype.match = function(cond)
{
    if(cond && cond(this,this.index)){
        return true;
    }
    return false;
}


/**
 * @constuctor
 * @param {csv._StructData} data
 */
csv._CSV = function(data) {
    /**
     * @type {csv._StructData} 
     */
    this._data = data;
    /**
     * @type {Object.<number,csv._Row>}
     */
    this._rows = {};
    var self = this;
    let id_index = data.header.indexOf(csv.__ID__)
    data.body.forEach(function(v,i){
        var row = new csv._Row(data.header,v,i)
        // release data
        delete data.body[i]
        self._rows[v[id_index]] = row;
    })
    // empty array 
    data.body.splice(0)
    Object.defineProperty(this,csv.__ROWS__,{
        // value:this._rows,
        get:function(){
            return Object.values(self._rows)
        },
        // writable:false
    })
    Object.defineProperty(this,csv.__SIZE__,{
        value:data.body.length,
        writable:false
    })
}

/**
 * @param {string|number}  key
 */
csv._CSV.prototype.get = function(id)
{
    return this._rows[id]
}


csv._CSV.prototype.search = function(cond)
{
    let arrs = []
    for(var k in this._rows)
    {
        var row = this._rows[k]
        if(row.match(cond))
        {
            arrs.push(row)
        }
    }
    return arrs;
}


/**
 * @type {Array.<csv._CSV>}
 */
csv.pathToCSV = {}

csv.isLoaded = function(name)
{
    return csv.pathToCSV[name] != null;
}

csv.load = function(path,callback,target)
{
    //load res
    cc.loader.loadRes(path,cc.TextAsset,function(err,resource){
        if(!csv.pathToCSV[resource.name])
        {
            var csv_ = csv.parse(resource.text)
            csv.pathToCSV[resource.name] = csv_;
            Object.defineProperty(csv,resource.name , {
                value :csv_,
                writable:false
            })
        }
        cc.loader.releaseRes(path,cc.TextAsset);
        if(callback) callback.call(target)
    })
}

csv.loadString = function(name,csv_str,callback,target)
{
    if(!csv.pathToCSV[name])
    {
        var csv_ = csv.parse(csv_str)
        csv.pathToCSV[name] = csv_;
        Object.defineProperty(csv,name , {
            value :csv_,
            writable:false
        })
    }
    if(callback) callback.call(target)
}

/**
 * @param {string} csv_text
 */
csv.parse = function(csv_text)
{
    var rows = csv_text.split("\n").filter(function(line){
        return line!= ""
    })
    var  csv_data = new csv._StructData();
    csv_data.header = rows[csv.__HEADER_INDEX__].replace(/[\r]/g,"").split(/\s*\t/g)//.map(v=>v.replace(/\s/g,""))
    csv_data.body = rows.slice(csv.__DATA_INDEX__).map(function(row){return csv.parseRowWithT(row.replace(/\r/g,""))})
    var csv_ = new csv._CSV(csv_data)
    return csv_;
}

csv.parseRowWithT = function(row){
    return row.split("\t")
}


csv.parseRow = function(row) {
    if (row.indexOf('"') === -1) {
        return row.split(',');
    }
    var running = "";
    var result = [];
    var escapeMode = false;
    for (var i = 0; i < row.length; i++) {
        var current = row.charAt(i);
        if (current === '"') {
            escapeMode = !escapeMode;
            continue;
        }
        if (current === ',' && !escapeMode) {
            result.push(running);
            running = "";
            continue;
        }
        running += current;
    }
    result.push(running);
    return result;
};

csv.cache_indexKeyToTable = {}

csv.hasIndex = function(key)
{
    return csv.cache_indexKeyToTable[key] != null
}

csv.createIndex = function(path, key_field,value_field){
    if(csv.hasIndex(path+"."+key_field))
    {
        return;
    }
    /**
     * @type {csv._CSV}
     */
    var c = this[path]
    c.values.forEach(function(v){
        var key = v[key_field]
        if(key == "" || key == 0) return;
        key = key.replace(/\s*/g,"")
        Object.defineProperty(c,key,{
            value:v[value_field],
            writable:false
        })
    })
    csv.cache_indexKeyToTable[path+"."+key_field] = c;
}

csv.loadDir = function(path,callback,target)
{
    //load res
    cc.loader.loadResDir(path,cc.TextAsset,function(err,resource,urls){
        urls.forEach(function(path,i){
            var csv_res = resource[i]
            if(csv.pathToCSV[path])
            {
                return 
            }
            var csv_ = csv.parse(csv_res.text)
            csv.pathToCSV[path] = csv_;
            Object.defineProperty(csv,csv_res.name , {
                value :csv_,
                writable:false
            })
        })
        //release 
        cc.loader.releaseResDir(path,cc.TextAsset);
        return callback&&callback.call(target)
    })
}

/**
 * @param {string} path
 */
csv.release = function(path)
{

}

this.csv = csv;