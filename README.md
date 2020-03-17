# i18n-x
i18n middleware for Express, inspired by
[i18n-node](https://github.com/mashpie/i18n-node) and
[i18n-node-2](https://github.com/jeresig/i18n-node-2) libraries.

In opposite to libraries mentioned above this one cannot be used separately but
only as Express middleware.

This library is minimalistic and easy to use alternative to libraries mentioned
above with ability to dinamically change directory with localization files
(e.g. if you have several independant modules and each has own templates and own
locale files).

# Installation
```bash
npm i i18n-x --save
```

# Usage
## Main application:
```javascript
'use strict'

const path         = require('path');
const express      = require('express');
const cookieParser = require('cookie-parser');

// this library
const i18n = require('i18n-x');

// create Express application
const app = express();
app.use(cookieParser());

// enable i18n
app.use(i18n({
      // array of locales to use in application
      locales: ['en', 'ru']
}));

// use Pug (formerly Jade)
app.set('view engine', 'pug');

// handle user request
app.get('/', (req, res) => {
    // template path
    const template = path.resolve(__dirname, 'template', 'template.pug');

    // current locale
    const options = { locale: req.i18n.getLocale() };
    res.render(template, options);
});

// run Express application
app.listen(3000, () => {
    console.log('Test app listening on port 3000!');
});
```

## `${__dirname}`/template/template.pug:
```jade
doctype html
html(lang= __('lang'))
    head
        title= __('title')

    body
        h1= __('node-i18n-x test page')
        h2 #{__('current locale:')} #{locale}

        h2= __('try these links:')
        ol
            li
                a(href="/") #{__('default lang')}
            li
                a(href="/?lang=en") #{__('manually set default lang')}
            li
                a(href="/?lang=ru") #{__('russian lang')}
```

`__()` function will be exported to templates through `res.locals.__()`.<br>
If you need to use `__()` in your program directly, you should use
`req.i18n.__()`.

## locales/en.json:
```json
{
    "lang": "en",
    "title": "Page title",
    "node-i18n-x test page": "Test page of node-i18n-x",
    "try these links:": "Try these links:",
    "default lang": "Default language",
    "manually set default lang": "Manually set default language",
    "russian lang": "Russian localization",
}

```

You need file with the same structure named `ru.json` to contain translation for
key phrases from template. If there is no such file then it will be created
automatically with all keys you used in templates or in program itself using
`__()` function.

`locales` in current application is default directory to store localization JSON
files. You can change it per application in `i18n({baseDir, directory})`
function  or per request using `req.i18n.setBaseDir()` and
`req.i18n.setDirectory()`.

Path to localization JSON files defined using `baseDir` and `directory` in the
following way:<br>
`baseDir + directory + '/*.json'`

All localization files cached by library when they are first used so you don't
need to worry about file system performance.

# API
## `i18n(options)`
This is the only function exported by `i18n-x`. Used to initialize Express
middleware.

### Parameters
#### `options`
Key-value object with the following optional keys:
```javascript
{
      locales                 : ['en']
    , defaultLocale           : 'en'
    , convertLocaleToLowerCase: true
    , jointDir                : 'locales'
    , baseDir                 : '.'
    , directory               : 'locales'
    , queryParamName          : 'lang'
    , cookieName              : 'lang'
    , sessionVarName          : 'lang'
    , envVarName              : 'LANG'
    , json_space              : 4
    , order: [
          'query'
        , 'session'
        , 'cookie'
        , 'subdomain'
        , 'headers'
        , 'environment'
    ]
}
```

##### `locales`
`array` containing `strings` with locales your application supports.<br>
**Default**: `['en']`

The only parameter you really need to start wotking with the library. Provided
values can be used as values of corresponding cookies, query params, subdomains,
etc. You also need localization JSON files with names from this array and
`.json` extention.

##### `defaultLocale`
`string` containing locale to use when other locale is not provided to your
application or can't be defined for some reason.<br>
**Default**: `'en'`

##### `convertLocaleToLowerCase`
`boolean` When true then locales set from `setLocale()` functions will
automatically be converted to lowercase. So it will always use `en.json` when
you call `setLocale('En')`, `setLocale('eN')`, `setLocale('EN')` manually or
some of `setLocaleFrom***()` called automatically.<br>
**Default**: `true`

##### `jointDir`
`string` containing directory with localization files common for all
application.<br>
**Default**: `'locales'`

This directory will be read and cached at the start of the application when
library initialized and it cannot be changed later. Use it to localize common
parts of application, e.g. main menu or footer.

If you use the same localization string in this common file and in unit
specific file defined by `baseDir` and `directory` then value from specific
file will be used.

If this directory or file for some language not exists then it will be ignored.

##### `baseDir`
`string` containing base directory for constructing localization file path<br>
**Default**: `'.'`

Path to localization JSON files defined using `options.baseDir` and `options.directory` in the following way:
```javascript
path = require('path');
path.join(options.baseDir, options.directory, `${locale}.json`
```

where `locale` is one of `options.locales`.<br>
If directory or filename not exists then it will be created by this library.

##### `directory`
`string` containing directory for constructing localization file path<br>
**Default**: `'locales'`

See `baseDir` description above to know how Path to localization files
defined.

##### `queryParamName`
`string` containing query string parameter (e.g. `?lang=ru`) to define
localization<br>
**Default**: `'lang'`

This parameter will be automatically used by library to define current locale.

##### `cookieName`
`string` containing name of cookie to define localization<br>
**Default**: `'lang'`

This parameter will be automatically used by library to define current locale.
Note that you need to load special Express middleware to work with cookies
before using this library.

##### `sessionVarName`
`string` containing name of session variable to define localization<br>
**Default**: `'lang'`

This parameter will be automatically used by library to define current locale.
You probably need Express middleware to work with sessions to be loaded before
this library.

##### `envVarName`
`string` containing name of environment variable to define localization<br>
**Default**: `'LANG'`

This parameter will be automatically used by library to define current locale.

##### `json_space`
`[integer, string]` contain third parameter of `JSON.stringify()` function which
used to store localization files<br>
**Default**: `4`


##### `order`
`array` containing `strings` to define order of checks used to define current
locale<br>
**Default**:
```javascript
[
      'query'       // use GET query string to define locale
    , 'session'     // use session
    , 'cookie'      // use cookie
    , 'subdomain'   // use domain with biggest level, i.e. 'ru' in ru.zerofq.com
    , 'headers'     // use Accept-Language HTTP request header
    , 'environment' // use environment variable (i.e. for electron apps)
]
```

You can remove any of these params (or even all of them to set locale manually
with `req.i18n.setLocale()` function) or place them in order you wish.

Locale will be set by first acceptable method in array. That means that for
default value of `order` locale will be set by query if it exists and correct.
If query parameter from `options.queryParamName` does not exists in query then
locale will be set from session. If there is no session or there are
no `options.sessionVarName` in session then cookie will be used and so on. If
locale could not be set by any of mentioned methods then default locale
(`options.defaultLocale`) will be used.

### Example
```javascript
const i18n = require('i18n-x');

app.use(i18n({
      locales      : ['en', 'ru']
    , defaultLocale: 'ru'
    , baseDir      : path.join(__dirname, 'index')
    , order        : ['query', 'session']
}));
```

After applying middleware you can use `i18n` object in Express request object in
all other middlewares:

```javascript
app.get('/', (req, res) => {
    const options = { locale: req.i18n.getLocale() };
});
```

Also you can use `__()` function in your templates:

```jade
doctype html
html(lang= __('lang'))
    head
        title= __('title')
    body
        h1= __('node-i18n-x test page')
```

## `req.i18n`
### `req.i18n.getLocales()`
Return array of locales used by application. It is value defined
in `options.locales`.

**Return** *`array`* Locales.

### `req.i18n.getLocale()`
Return current locale automatically defined by library using methods mentioned
in `options.order`. It always one of `options.locales` values.

**Return** *`string`* Current locale.

### `req.i18n.getDefaultLocale()`
Return default locale. Can be used in templates, e.g. to avoid creating subdomain for default locale when using domain defined locales, so you can use `ru.example.com`, `es.example.com` and just `example.com` instead of `en.example.com`. It is `options.defaultLocale` value.

**Return** *`string`* Default locale.

### `req.i18n.setLocale(locale)`
Allows you to set locale manually.

**Param** *`string`* `locale` Locale you want to use in current request. Should
be one of `options.locales`.

**Return** *`boolean`* If locale was successfully set by this function call then
return value is `true`. If function fails for some reason (i.e. you used string
nod defined in `options.locales`) then it returns `false` and does not change
locale previously defined by library.

### `req.i18n.setBaseDir(dirname)`
Set base directory for localization files. This function affects only on current
request and doesn't change options set in `i18n()`.

It's recommended that you will change only `baseDir` in your code and don't
touch `directory` option. Using this function you can organise your project this
manner:
```
+ root app dir/
    |- app.js
    +- routes/
        +- main/
        |   |- route.js
        |   |- template.pug
        |   +- locales/
        |       |- en.json
        |       |- ru.json
        |
        +- unit1/
        |   |- route.js
        |   |- template.pug
        |   +- locales/
        |       |- en.json
        |       |- ru.json
        |
        +- unit2/
        |   |- route.js
        |   |- template.pug
        |   +- locales/
        |       |- en.json
        |       |- ru.json
        ...
```

In this example you should write your routes something like this:

```javascript
app.get('/1', (req, res) => {
    // base directory is directory where this route allocated
    const baseDir = __dirname;

    const template = path.join(baseDir, 'template.pug');

    // now localisation files will be in `${__dirname}/locales/`
    req.i18n.setBaseDir(baseDir);

    res.render(template, options);
});
```

**Param** *`string`* `dirname` Directory path.

### `req.i18n.setDirectory(dirname)`
Set trailing part of path where localization JSON files allocated. This function
affects only on current request and doesn't change options set in `i18n()`.

Default value is `locales` and you probably don't need to change it using this
function, but you can change `baseDir` instead.

If you want to change this directory to whole application you can do it
in `i18n(options)` while middleware initialization.

**Param** *`string`* `dirname` Directory path.

### `req.i18n.__(str, params = null)`
Translate string using `str` as key in localization file defined by current
locale.

**Param** *`string`* `str` String to translate.<br>
**Param** *`array`* `params` Array of arguments to use in `vsprintf()` function
from [sprintf](https://github.com/alexei/sprintf.js) library or `null` if there
is no need to additionally format string (default).

### `req.i18n.dumpAllStrings(locale)`
Dump all strings according to provided or current locale.

**Param** *[`null`, `string`]* `locale` Locale to use in translation.

**Return** *`object`* Object containing kay-value pairs with key strings and
their translations.
