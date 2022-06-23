


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

}


const Lang = new App.Modules.Lang();

