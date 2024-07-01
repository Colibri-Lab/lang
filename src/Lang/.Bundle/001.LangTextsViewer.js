App.Modules.Lang.LangTextsViewer = class extends Colibri.UI.Viewer {

    constructor(name, container, element = null, root = null) {
        super(name, container, element || Element.create('span'), root);
        this.AddClass('app-langtexts-viewer-component');

        this._value = null;

    }

    get value() {
        return this._value;
    }

    set value(value) {
        
        this._value = value;

        const vv = [];
        Object.forEach(value, (k, v) => {
            if(v) {
                vv.push(k + ': ' + v);
            }
        });
        super.value = vv.join('<br />');
        
        // super.value = this._value && this._value.toShortRUString();

    }

}
Colibri.UI.Viewer.Register('App.Modules.Lang.LangTextsViewer', 'Отображение текстов по ключу');