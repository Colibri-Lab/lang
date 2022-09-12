Colibri.UI.MultiLangViewer = class extends Colibri.UI.ArrayViewer {

    constructor(name, container, element = '<span />', root = null) {
        super(name, container, element, root);
        this.AddClass('app-multilang-viewer-component');
    }

    
    _showValue() {
        
        Lang.Store.AsyncQuery('lang.langs').then(langs => {

            console.log(this._value)
            if(Array.isArray(this._value)) {
                let ret = [];
                this._value.forEach(v => {
                    let lang = ['<div>'];
                    lang.push('<strong>' + langs[v.lang].desc + ':</strong>');
                    lang.push('<span>' + v.value.ellipsis(100) + '</span>');
                    lang.push('</div>');
                    ret.push(lang.join(''));
                });
                this._element.html(ret.join('<br />'));
            }
            else if(this._value instanceof Object) {
                let ret = [];
                Object.forEach(this._value, (n, v) => {
                    if(v) {
                        let lang = ['<div>'];
                        lang.push('<strong>' + langs[n].desc + ':</strong>');
                        lang.push('<span>' + v.ellipsis(100) + '</span>');
                        lang.push('</div>');
                        ret.push(lang.join(''));
                    }
                });
                this._element.html(ret.join('<br />'));
            }

    

        });

    }

}
Colibri.UI.Viewer.Register('Colibri.UI.MultiLangViewer', '#{app-viewers-multilang;Мультиязычные данные}');