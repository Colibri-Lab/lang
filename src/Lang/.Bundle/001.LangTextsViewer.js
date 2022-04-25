App.Modules.Lang.LangTextsViewer = class extends Colibri.UI.Viewer {

    constructor(name, container, element = '<span />', root = null) {
        super(name, container, element, root);
        this.AddClass('app-langtexts-viewer-component');

        this._value = null;

    }

    get value() {
        return this._value;
    }

    set value(value) {
        
        this._value = value;
        
        // super.value = this._value && this._value.toShortRUString();

    }

}
Colibri.UI.Viewer.Register('App.Modules.Lang.LangTextsViewer', 'Отображение текстов по ключу');