App.Modules.Lang.TextsGrid = class extends Colibri.UI.Grid {

    constructor(name, container) {
        super(name, container);
    }
 
    __renderBoundedValues(data, property) {
        if(!data) {
            return;
        }

        if(property.indexOf('lang.langs') !== -1) {
            let column = this.header.columns.Children('key');
            if(!column) {
                column = this.header.columns.Add('key', '#{lang-textgrid-key}');
            }
            let found = ['key'];
            Object.forEach(data, (key, lang) => {
                let column = this.header.columns.Children(key);
                if(!column) {
                    column = this.header.columns.Add(key, lang.desc);
                }
                found.push(key);
                column.viewer = 'Colibri.UI.HtmlDataViewer';
            });

            this.header.columns.ForEach((name, column) => {
                if(name !== 'button-container-for-row-selection' && found.indexOf(name) === -1) {
                    column.Dispose();
                }
            });

        }
        else if(property.indexOf('lang.texts') !== -1) {
            this.rows.title = '';

            let found = [];
            console.log(data);
            Object.forEach(data, (key, text) => {
                text.key = key;
                let row = this.FindRow(key);
                if(!row) {
                    this.rows.Add(key, text);
                }
                else {
                    row.value = text;
                }
                found.push(key);

            });

            this.ForEveryRow((name, row) => {
                if(found.indexOf(name) === -1) {
                    row.Dispose();
                }
            });

        }
        
    }

    
}