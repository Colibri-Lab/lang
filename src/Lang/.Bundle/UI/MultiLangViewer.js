Colibri.UI.MultiLangViewer = class extends Colibri.UI.ArrayViewer {

    constructor(name, container, element = '<span />', root = null) {
        super(name, container, element, root);
        this.AddClass('app-multilang-viewer-component');
    }

    
    _showValue() {
        
        Lang.Store.AsyncQuery('lang.langs').then(langs => {

            let ret = [];
            this._value.forEach(v => {
                let lang = [];
                lang.push('<strong>' + langs[v.lang].desc + '</strong>: ');
                lang.push('<span>' + v.value.ellipsis(100) + '</span>: ');
                ret.push(lang.join(''));
            });
    
            this._element.html(ret.join('<br />'));
    

        });

    }

}
Colibri.UI.Viewer.Register('Colibri.UI.MultiLangViewer', '#{app-viewers-multilang;Мультиязычные данные}');