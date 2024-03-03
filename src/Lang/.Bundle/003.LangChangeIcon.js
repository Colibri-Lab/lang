App.Modules.Lang.LangChangeIcon = class extends Colibri.UI.Icon {
    constructor(name, container) {
        super(name, container);

        this.AddHandler('ContextMenuItemClicked', (event, args) => this.__contextMenuItemClicked(event, args));
        this._savePlace = 'cookie';

        this._iconContextMenu = [];
        this.AddHandler('Clicked', (event, args) => {
            const contextMenuObject = new Colibri.UI.ContextMenu(this.name + '_contextmenu', document.body, this._contextMenuPosition ?? [Colibri.UI.ContextMenu.LB, Colibri.UI.ContextMenu.RB]);
            contextMenuObject.parent = this;
            contextMenuObject.Show(this._iconContextMenu, this);
            contextMenuObject.AddHandler('Clicked', (event, args) => {
                contextMenuObject.Hide();
                this.Dispatch('ContextMenuItemClicked', Object.assign(args, {item: this}));
                contextMenuObject.Dispose();   
            });
        });

    }

    __renderBoundedValues(data) {
        if(!data || !Object.isObject(data) || !Object.countKeys(data)) {
            return;
        }

        this._iconContextMenu = [];
        Object.forEach(data, (lang, desc) => {
            this._iconContextMenu.push({
                name: lang,
                title: desc.desc,
                icon: eval(desc.icon)
            });
        });
    }

    __contextMenuItemClicked(event, args) {
        if(args.menuData) {
            if(this._savePlace === 'cookie') {
                Colibri.Common.Cookie.Set('lang', args.menuData.name, 365, '/', location.hostname, true);
            } else if(this._savePlace === 'storage') {
                App.Browser.Set('lang', args.menuData.name);
            }
            location.reload();
        }
    }
    
    /**
     * Context menu position
     * @type {Array}
     */
    get contextMenuPosition() {
        return this._contextMenuPosition;
    }
    /**
     * Context menu position
     * @type {Array}
     */
    set contextMenuPosition(value) {
        value = this._convertProperty('Array', value);
        this._contextMenuPosition = value;
    }

    /**
     * Where to save lang indicator
     * @type {cookie,storage}
     */
    get savePlace() {
        return this._savePlace;
    }
    /**
     * Where to save lang indicator
     * @type {cookie,storage}
     */
    set savePlace(value) {
        this._savePlace = value;
    }

}