'use strict'
const path         = require('path');
const express      = require('express');
const cookieParser = require('cookie-parser');

const i18n = require('../lib/i18n');


const app = express();
app.use(cookieParser());

// enable i18n
app.use(i18n({
      locales : ['en', 'ru']
    , baseDir : path.resolve(__dirname, 'template')
    , jointDir: path.resolve(__dirname, 'locales')
}));

app.set('view engine', 'pug');


app.get('/', (req, res) => {
    const template = path.resolve(__dirname, 'template', 'template.pug');

    const options = { locale: req.i18n.getLocale() };
    res.render(template, options);
});

app.get('/1', (req, res) => {
    const baseDir = path.resolve(__dirname, 'template_1');
    const template = path.resolve(baseDir, 'template.pug');
    req.i18n.setBaseDir(baseDir);

    const options = { locale: req.i18n.getLocale() };
    res.render(template, options);
});

app.get('/dumpAllStrings', (req, res) => {
    res.send(req.i18n.dumpAllStrings())
});

app.listen(3000, () => {
    console.log('Test app listening on port 3000!');
});
