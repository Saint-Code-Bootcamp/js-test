const mysql = require('sync-mysql'); //подключим библиотеку для работы с БД

//устанавливаем соединение с СУБД
const connection = new mysql({
    host: "localhost",
    user: "jstest",
    database: "jstest",
    password: "jstest"
}); 

function Session(sess_id){
    //опишем объект сессии
    this.sess_id = sess_id; //идентификатор сессии

    this.is_session = function(){
        //проверить существует ли такая сессия(есть ли запись в БД)
        row = connection.query(`SELECT count(*) cnt FROM results WHERE sess_id="${this.sess_id}"`);
        return parseInt(row[0]['cnt']) > 0;
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
            return this.sess_id;
        }
        return null;
    }

    this.read_data = function(){
        //получить данные сессии в виде объекта
        const resp = connection.query(`SELECT * FROM results WHERE sess_id="${this.sess_id}"`)[0];
        resp.answers = JSON.parse(resp.answers); //преобразовать данные об ответах из строки в объект
        return resp;
    }

    this.write_data = function(data){
        //сохранить данные сессии в файле
        //обезопасим данные приведением типа
        const answers = JSON.stringify(data.answers);
        const current = parseInt(data.current);
        const complete = data.complete;
        const summary = parseInt(data.summary);
        if (this.is_session()){ //проверим есть ли такая запись в таблице
            //обновим значения в записи
            connection.query(`UPDATE results SET 
                                    email = "${data.email}",
                                    answers = '${answers}',
                                    current = "${current}",
                                    complete = "${complete}",
                                    summary = "${summary}"
                                WHERE sess_id="${this.sess_id}"`);
        } else {
            //вставим новую запись в таблицу
            connection.query(`INSERT INTO results (sess_id, email, answers, current, complete, summary) VALUES(
                            '${this.sess_id}',
                            "${data.email}",
                            '${answers}',
                            "${current}",
                            "${complete}",
                            "${summary}"
                            )`);
        }
    }

    this.delete = function(){
        // удалим запись из таблицы
        connection.query(`DELETE FROM results WHERE sess_id="${this.sess_id}"`);
    }
}

module.exports = Session