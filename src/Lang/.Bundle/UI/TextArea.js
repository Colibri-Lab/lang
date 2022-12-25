App.Modules.Lang.UI.TextArea = class extends Colibri.UI.Forms.Object {

    RenderFieldContainer() {
        this.AddClass('app-lang-textarea-field');

        const childParams = Object.cloneRecursive(this._fieldData.params);
        delete childParams.condition;
        delete childParams?.validate;

        console.log(Object.cloneRecursive(this._fieldData));
        this._fieldData.params = Object.assign(this._fieldData.params ?? {}, {
            vertical: true,
            merged: false,
            wrap: false,
            removedesc: false,
        });
        
        
        this._links = new Colibri.UI.ButtonGroup(this.name + '-buttons', this.contentPane);
        this._links.shown = true;
        this._links.AddHandler('Changed', (event, args) => {
            const selectedKey = args.button.name;
            this.contentContainer.ForEach((name, component) => {
                component.shown = name === selectedKey;
            });
        });

        Lang.Store.AsyncQuery('lang.langs').then((langs) => {
            
            this._fieldData.fields = {};
            
            Object.forEach(langs, (langKey, langDesc) => {

                this._fieldData.fields[langKey] = {
                    component: 'TextArea',
                    desc: langDesc.desc,
                    placeholder: this._fieldData.placeholder,
                    params: childParams
                };
                this._links.AddButton(langKey, langDesc.desc);

            });

            super.RenderFieldContainer();
            const index = Object.keys(langs).indexOf(Lang.Current);
            this._links.SelectButton(index ?? 0);
        });

        this.contentContainer.AddHandler('ContextMenu', (event, args) => this.__contextMenu(event, args));
        this.AddHandler('ContextMenuItemClicked', (event, args) => this.__contextMenuClicked(event, args));
    }

    __contextMenuClicked(event, args) {
        if(!args.menuData) {
            return false;
        }
        const langs = args.menuData.name.split('-');
        Lang.TranslateTextObject(this.value, langs[0], langs[1]).then((response) => {
            this.value = response.result;
            this.Dispatch('Changed');
        });
    }

    __contextMenu(event, args) {
        Promise.all([
            Lang.Store.AsyncQuery('lang.settings'),
            Lang.Store.AsyncQuery('lang.langs')
        ]).then((responses) => {
            const settings = responses[0];
            const languages = responses[1];
            
            let contextmenu = [];
        
            if(settings.cloud) {
                let langs = [];
                Object.forEach(languages, (name, lang) => {
                    langs.push(name);
                });

                const children = [];
                langs.forEach((l) => {
                    const childs = [];
                    langs.forEach((ll) => {
                        if(ll != l) {
                            children.push({name: l + '-' + ll, title: l.toUpperCase() + ' → ' + ll.toUpperCase()});
                        }
                    });                    
                    children.push({name: l + '-*', title: l.toUpperCase() + ' → *'});
                });
                contextmenu.push({name: 'translate', title: '#{lang-contextmenu-translate}', icon: App.Modules.Lang.Icons.ContextMenuTranslateIcon, children: children});

                if(contextmenu.length > 0) {
                    this.contextmenu = contextmenu;
                    this.ShowContextMenu([Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB], '', {left: args.domEvent.clientX, top: args.domEvent.clientY});
                }
    
            }
        });
        args.domEvent.stopPropagation();
        args.domEvent.preventDefault();
        return false;
    }

    set value(value) {
        Colibri.Common.Wait(() => Object.countKeys(this._fieldData.fields) > 0).then(() => {
            if(typeof value === 'string') {
                const v = {};
                Object.keys(this._fieldData.fields).forEach(k => v[k] = value);
                super.value = v;
            }
            else {
                super.value = value;
            }
        });
    }

    get value() {
        return super.value;
    }

}

Colibri.UI.Forms.Field.RegisterFieldComponent('Lang.UI.TextArea', 'App.Modules.Lang.UI.TextArea', '#{lang-fields-textarea}', App.Modules.Lang.Icons.Text);
