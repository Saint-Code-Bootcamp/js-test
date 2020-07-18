const express = require('express'); 
const pug = require('pug');
const bodyParser = require("body-parser");
const crypto = require('crypto');

const settings = require('./settings');
const Session = require('./sessions_db');
const admin = require('./admin');

const app = express(); 
const port = 3000; //определили порт для соединения с приложением
const host = 'localhost'; 

// парсер для данных формы application/x-www-form-urlencoded
const urlencodedParser = bodyParser.urlencoded();

//правельные ответы
const true_answers = [2, 0, 0, 1, 2, 1, 3, 0, 3, 1];


app.get('/', (req, res) => { // запрос email(начальная страница)
    const compiledFunction = pug.compileFile(settings.dirs.TEMPLATES + 'index.pug');
    const resp = compiledFunction();
    res.send(resp);
}); 

app.post('/', urlencodedParser, (req, res) => {    //получим значение email  из тела запроса
    const email = req.body.email;
    //выведем в лог
    console.log(email);
    //сгенерируем уникальный id сессии  по алгоритму md5
    const hash_id = crypto.createHash('md5').update(email).digest('hex');
    //создадим объект управления сессиями
    const sess = new Session(hash_id);
    if (sess.is_session()){
        //значит это не первый заход на сайт
        //прочитаем данные сессии
        data = sess.read_data();
        if (!data.complete){
            //перенаправим на текущию страницу
            res.redirect(sess.gen_url('/quest' + data.current));
        } else {
            //или на страницу с результатами
            res.redirect(sess.gen_url('/results'));
        }   
        return;
    }
    // сессия не создана - это первый вход. Проинициализируем данные сессии
    data = {email: email, //емайл пользователя
            answers: [false, false, false, false, false, false, false, false, false, false], //правильность ответов
            current: 0, //текущий вопрос
            complete: 0, //признак завершенности
            summary: 0 //количество верных ответов
        };    
    //сохраним данные сессии
    sess.write_data(data);
    res.redirect(sess.gen_url('/quest0'));
});

app.get('/quest:num', (req, res) => { //отобразим вопрос и варианты ответа
    const sess = new Session();
    sess.get_id(req.url); //получим ид сессии
    if (!sess.is_session()){ //hack detect - попытка войти без сессии
        res.redirect('/');
        return;
    }
    let num = parseInt(req.params.num); //приведем к целому
    num = num <= 9 && num >=0 ? num : 0; //ограничим от 0 до 9
    const compiledFunction = pug.compileFile(`${settings.dirs.TEMPLATES}quest_${num}.pug`);
    const resp = compiledFunction();
    res.send(resp);
}); 

app.post('/quest:num', urlencodedParser, (req, res) => { //обработаем ответ пользователя
    let num = parseInt(req.params.num); //номер вопроса
    const sess = new Session();
    sess.get_id(req.url); //получим ид сессии
    //сохраним данные ответа
    if (sess.is_session()){
        data = sess.read_data(); //получили данные
        if (!data.complete && 
            data.current != num){ 
            //проверим что пользователь действительно послал ответ на текущий вопрос
            //в противном случае отправим его обратно
            res.redirect(sess.gen_url('/quest' + data.current));
            return;
        } else {
            data.answers[num] = req.body.answ == true_answers[num]; //сохраним правильность ответа
            data.summary += data.answers[num] ? 1 : 0; //изменим счётчик правельных ответов
            num ++; //увеличим счётчик вопросов
            data.current = num;
            sess.write_data(data); //записали новые данные
            if (num >= data.answers.length){
                //ответили на все вопросы
                // переходим на страницу с результатами
                data.complete = 1;
                sess.write_data(data); //записали новые данные
                res.redirect(sess.gen_url('/results'));
                return
            }       
            res.redirect(sess.gen_url('/quest'+num));    
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

app.get('/results', (req, res) => {// выведем результаты теста
    const sess = new Session();
    sess.get_id(req.url); 
    if (!sess.is_session()){ //hack detect 
        res.redirect('/');
        return;
    }
    const data = sess.read_data();
    const compiledFunction = pug.compileFile(`${settings.dirs.TEMPLATES}result.pug`);
    const resp = compiledFunction({
        email: data.email,
        cnt: data.summary,
        total: data.answers.length,
        reseturl: sess.gen_url('/reset')
        });
    res.send(resp);
});

app.get('/reset', (req, res) => { //(промежуточная страница) сбросить все данные и пройти тест заново
    const sess = new Session();
    sess.get_id(req.url); 
    if (!sess.is_session()){ //hack detect 
        res.redirect('/');
        return;
    }
    sess.delete();
    res.redirect('/');
});

app.get('/admin', admin.admin);
app.get('/admin_order', admin.admin_order);


// запускаем сервер на прослушивание порта
app.listen(port, host, () => {
    //Выводим в консоле сообщение о запуске сервера
    console.log(`Сервер запущен по адресу http://${host}:${port}/`); 
});

