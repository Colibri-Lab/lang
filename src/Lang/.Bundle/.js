


App.Modules.Lang = class extends Colibri.Modules.Module {

    _mainFrame = null;

    /** @constructor */
    constructor() {
        super('Lang');
        
    }

    InitializeModule() {
        console.log('Initializing module Lang');
        
        this._store = App.Store.AddChild('app.lang', {});
        this._store.AddPathLoader('lang.langs', 'Lang:Lang.Langs');
        this._store.AddPathLoader('lang.texts', () => 'Lagn:Lagn:Texts');
        
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

}


const Lang = new App.Modules.Lang();

