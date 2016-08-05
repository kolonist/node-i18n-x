/**
 * i18n middleware for Express.
 * Inspired by https://github.com/mashpie/i18n-node and
 *             https://github.com/jeresig/i18n-node-2
 *
 * Note than in opposite to libraries above this one cannot be used separately
 * but only as Express middleware.
 *
 * This library is minimalistic and easy to use alternative to libraries
 * mentioned above with ability to dinamically change directory with
 * localization files (e.g. if you have several independant modules and each has
 * own templates and own locale files).
 *
 * @author  Alexander Zubakov <developer@xinit.ru>
 * @link    https://github.com/kolonist/i18n
 * @license http://opensource.org/licenses/MIT
 *
 * @version 0.0.1
 */

const path       = require('path');
const fs         = require('fs');
const mkdirp     = require('mkdirp');
const vsprintf   = require('sprintf').vsprintf;
const langParser = require('accept-language-parser');

/**
 * Default options for i18n class.
 * @const object
 */
const defaultOptions = {
      locales       : ['en']
    , defaultLocale : 'en'
    , directory     : 'locales'
    , baseDir       : '.'
    , queryParamName: 'lang'
    , cookieName    : 'lang'
    , sessionVarName: 'lang'
    , envVarName    : 'LANG'
    , order         : ['query', 'session', 'cookie', 'subdomain', 'headers', 'environment']
    , json_space    : 4
}

/**
 * Function names corresponding to setLocaleOrder options.
 * @const object
 */
const localeMethods = {
      environment: 'setLocaleFromEnvironment'
    , query      : 'setLocaleFromQuery'
    , session    : 'setLocaleFromSession'
    , cookie     : 'setLocaleFromCookie'
    , subdomain  : 'setLocaleFromSubdomain'
    , headers    : 'setLocaleFromHeaders'
}

/**
 * Public API methods wich will present in Express (request.i18n.*)
 * @const array
 */
const i18n_api = ['getLocale', 'setLocale', '__', 'setBaseDir', 'setDirectory'];

/**
 * Public API methods wich will present in template engine (Express
 * res.locals.*)
 * @const array
 */
const locals_api = ['__'];

/**
 * Locale files cache.
 * @const object
 */
const i18nCache = {};


/**
 * Main class.
 */
