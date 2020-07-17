const fs = require('fs');
const pug = require('pug');
const settings = require('./settings');

function admin(req, res) { // результаты всех тестов
    const data_dir = settings.dirs.BASE + 'data/';
    let list = {rows: []};
    const dirs = fs.readdirSync(data_dir);
    for (let i in dirs){
        const fn = dirs[i];
        const data = JSON.parse( fs.readFileSync(data_dir + fn) );
        list.rows.push({email: data.email,
                        summary: data.summary,
                        complete: data.complete});
    }
    const compiledFunction = pug.compileFile(settings.dirs.TEMPLATES + 'admin.pug');
    const resp = compiledFunction({list: list});
    res.send(resp);
}

module.exports.admin = admin;