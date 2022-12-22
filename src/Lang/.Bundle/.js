


App.Modules.Lang = class extends Colibri.Modules.Module {

    _mainFrame = null;

    /** @constructor */
    constructor() {
        super('Lang');
        
    }

    InitializeModule() {
        super.InitializeModule();
        console.log('Initializing module Lang');
        
        this._store = App.Store.AddChild('app.lang', {});
        this._store.AddPathLoader('lang.settings', 'Lang:Lang.Settings');
        this._store.AddPathLoader('lang.langs', 'Lang:Lang.Langs');
        this._store.AddPathLoader('lang.texts', () => this.Texts('', false, 1, 50, true));
        
    }

    get Store() {
        return this._store;
    }

    Render() {
        console.log('Rendering Module Lang');    
    }

    RegisterEvents() {
        console.log('Registering module events for Lang');
    }

    RegisterEventHandlers() {
        console.log('Registering event handlers for Lang');
    }

    get Current() {

        if(this._current) {
            return this._current;
        }

        if(Colibri.Common.Cookie.Get('lang')) {
            this._current = Colibri.Common.Cookie.Get('lang');
        }
        else {
            const langs = this._store.Query('lang.langs');
            Object.forEach(langs, (name, value) => {
                if(value.default) {
                    this._current = name;
                }
            });    
        }

        return this._current;
    }

    Texts(term, notfilled, page, pagesize, returnPromise) {

        const promise = this.Call('Lang', 'Texts', {term: term, notfilled: notfilled, page: page, pagesize: pagesize});
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
App.Modules.Lang.Icons = {};
App.Modules.Lang.Icons.Text = '<svg width="29" height="27" viewBox="0 0 29 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.34378 11H9.34378V17H7.34378V11Z" fill="black"/><path d="M3.34378 7H5.34378V21H3.34378V7Z" fill="black"/><path d="M23.3438 7H25.3438V21L23.3438 21V7Z" fill="black"/><path d="M25.3438 7V9L3.34378 9L3.34378 7H25.3438Z" fill="black"/><path d="M25.3438 19V21H3.34378L3.34378 19L25.3438 19Z" fill="black"/><path d="M10.5 11H12.5V17H10.5V11Z" fill="black"/><path d="M7.5 11H15.5V12.5H7.5V11Z" fill="black"/><path d="M7.5 11H15.5V12.5H7.5V11Z" fill="black"/><path d="M13.5 11H15.5V17H13.5V11Z" fill="black"/></svg>';

