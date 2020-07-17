const fs = require('fs');

function Session(sess_id){
    //опишем объект сессии
    this._BASE_DIR = __dirname + '/' //дириктория в которой находится скрипт
    this.sess_id = sess_id; //идентификатор сессии

    this.fn = this.sess_id + '.dat'; //имя файла для храниния данных 
    this.fn_path = this._BASE_DIR  + 'data/' + this.fn; //полнуй путь к файлу с данными сессии

    this.is_session = function(){
        //проверить существует ли такая сессия(создан ли файл)
        return fs.existsSync(this.fn_path);
    }
        
    this.gen_url = function(url){
        //сгенерировать url c ключём сессии
        let out_url = url;
        if (out_url.indexOf('?') >=0 ){
            // в url уже есть ?
            out_url += '&sess_id=';
        } else {
            out_url += '?sess_id=';
        }
        out_url += this.sess_id;
        return out_url;
    }

    this.get_id = function(url){
        //извлеч sess_id  из url
        const match = url.match(/sess_id=([\da-f]+)/);
        if (match != null){
            this.sess_id = match[1];
            this.fn = this.sess_id + '.dat'; //имя файла для храниния данных 
            this.fn_path = this._BASE_DIR  + 'data/' + this.fn; //полнуй путь к файлу с данными сессии
                    return this.sess_id;
        }
        return null;
    }

    this.read_data = function(){
        //получить данные сессии в виде объекта
        const data = JSON.parse( fs.readFileSync(this.fn_path) );
        return data;
    }

    this.write_data = function(data){
        //сохранить данные сессии в файле
        fs.writeFileSync(this.fn_path, JSON.stringify(data), {flag: 'w'});
    }

    this.delete = function(){
        fs.unlinkSync(this.fn_path);
    }
}

module.exports = Session