App.Modules.Lang.LangToolBar = class extends Colibri.UI.Toolbar {

    constructor(name, container) {
        super(name, container);
        this.AddClass('app-langtoolbar-component');
    }

    __renderBoundedValues(data) {

        if(!(data instanceof Object)) {
            data = {};
        }

        Object.forEach(data, (key, lang) => {

            const button = new Colibri.UI.SimpleButton(this._name + '_lang_' + key, this);
            button.value = lang.desc;
            button.icon = lang.icon;
            button.AddClass('app-toolbar-lang-button');
            button.shown = true;

        });

        const button = new Colibri.UI.SuccessButton(this._name + '_lang_add', this);
        button.value = 'Добавить';
        button.icon = 'Colibri.UI.PlusIcon';
        button.AddClass('app-toolbar-add-button');
        button.shown = true;

    }

}