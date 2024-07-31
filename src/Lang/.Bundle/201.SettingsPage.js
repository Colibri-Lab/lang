App.Modules.Lang.SettingsPage = class extends Colibri.UI.Component {

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Lang.SettingsPage']);
        this.AddClass('app-langspage-component');

        this._langs = this.Children('split/ttl-pane/langtree'); 
        this._texts = this.Children('split/texts-pane/texts');
        this._searchInput = this.Children('split/texts-pane/search-pane/flex/search-input');
        this._fullfiledCheckbox = this.Children('split/texts-pane/search-pane/flex/fullfilled');

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
        this._fullfiledCheckbox.AddHandler('Changed', (event, args) => this.__fullfilledChanged(event, args));

        this._dataCurrentPage = 1;

    }

    _langFields() {
        return {
            name: 'Field',
            desc: '#{lang-langform-field}',
            fields: {
                key: {
                    type: 'varchar',
                    component: 'Text',
                    desc: '#{lang-langform-key}',
                    note: '#{lang-langform-key-desc}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{lang-langform-key-validation-message1}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{lang-langform-key-validation-message2}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'Text',
                    desc: '#{lang-langform-desc}',
                    note: '#{lang-langform-desc-desc}',
                    params: {
                        required: true,
                    }
                },
                default: {
                    type: 'tinyint',
                    component: 'Checkbox',
                    desc: '#{lang-langform-default}',
                    params: {
                        required: true,
                    }
                },
                icon: {
                    type: 'varchar',
                    component: 'Select',
                    desc: '#{lang-langform-icon}',
                    note: '#{lang-langform-icon-desc}',
                    params: {
                        required: true,
                        readonly: false,
                        searchable: false,
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
            desc: '#{lang-textform-field}',
            fields: Object.assign({
                key: {
                    type: 'varchar',
                    component: 'Text',
                    desc: '#{lang-textform-key}',
                    note: '#{lang-textform-key-desc}',
                    params: {
                        required: true,
                        readonly: edit,
                        validate: [{
                            message: '#{lang-textform-key-validation-message1}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{lang-textform-key-validation-message2}',
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
        Lang.Store.AsyncQuery('lang.settings').then((settings) => {

            const textSelected = this._texts.selected;
            const textChecked = this._texts.checked;


            let hasReadonly = settings.readonly;
            if(hasReadonly) {
                this._addText.enabled = false;
                this._editText.enabled = false;
                this._deleteText.enabled = false;
                this._translateText.enabled = false;
            }
            else {
                
                this._addText.enabled = true;

                const selection = [];
                if(textSelected) {
                    hasReadonly = textSelected.value.readonly;
                    selection.push(textSelected);
                }
                else if(textChecked.length > 0) {
                    for(const sel of textChecked) {
                        console.log(sel.value);
                        if(sel.value.readonly) {
                            hasReadonly = true;
                        }
                        selection.push(sel);
                    }
                }
    
                this._editText.enabled = selection.length === 1 && !hasReadonly;
                this._deleteText.enabled = selection.length > 0 && !hasReadonly;
                this._translateText.enabled = selection.length > 0 && !hasReadonly;    
            }

        });
        

    }

    _loadDataPage(searchTerm, notfilled, page) {
        this._dataCurrentPage = page;
        Lang.Texts(searchTerm, notfilled, page);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __searchInputFilled(event, args) {
        this._loadDataPage(this._searchInput.value, this._fullfiledCheckbox.checked, 1);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __fullfilledChanged(event, args) {
        this._loadDataPage(this._searchInput.value, this._fullfiledCheckbox.checked, 1);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __textsScrolledToBottom(event, args) {
        this._loadDataPage(this._searchInput.value, this._fullfiledCheckbox.checked, this._dataCurrentPage + 1);
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __langsSelectionChanged(event, args) {
        this._enableComponents();
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __textsSelectionChanged(event, args) {
        this._enableComponents();
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __renderFoldersContextMenu(event, args) {

        Lang.Store.AsyncQuery('lang.settings').then((settings) => {

            if(settings.readonly) {
                return;
            }

            let contextmenu = [];
            
            const itemData = args.item?.tag;
            if(!itemData) {
                contextmenu.push({name: 'new-lang', title: '#{lang-contextmenu-newlang}', icon: Colibri.UI.ContextMenuAddIcon});

                this._langs.contextmenu = contextmenu;
                this._langs.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RT, Colibri.UI.ContextMenu.LT], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);

            }
            else {
                
                contextmenu.push({name: 'edit-lang', title: '#{lang-contextmenu-editlang}', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'remove-lang', title: '#{lang-contextmenu-deletelang}', icon: Colibri.UI.ContextMenuRemoveIcon});

                args.item.contextmenu = contextmenu;
                args.item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.LB], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
            }
        });

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __clickOnFoldersContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'new-lang') {
            if(Security.IsCommandAllowed('lang.langs.add')) {
                Manage.FormWindow.Show('#{lang-forms-newlang}', 650, this._langFields(), {})
                    .then((data) => {
                        Lang.SaveLang(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{lang-settingspage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-lang') {

            if(Security.IsCommandAllowed('lang.langs.edit')) {
                Manage.FormWindow.Show('#{lang-forms-editlang}', 650, this._langFields(), item.tag)
                    .then((data) => {
                        Lang.SaveLang(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{lang-settingspage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-lang') {
            App.Confirm.Show(
                '#{lang-forms-deletelang}', 
                '#{lang-forms-deletelang-message}', 
                '#{lang-forms-deletelang-message-delete}'
            ).then(() => {
                Lang.DeleteLang(item.tag.key);
            });
        }
        
    }
    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __renderTextsContextMenu(event, args) {

        Lang.Store.AsyncQuery('lang.settings').then((settings) => {
            
            if(settings.readonly) {
                return;
            }

            let contextmenu = [];
        
            if(this._editText.enabled) {
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
                    contextmenu.push({name: 'translate', title: '#{lang-contextmenu-translate}', icon: App.Modules.Lang.Icons.ContextMenuTranslateIcon, children: children});

                }
            
                contextmenu.push({name: 'edit-text', title: '#{lang-contextmenu-edittext}', icon: Colibri.UI.ContextMenuEditIcon});
            }

            if(this._deleteText.enabled) {
                contextmenu.push({name: 'remove-text', title: '#{lang-contextmenu-deletetext}', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            if(contextmenu.length > 0) {
                args.item.contextmenu = contextmenu;
                args.item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.LB], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
            }
    
        });

        
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __clickOnTextsContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'edit-text') {
            if(Security.IsCommandAllowed('lang.texts.edit')) {
                Manage.FormWindow.Show('#{lang-forms-edittext}', 850, this._textFields(true), item.value)
                    .then((data) => {
                        Lang.SaveText(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{lang-settingspage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'remove-text') {
            App.Confirm.Show(
                '#{lang-forms-deletetext}', 
                '#{lang-forms-deletetext-message}', 
                '#{lang-forms-deletetext-message-delete}'
            ).then(() => {
                Lang.DeleteText(item.value.key);
            });
        }
        else {

            const langs = menuData.name.split('-');
            Lang.TranslateText([item.value], langs[0], langs[1]);

        }
        
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __deleteTextClicked(event, args) {
        if(Security.IsCommandAllowed('lang.texts.remove')) {
            const textSelected = this._texts.selected;
            const textChecked = this._texts.checked;
            if(textChecked.length > 0) {
                App.Confirm.Show(
                    '#{lang-forms-deletetexts-title}', 
                    '#{lang-forms-deletetexts-message}', 
                    '#{lang-forms-deletetexts-message-delete}'    
                ).then(() => {
                    Lang.DeleteText(textChecked.map((v) => v.value.key));
                });    
            }
            else  {
                App.Confirm.Show(
                    '#{lang-forms-deletetext-title}', 
                    '#{lang-forms-deletetext-message}', 
                    '#{lang-forms-deletetext-message-delete}'
                ).then(() => {
                    Lang.DeleteText([textSelected.value.key]);
                });    
            }
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{lang-settingspage-notallowed}', Colibri.UI.Notice.Error, 5000));
        }
        
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __addTextClicked(event, args) { 
        if(Security.IsCommandAllowed('lang.texts.add')) {
            Manage.FormWindow.Show('#{lang-forms-newtext}', 850, this._textFields(), {})
                .then((data) => {
                    Lang.SaveText(data);
                })
                .catch(() => {});
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{lang-settingspage-notallowed}', Colibri.UI.Notice.Error, 5000));
        }
        
    }
    
    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __editTextClicked(event, args) { 
        if(Security.IsCommandAllowed('lang.texts.edit')) {
            const textSelected = this._texts.selected;
            const textChecked = this._texts.checked;
            const selected = textSelected || textChecked.pop(); 
            Manage.FormWindow.Show('#{lang-forms-edittext}', 850, this._textFields(true), selected.value)
                .then((data) => {
                    Lang.SaveText(data);
                })
                .catch(() => {});
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{lang-settingspage-notallowed}', Colibri.UI.Notice.Error, 5000));
        }
        
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __doubleClickedTextsContextMenu(event, args) {
        if(this._editText.enabled) {
            this.__editTextClicked(event, args);
        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __translateTextClicked(event, args) {
        Lang.Store.AsyncQuery('lang.settings').then((settings) => {
            
            if(settings.readonly) {
                return;
            }
            
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