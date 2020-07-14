const express = require('express'); 
const pug = require('pug');
const bodyParser = require("body-parser");
const fs = require('fs');
const crypto = require('crypto');

const settings = require('./settings');

const app = express(); 
const port = 3000; //определили порт для соединения с приложением
const host = 'localhost'; 

// парсер для данных формы application/x-www-form-urlencoded
const urlencodedParser = bodyParser.urlencoded();

//правельные ответы
const true_answers = [2, 0, 0, 1, 2, 1, 3, 0, 3, 1];

function Session(sess_id){
    //опишем объект сессии
    this.sess_id = sess_id;
    
    this.gen = function(url){
        //сгенерировать url c ключём сессии
        if (url.indexOf('?') >=0 ){
            // в url уже есть ?
            url += '&sess_id=';
        } else {
            url += '?sess_id=';
        }
        url += this.sess_id;
        return url;
    }

    this.get_id = function(url){
        //извлеч sess_id  из url
        let match = url.match(/sess_id=([\da-f]+)/);
        if (match != null){
            this.sess_id = match[1];
            return this.sess_id;
        }
        return null;
    }

    this.det_data = function(){
        //получить данные сессии в виде объекта
    }
}


app.get('/', (req, res) => { // запрос email(начальная страница)    
    const compiledFunction = pug.compileFile(settings.dirs.TEMPLATES + 'index.pug');
    const resp = compiledFunction();
    res.send(resp);
}); 

app.post('/', urlencodedParser, (req, res) => {
    //получим значение email  из тела запроса
    const email = req.body.email;
    //выведем в лог
    console.log(email);
    //сгенерируем имя файла
    const hash_id = crypto.createHash('md5').update(email).digest('hex');
    const fn = hash_id + '.dat';
    const fn_path = settings.dirs.BASE + 'data/' + fn; //полный путь
    //создадим объект управления сессиями
    const sess = new Session(hash_id);
    if (fs.existsSync(fn_path)){
        //если файл создан, значит это не первый заход на сайт
        //прочитаем данные из файла
        data = JSON.parse( fs.readFileSync(fn_path) );
        if (!data.complete){
            //перенаправим на текущию страницу
            res.redirect(sess.gen('/quest' + data.current));
        } else {
            //или на страницу с результатами
            res.redirect(sess.gen('/results'));
        }   
        return;
    }
    data = {email: email, //емайл пользователя
            answers: [false, false, false, false, false, false, false, false, false, false], //правильность ответов
            current: 0, //текущий вопрос
            complete: 0, //признак завершенности
            summary: 0 //количество верных ответов
        };    
    fs.writeFileSync(fn_path, JSON.stringify(data), {flag: 'w'});
    res.redirect(sess.gen('/quest0'));
});

app.get('/quest:num', (req, res) => {
    const sess = new Session();
    const hash_id = sess.get_id(req.url); //получим ид сессии
    if (hash_id === null){ //hack detect - попытка войти без сессии
        res.redirect('/');
        return;
    }

    let num = parseInt(req.params.num); //приведем к целому
    num = num <= 9 && num >=0 ? num : 1; //ограничим от 0 до 9
    const compiledFunction = pug.compileFile(`${settings.dirs.TEMPLATES}quest_${num}.pug`);
    const resp = compiledFunction();
    res.send(resp);
}); 

app.post('/quest:num', urlencodedParser, (req, res) => {
    let num = parseInt(req.params.num); //номер вопроса
    const sess = new Session();
    const hash_id = sess.get_id(req.url); //получим ид сессии
    //сохраним данные ответа
    const fn = hash_id + '.dat';
    const fn_path = settings.dirs.BASE + 'data/' + fn; //полный путь
    if (fs.existsSync(fn_path)){
        data = JSON.parse( fs.readFileSync(fn_path) ); //получили данные
        if (!data.complete && 
            data.current != num){ 
            //проверим что пользователь действительно послал ответ на текущий вопрос
            //в противном случае отправим его обратно
            res.redirect(sess.gen('/quest' + data.current));
            return;
        } else {
            data.answers[num] = req.body.answ == true_answers[num]; //сохраним правильность ответа
            data.summary += data.answers[num] ? 1 : 0; //изменим счётчик правельных ответов
            num ++; //увеличим счётчик вопросов
            data.current = num;
            fs.writeFileSync(fn_path, JSON.stringify(data), {flag: 'w'}); //записали новые данные неа диск
            if (num >= data.answers.length){
                //ответили на все вопросы
                // переходим на страницу с результатами
                res.redirect(sess.gen('/results'));
                return
            }       
            res.redirect(sess.gen('/quest'+num));    
            return;
        }
    } else {
        // нету файла с данными. 
        // Вернуться на начало
        res.redirect('/');
        return;
    }
    //эта точка не будет достигнута, тем не мение мы вставляем этот код
    //в случае если будут внесены в будущем изменения и ктото забудет поставить return
    //именно поэтому делаем редирект на страницу /error
    res.redirect('/error');
}); 


// запускаем сервер на прослушивание порта
app.listen(port, host, () => {
    //Выводим в консоле сообщение о запуске сервера
    console.log(`Сервер запущен по адресу http://${host}:${port}/`); 
});

