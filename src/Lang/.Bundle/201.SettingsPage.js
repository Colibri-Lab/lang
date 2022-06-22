App.Modules.Lang.SettingsPage = class extends Colibri.UI.Component {

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Lang.SettingsPage']);
        this.AddClass('app-langspage-component');

        this._langs = this.Children('split/ttl-pane/langtree');
        this._texts = this.Children('split/texts-pane/texts');
        this._searchInput = this.Children('split/texts-pane/search-pane/search-input');

        this._addText = this.Children('split/texts-pane/buttons-pane/add-text');
        this._editText = this.Children('split/texts-pane/buttons-pane/edit-text');
        this._deleteText = this.Children('split/texts-pane/buttons-pane/delete-text');
        this._translateText = this.Children('split/texts-pane/buttons-pane/translate-text');

        this._langs.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderFoldersContextMenu(event, args));
        this._langs.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnFoldersContextMenu(event, args));        
        this._langs.AddHandler('SelectionChanged', (event, args) => this.__langsSelectionChanged(event, args));

        this._texts.AddHandler(['SelectionChanged', 'CheckChanged'], (event, args) => this.__textsSelectionChanged(event, args));
        this._texts.AddHandler('ScrolledToBottom', (event, args) => this.__textsScrolledToBottom(event, args));
        this._texts.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderTextsContextMenu(event, args));
        this._texts.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnTextsContextMenu(event, args));        
        this._texts.AddHandler('DoubleClicked', (event, args) => this.__doubleClickedTextsContextMenu(event, args));        

        this._addText.AddHandler('Clicked', (event, args) => this.__addTextClicked(event, args));
        this._deleteText.AddHandler('Clicked', (event, args) => this.__deleteTextClicked(event, args));
        this._editText.AddHandler('Clicked', (event, args) => this.__editTextClicked(event, args));
        this._translateText.AddHandler('Clicked', (event, args) => this.__translateTextClicked(event, args));

        this._searchInput.AddHandler(['Filled', 'Cleared'], (event, args) => this.__searchInputFilled(event, args));

        this._dataCurrentPage = 1;

    }

    _langFields() {
        return {
            name: 'Field',
            desc: 'Свойство',
            fields: {
                key: {
                    type: 'varchar',
                    component: 'Text',
                    desc: '#{lang-langform-key;Ключ языка}',
                    note: '#{lang-langform-key-desc;Пожалуйста, введите ключ. Внимание! должно содержать только латинские буквы и цифры без тире, дефисов и пробелов.}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{lang-langform-key-validation-message1;Пожалуйста, введите ключ языка}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{lang-langform-key-validation-message2;Введенный текст не соответствует требованиям}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'Text',
                    desc: '#{lang-langform-desc;Описание языка}',
                    note: '#{lang-langform-desc-desc;Введите описание языка так, как вы хотите видеть язык на сайте}',
                    params: {
                        required: true,
                    }
                },
                default: {
                    type: 'tinyint',
                    component: 'Checkbox',
                    desc: '#{lang-langform-default;Язык по умолчанию}',
                    params: {
                        required: true,
                    }
                },
                icon: {
                    type: 'varchar',
                    component: 'Select',
                    desc: '#{lang-langform-icon;Выберите иконку}',
                    note: '#{lang-langform-icon-desc;Выберите иконку, которая будет отображаться при выборе языка}',
                    params: {
                        required: true,
                        readonly: true,
                    },
                    selector: {
                        __render: (itemData) => '<div style="display: flex; align-items: center;">' + (itemData.icon ?? '<svg width="28" height="28"></svg>') + '<span style="display: block; margin-left: 10px;">' + itemData.title + '</span></div>',
                        value: 'value',
                        title: 'title'
                    },
                    lookup: {
                        method: () => new Promise((resolve, reject) => {
                            let icons = [];
                            Object.forEach(App.Modules.Lang.Icons.Countries, (name, v) => {
                                icons.push({value: 'App.Modules.Lang.Icons.Countries.' + name, icon: eval('App.Modules.Lang.Icons.Countries.' + name), title: name});
                            });
                            resolve(icons);
                        })
                    }
                },
            }
        };
    }

    _textFields(edit = false) {
        return {
            name: 'Field',
            desc: 'Свойство',
            fields: Object.assign({
                key: {
                    type: 'varchar',
                    component: 'Text',
                    desc: '#{lang-textform-key;Ключ текста}',
                    note: '#{lang-textform-key-desc;Пожалуйста, введите ключ. Внимание! содержит только латинские буквы, цифры и тире}',
                    params: {
                        required: true,
                        readonly: edit,
                        validate: [{
                            message: '#{lang-textform-key-validation-message1;Пожалуйста, введите ключ языка}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{lang-textform-key-validation-message2;Введенный текст не соответствует требованиям}',
                            method: '(field, validator) => !/[^\\w\\d\\-]/.test(field.value)'
                        }]
                    }
                }
            }, Object.map(Lang.Store.Query('lang.langs'), (key, value) => {
                return {
                    type: 'varchar',
                    component: 'TextArea',
                    desc: value.desc
                }
            }))
        };
    }

    _enableComponents() {

        const textSelected = this._texts.selected;
        const textChecked = this._texts.checked;

        this._addText.enabled = true;
        this._editText.enabled = (!!textSelected || textChecked.length === 1);
        this._deleteText.enabled = (!!textSelected || textChecked.length > 0);
        this._translateText.enabled = (!!textSelected || textChecked.length > 0);

    }

    _loadDataPage(searchTerm, page) {
        this._dataCurrentPage = page;
        Lang.Texts(searchTerm, page);
    }

    __searchInputFilled(event, args) {
        this._loadDataPage(this._searchInput.value, 1);
    }

    __textsScrolledToBottom(event, args) {
        this._loadDataPage(this._searchInput.value, this._dataCurrentPage + 1);
    }

    __langsSelectionChanged(event, args) {
        this._enableComponents();
    }

    __textsSelectionChanged(event, args) {
        this._enableComponents();
    }

    __renderFoldersContextMenu(event, args) {

        let contextmenu = [];
        
        const itemData = args.item?.tag;
        if(!itemData) {
            contextmenu.push({name: 'new-lang', title: '#{lang-contextmenu-newlang;Новый язык}', icon: Colibri.UI.ContextMenuAddIcon});

            this._langs.contextmenu = contextmenu;
            this._langs.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.LB], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);

        }
        else {
            
            contextmenu.push({name: 'edit-lang', title: '#{lang-contextmenu-editlang;Редактировать язык}', icon: Colibri.UI.ContextMenuEditIcon});
            contextmenu.push({name: 'remove-lang', title: '#{lang-contextmenu-deletelang;Удалить язык}', icon: Colibri.UI.ContextMenuRemoveIcon});

            args.item.contextmenu = contextmenu;
            args.item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.LB], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        }
        

    }

    __clickOnFoldersContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'new-lang') {
            if(Security.IsCommandAllowed('lang.langs.add')) {
                Manage.FormWindow.Show('#{lang-forms-newlang;Новый язык}', 650, this._langFields(), {})
                    .then((data) => {
                        Lang.SaveLang(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-lang') {

            if(Security.IsCommandAllowed('lang.langs.edit')) {
                Manage.FormWindow.Show('#{lang-forms-editlang;Редактировать язык}', 650, this._langFields(), item.tag)
                    .then((data) => {
                        Lang.SaveLang(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-lang') {
            App.Confirm.Show('#{lang-forms-deletelang;Удаление языка}', '#{lang-forms-deletelang-message;Вы уверены, что хотите удалить язык? Все текстовые данные, которые были заполнены будут безвозвратно удалены!}', '#{app-confirm-buttons-delete;Удалить!}').then(() => {
                Lang.DeleteLang(item.tag.key);
            });
        }
        
    }
    __renderTextsContextMenu(event, args) {

        Lang.Store.AsyncQuery('lang.settings').then((settings) => {
            let contextmenu = [];
        
            if(settings.cloud) {
                let langs = [];
                this._langs.nodes.ForEach((name, node) => {
                    langs.push(node.tag.key);
                });

                const children = [];
                langs.forEach((l) => {
                    const childs = [];
                    langs.forEach((ll) => {
                        if(ll != l) {
                            children.push({name: l + '-' + ll, title: l.toUpperCase() + ' → ' + ll.toUpperCase()});
                        }
                    });                    
                });
                contextmenu.push({name: 'translate', title: '#{lang-contextmenu-translate;Перевести с помощью облака}', icon: App.Modules.Lang.Icons.ContextMenuTranslateIcon, children: children});

            }

            contextmenu.push({name: 'edit-text', title: '#{lang-contextmenu-edittext;Редактировать тексты}', icon: Colibri.UI.ContextMenuEditIcon});
            contextmenu.push({name: 'remove-text', title: '#{lang-contextmenu-deletetext;Удалить тексты}', icon: Colibri.UI.ContextMenuRemoveIcon});
    
            args.item.contextmenu = contextmenu;
            args.item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.LB], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
    
        });

        
    }

    __clickOnTextsContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'edit-text') {
            if(Security.IsCommandAllowed('lang.texts.edit')) {
                Manage.FormWindow.Show('#{lang-forms-edittext;Редактировать текст}', 850, this._textFields(true), item.value)
                    .then((data) => {
                        Lang.SaveText(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'remove-text') {
            App.Confirm.Show('#{lang-forms-deletetext;Удаление текстов}', '#{lang-forms-deletetext-message;Вы уверены, что хотите удалить текст?}', '#{app-confirm-buttons-delete;Удалить!}').then(() => {
                Lang.DeleteText(item.value.key);
            });
        }
        else {

            const langs = menuData.name.split('-');
            Lang.TranslateText([item.value], langs[0], langs[1]);

        }
        
    }

    __deleteTextClicked(event, args) {
        if(Security.IsCommandAllowed('lang.texts.remove')) {
            const textSelected = this._texts.selected;
            const textChecked = this._texts.checked;
            if(textChecked.length > 0) {
                App.Confirm.Show('#{lang-forms-deletetexts;Удаление текстов}', '#{lang-forms-deletetexts;Вы уверены, что хотите удалить выбранные тексты?}', '#{app-confirm-buttons-delete;Удалить!}').then(() => {
                    Lang.DeleteText(textChecked.map((v) => v.value.key));
                });    
            }
            else  {
                App.Confirm.Show('#{lang-forms-deletetexts;Удаление текстов}', '#{lang-forms-deletetext;Вы уверены, что хотите удалить текст?}', '#{app-confirm-buttons-delete;Удалить!}').then(() => {
                    Lang.DeleteText([textSelected.value.key]);
                });    
            }
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
        }
        
    }

    __addTextClicked(event, args) { 
        if(Security.IsCommandAllowed('lang.texts.add')) {
            Manage.FormWindow.Show('#{lang-forms-newtext;Новый текст}', 850, this._textFields(), {})
                .then((data) => {
                    Lang.SaveText(data);
                })
                .catch(() => {});
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
        }
        
    }
    
    __editTextClicked(event, args) { 
        if(Security.IsCommandAllowed('lang.texts.edit')) {
            const textSelected = this._texts.selected;
            const textChecked = this._texts.checked;
            const selected = textSelected || textChecked.pop(); 
            Manage.FormWindow.Show('#{lang-forms-edittext;Редактировать текст}', 850, this._textFields(true), selected.value)
                .then((data) => {
                    Lang.SaveText(data);
                })
                .catch(() => {});
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
        }
        
    }

    __doubleClickedTextsContextMenu(event, args) {
        this.__editTextClicked(event, args);
    }

    __translateTextClicked(event, args) {
        Lang.Store.AsyncQuery('lang.settings').then((settings) => {
            if(settings.cloud) {
                let langs = [];
                this._langs.nodes.ForEach((name, node) => {
                    langs.push(node.tag.key);
                });

                const contextmenu = [];
                langs.forEach((l) => {
                    langs.forEach((ll) => {
                        if(ll != l) {
                            contextmenu.push({name: l + '-' + ll, title: l.toUpperCase() + ' → ' + ll.toUpperCase()});
                        }
                    });                    
                });

                const contextMenuObject = new Colibri.UI.ContextMenu('translate-menu', document.body, [Colibri.UI.ContextMenu.LT, Colibri.UI.ContextMenu.RT]);
                contextMenuObject.Show(contextmenu, this._translateText);
                contextMenuObject.AddHandler('Clicked', (event, args) => {
                    contextMenuObject.Hide();
                    const menuData = args.menuData;
                    if(!menuData) {
                        return;
                    }
                    
                    const langs = menuData.name.split('-');

                    const textSelected = this._texts.selected;
                    const textChecked = this._texts.checked;
                    const selected = textSelected ? [textSelected] : textChecked;
                    
                    const data = [];
                    selected.forEach((item) => {
                        data.push(item.value);
                    });

                    Lang.TranslateText(data, langs[0], langs[1]);

                    contextMenuObject.Dispose();
                });

            }
        });

        
        
    }

}