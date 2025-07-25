App.Modules.Lang.LangChangeIcon = class extends Colibri.UI.Icon {
    constructor(name, container) {
        super(name, container);

        this.AddHandler('ContextMenuItemClicked', this.__contextMenuItemClicked);
        this._savePlace = 'cookie';

        this._iconContextMenu = [];
        this.AddHandler('Clicked', this.__thisClicked);

    } 

    __thisClicked(event, args) {
        const contextMenuObject = new Colibri.UI.ContextMenu(this.name + '_contextmenu', document.body, this._contextMenuPosition ?? [Colibri.UI.ContextMenu.LB, Colibri.UI.ContextMenu.LT]);
        contextMenuObject.parent = this;
        contextMenuObject.Show(this._iconContextMenu, this);
        contextMenuObject.AddHandler('Clicked', this.__contextMenuObjectClicked, false, tnis);
    }

    __contextMenuObjectClicked(event, args) {
        event.sender.Hide();
        this.Dispatch('ContextMenuItemClicked', Object.assign(args, {item: event.sender}));
        event.sender.Dispose();   
    }

    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     */
    __renderBoundedValues(data, path) {
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

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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