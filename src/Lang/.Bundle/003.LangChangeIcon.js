App.Modules.Lang.LangChangeIcon = class extends Colibri.UI.Icon {
    constructor(name, container) {
        super(name, container);

        this.AddHandler('ContextMenuItemClicked', (event, args) => this.__contextMenuItemClicked(event, args));
        
        this._iconContextMenu = [];
        this.AddHandler('Clicked', (event, args) => {
            const contextMenuObject = new Colibri.UI.ContextMenu(this.name + '_contextmenu', document.body, [Colibri.UI.ContextMenu.LB, Colibri.UI.ContextMenu.RB]);
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
        if(!data || !(data instanceof Object) || !Object.countKeys(data)) {
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
            Colibri.Common.Cookie.Set('lang', args.menuData.name);
            location.reload();
        }
    }

}