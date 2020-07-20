const settings = require('./settings');
const pug = require('pug');
const mysql = require('sync-mysql');

const connection = new mysql({
    host: "localhost",
    user: "jstest",
    database: "jstest",
    password: "jstest"
}); 


function admin(req, res) { // результаты всех тестов
    const list = connection.query(`SELECT * FROM results WHERE 1`);
    const compiledFunction = pug.compileFile(settings.dirs.TEMPLATES + 'admin.pug');
    const resp = compiledFunction({list: list});
    res.send(resp);
}

function admin_order(req, res) { // результаты всех тестов
    const list = connection.query(`SELECT * FROM results WHERE 1 ORDER BY summary`); //добавляем ORDER BY для сортировки результата
    const compiledFunction = pug.compileFile(settings.dirs.TEMPLATES + 'admin.pug');
    const resp = compiledFunction({list: list});
    res.send(resp);
}

module.exports.admin = admin;
module.exports.admin_order = admin_order;