const i18n = class {
    /**
     * Constructor
     */
    constructor(options) {
        this.setOptions(options);
        this.cache = i18nCache;
    }

    /**
     * Set options.
     * @param object opt Options.
     */
    setOptions(options) {
        this.options = Object.assign({}, defaultOptions);
        Object.assign(this.options, options);
    }

    /**
     * Get current locale.
     */
    getLocale() {
        return this.options.locale;
    }

    /**
     * Set base directory for localization files. It can be useful e.g. if you
     * have several independant modules and each contains localization directory
     * with different localization files.
     *
     * @param string dir Directory path.
     */
    setBaseDir(dir) {
        this.options.baseDir = dir;
    }

    /**
     * Set directory for localization files. It will be located inside base
     * directory previosly set by setBaseDir() or defined in options 'baseDir'
     * parameter while initialization.
     *
     * @param string dir Directory path.
     */
    setDirectory(dir) {
        this.options.directory = dir;
    }

    /**
     * Define proper locale. It will try localization methods in order defined
     * in options.order until first success. If no one method successed then
     * default locale applies.
     *
     * @param object req Express Request object.
     */
    defineLocale(req) {
        const isLocaleSet = this.options.order.some(method => {
            return this[localeMethods[method]](req);
        });

        if (!isLocaleSet) {
            this.locale = this.options.defaultLocale;
        }
    }

    /**
     * Set locale manually.
     *
     * @param string locale
     * @return boolean True if locale successfully set using this function or
     *                 False if locale could not be set in this function for
     *                 some reason.
     */
    setLocale(locale) {
        locale = locale.toLowerCase();

        if (!this.options.locales.includes(locale)) {
            return false;
        }

        this.options.locale = locale;
        return true;
    }

    /**
     * Set locale from session variable defined in options.sessionVarName.
     *
     * @param object req Express Request object.
     * @return boolean True if locale successfully set using this function or
     *                 False if locale could not be set in this function for
     *                 some reason.
     */
    setLocaleFromSession(req) {
        if (!req.session || !req.session[this.options.sessionVarName]) {
            return false;
        }

        const locale = req.session[this.options.sessionVarName];
        return this.setLocale(locale);
    }

    /**
     * Set locale from query parameter defined in options.queryParamName.
     *
     * @param object req Express Request object.
     * @return boolean True if locale successfully set using this function or
     *                 False if locale could not be set in this function for
     *                 some reason.
     */
    setLocaleFromQuery(req) {
        if (!req.query || !req.query[this.options.queryParamName]) {
            return false;
        }

        const locale = req.query[this.options.queryParamName];
        return this.setLocale(locale);
    }

    /**
     * Set locale from subdomain.
     *
     * @param object req Express Request object.
     * @return boolean True if locale successfully set using this function or
     *                 False if locale could not be set in this function for
     *                 some reason.
     */
    setLocaleFromSubdomain(req) {
        if (req.subdomains.length === 0) {
            return false;
        }

        const locale = req.subdomains[req.subdomains.length - 1];
        return this.setLocale(locale);
    }

    /**
     * Set locale from cookie defined in options.cookieName.
     *
     * @param object req Express Request object.
     * @return boolean True if locale successfully set using this function or
     *                 False if locale could not be set in this function for
     *                 some reason.
     */
    setLocaleFromCookie(req) {
        if (!req.cookies || !req.cookies[this.options.cookieName]) {
            return false;
        }

        const locale = req.cookies[this.options.cookieName];
        return this.setLocale(locale);
    }

    /**
     * Set locale from environment variable defined in options.envVarName.
     *
     * @param object req Express Request object.
     * @return boolean True if locale successfully set using this function or
     *                 False if locale could not be set in this function for
     *                 some reason.
     */
    setLocaleFromEnvironment() {
        if (!process.env[this.options.envVarName]) {
            return false;
        }

        const locale = process.env[this.options.envVarName].split('_')[0];
        return this.setLocale(locale);
    }

    /**
     * Set locale from Accept-Language HTTP request header.
     *
     * @param object req Express Request object.
     * @return boolean True if locale successfully set using this function or
     *                 False if locale could not be set in this function for
     *                 some reason.
     */
    setLocaleFromHeaders(req) {
        if (!req.get('Accept-Language')) {
            return false;
        }

        const acceptLocales = langParser.parse(req.get('Accept-Language'));
        if (acceptLocales.length === 0) {
            return false;
        }

        const locale = acceptLocales[0].code;
        return this.setLocale(locale);
    }

    /**
     * Return localisation file according to provided locale or array of all
     * localisation files if no locale given.
     */
    getLocaleFiles(locale = null) {
        const basePath = path.join(this.options.baseDir, this.options.directory);

        if (!locale) {
            return this.options.locales.map(
                locale => path.join(basePath, `${locale}.json`)
            );
        } else {
            return path.join(basePath, `${locale}.json`);
        }
    }

    /**
     * Read locale file and parse it as JSON object. If no file exists or it
     * couldn't be parsed as JSON then empty object returned.
     *
     * @param string filename Full path to file.
     * @return object Key-value localization object.
     */
    readFile(filename) {
        try {
            const buf  = fs.readFileSync(filename, { encoding: 'utf8' });
            const json = JSON.parse(buf);
            return json;
        } catch(err) {
            return {};
        }
    }

    /**
     * Return key-value object to use when translate key strings into their
     * localized values.
     *
     * @param string locale Locale.
     * @return object Object containing kay-value pairs with key strings and
     *                their translations.
     */
    getLang(locale) {
        const langFile = this.getLocaleFiles(locale);

        if (!this.cache.hasOwnProperty(langFile)) {
            this.cache[langFile] = this.readFile(langFile);
        }

        return this.cache[langFile];
    }

    /**
     * Write json object to file.
     *
     * @param string filename Full path to file.
     * @param object json Key-value object to write in file.
     */
    writeFile(filename, json) {
        const dir = path.dirname(filename);
        try {
            fs.accessSync(dir, fs.constants.W_OK);
        } catch(err) {
            mkdirp.sync(dir);
        }

        const buf = JSON.stringify(json, null, this.options.json_space);
        fs.writeFileSync(filename, buf);
    }

    /**
     * Write new key string in localization files.
     *
     * @param string s String to translate.
     */
    setLangString(s) {
        const files = this.getLocaleFiles();
        files.forEach(file => {
            const lang = this.readFile(file);

            if (!lang.hasOwnProperty(s)) {
                lang[s] = '';
                this.writeFile(file, lang);
            }

            if (!this.cache.hasOwnProperty(file)) {
                lang[s] = s;
                this.cache[file] = lang;
            }

            if (!this.cache[file].hasOwnProperty(s)) {
                this.cache[file][s] = s;
            }

        });
    }

    /**
     * Translate string according to provided locale.
     *
     * @param string s String to translate.
     * @param string locale Locale to use in translation.
     * @return string Translated string.
     */
    translateString(s, locale) {
        const lang = this.getLang(locale);

        if (!lang.hasOwnProperty(s)) {
            this.setLangString(s);
            return s;
        }

        return lang[s];
    }

    /**
     * Localize string.
     *
     * @param string s String to localize.
     * @param [null, array] args Array of arguments to use in vsprintf()
     *                           function (https://github.com/alexei/sprintf.js)
     *                           or null if there is no need to additionally
     *                           format string (default).
     * @return string Localized string.
     */
    __(s, args = null) {
        s = this.translateString(s, this.getLocale());

        return args === null ? s : vsprintf(s, args);
    }
}


/**
 * Initialize Express middleware.
 * @param object options
 */
const init = (options = {}) => {
    return (req, res, next) => {
        const i18nInst = new i18n(options);

        req.i18n = {};
        i18n_api.forEach(
            func => req.i18n[func] = i18nInst[func].bind(i18nInst)
        );

        locals_api.forEach(
            func => res.locals[func] = i18nInst[func].bind(i18nInst)
        );

        i18nInst.defineLocale(req);
        next();
    }
}


module.exports = init;
