
// try {
//     
//     Object.isLangObject = function(object) {
//         const keys = Object.keys(LangData);
//         console.log(keys);
//         const objectKeys = Object.keys(object);
//         const intersect = objectKeys.filter(v => !keys.includes(v));
//         return (intersect.length == 0);
//     }

//     Object.convertToExtended = function(object) {
//         if(!Object.isObject(object)) {
//             return object;
//         }
//         if(Object.isLangObject(object)) {
//             return object[Lang.Current];
//         }
//         return object;
//     }
// }
// catch(e) {
//     console.error('can not modify Object for language support', e);
// }

App.Modules.Lang = class extends Colibri.Modules.Module {

    _mainFrame = null;

    /** @constructor */
    constructor() {
        super('Lang');
        
        this._langCookie = 'lang';
    }

    InitializeModule() {
        super.InitializeModule();
        console.log('Initializing module Lang');
               
        this._store = App.Store.AddChild('app.lang', {}, this);
        this._store.AddPathLoader('lang.settings', 'Lang:Lang.Settings');
        this._store.AddPathLoader('lang.langs', 'Lang:Lang.Langs');
        this._store.AddPathLoader('lang.texts', () => this.Texts('', false, 1, 50, true));
        this._store.AddHandler('StoreLoaderCrushed', (event, args) => {
            if(args.status === 403) {
                location.reload();
            }
        });
        this.AddHandler('CallError', (event, args) => {
            if(args.status === 403) {
                location.reload();
            }
        });

    }

    get Store() {
        return this._store;
    }

    Render() {
        console.log('Rendering Module Lang');    
    }

    RegisterEvents() {
        super.RegisterEvents();
        console.log('Registering module events for Lang');
        this.RegisterEvent('LanguageChanged', false, 'When language was changed');
    }

    RegisterEventHandlers() {
        super.RegisterEventHandlers();
        console.log('Registering event handlers for Lang');
    }

    ChangeLanguage(lang) {
        if(Colibri.Common.Cookie.Get('lang') !== lang) {
            Colibri.Common.Cookie.Set('lang', lang, 365, '/', location.hostname);
            Colibri.Common.Delay(100).then(() => {
                location.reload();
            });
        }
    }

    get Current() {

        if(this._current) {
            return this._current;
        }

        if(Colibri.Common.Cookie.Get('lang')) {
            this._current = Colibri.Common.Cookie.Get('lang');
        }
        else {
            Object.forEach(LangData, (name, value) => {
                if(value.default) {
                    this._current = name;
                }
            });    
        }

        return this._current;
    }

    set langCookie(value) {
        this._langCookie = value;
    }
    get langCookie() {
        return this._langCookie;
    }

    Texts(term, notfilled, page, pagesize, returnPromise) {

        const promise = this.Call('Lang', 'Texts', {term: term, notfilled: notfilled, page: page, pagesize: pagesize, __raw: 1});
        if(returnPromise) {
            return promise;
        }

        promise
            .then((response) => {
                const saved = response.result;
                let texts = this._store.Query('lang.texts');
                if(page == 1) {
                    texts = saved;
                }
                else {
                    Object.forEach(saved, (key, lang) => {
                        texts[key] = lang;
                    })
                }
                this._store.Set('lang.texts', texts);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });

    }

    SaveLang(langData) {
        this.Call('Lang', 'SaveLang', {lang: langData})
            .then((response) => {
                const saved = response.result;
                let langs = this._store.Query('lang.langs');
                langs[langData.key] = saved;
                this._store.Set('lang.langs', langs);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });    
    }

    DeleteLang(langKey) {
        this.Call('Lang', 'DeleteLang', {lang: langKey})
            .then((response) => {
                let langs = this._store.Query('lang.langs');
                delete langs[langKey];
                this._store.Set('lang.langs', langs);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    
    }

    DeleteText(textKeys) {
        this.Call('Lang', 'DeleteText', {texts: textKeys})
            .then((response) => {
                let texts = this._store.Query('lang.texts');
                textKeys.forEach((textKey) => {
                    delete texts[textKey];
                });
                this._store.Set('lang.texts', texts);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    
    }

    SaveText(textData) {
        this.Call('Lang', 'SaveText', {text: textData})
            .then((response) => {
                const saved = response.result;
                let texts = this._store.Query('lang.texts');
                texts[textData.key] = saved;
                this._store.Set('lang.texts', texts);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });    
    }

    TranslateText(textsData, langFrom, langTo) {
        if(textsData.length > 10) {
            App.Loading.Show();
        }
        this.Call('Lang', 'CloudTranslate', {texts: textsData, langFrom: langFrom, langTo: langTo})
            .then((response) => {
                
                if(textsData.length > 10) {
                    App.Loading.Hide();
                }
                
                const saved = response.result;
                let texts = this._store.Query('lang.texts');
                Object.forEach(saved, (k, s) => {
                    texts[k] = s;
                });
                this._store.Set('lang.texts', texts);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });    
    }

    TranslateTextObject(textData, langFrom, langTo) {
        return this.Call('Lang', 'CloudTranslateObject', {__raw: 1, text: textData, langFrom: langFrom, langTo: langTo});
    }

}
const Lang = new App.Modules.Lang();
Lang.isLangObject = function(obj) {
    if(!LangData) {
        throw 'Can not get LangData object';
    }

    const availableLangs = Object.keys(LangData);
    const objectKeys = Object.keys(obj);
    for(const key of objectKeys) {
        if(!availableLangs.contains(key)) {
            return false;
        }
    }
    return true;
};
Lang.Translate = function(value, lang = null) {
    if(!lang) {
        lang = Lang.Current;
    }
    if(Object.isObject(value)) {
        if(Object.keys(value).indexOf(lang) !== -1) {
            return (value[lang]) + '';
        } else {
            return value;
        }
    } else if(typeof value === 'string') {
        try {
            const v = JSON.parse(value);
            if(Object.isObject(v)) {
                return v[lang];
            } else {
                return value;
            }
        } catch(e) {
            return value;
        }
    }
    return value;
};
Lang.TranslateObject = function(obj, lang = null) {
    if(Lang.isLangObject(obj)) {
        return Lang.Translate(obj, lang);
    }
    Object.forEach(obj, (name, value) => {
        if(Object.isObject(value) && typeof value != 'function') {
            obj[name] = Lang.TranslateObject(value, lang);
        } else if(Array.isArray(value)) {
            const v = [];
            for(const v of value) {
                v.push(Lang.TranslateObject(v, lang));
            }
            obj[name] = v;
        }
    });
    return obj;
};
Lang.Update = function(value, object) {
    if(Object.isObject(value)) {
        return value;
    } else if(Object.isObject(object)) {
        object[Lang.Current] = value;
        return object;
    }
    return value;
};
Lang.ConvertObject = function(value) {
    const newV = {};
    let keys = [];
    let langs = [];
    Object.forEach(value, (lang, v) => {
        keys = keys.concat(Object.keys(v));
        langs.push(lang);
    });
    keys = Array.unique(keys);
    
    for(const key of keys) {
        newV[key] = {};
        for(const lang of langs) {
            newV[key][lang] = value[lang][key];
        }
    }
    return newV;
};
App.Modules.Lang.Icons = {};
App.Modules.Lang.Icons.Text = '<svg width="29" height="27" viewBox="0 0 29 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.34378 11H9.34378V17H7.34378V11Z" fill="black"/><path d="M3.34378 7H5.34378V21H3.34378V7Z" fill="black"/><path d="M23.3438 7H25.3438V21L23.3438 21V7Z" fill="black"/><path d="M25.3438 7V9L3.34378 9L3.34378 7H25.3438Z" fill="black"/><path d="M25.3438 19V21H3.34378L3.34378 19L25.3438 19Z" fill="black"/><path d="M10.5 11H12.5V17H10.5V11Z" fill="black"/><path d="M7.5 11H15.5V12.5H7.5V11Z" fill="black"/><path d="M7.5 11H15.5V12.5H7.5V11Z" fill="black"/><path d="M13.5 11H15.5V17H13.5V11Z" fill="black"/></svg>';

