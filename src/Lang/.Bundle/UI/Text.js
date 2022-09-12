App.Modules.Lang.UI.Text = class extends Colibri.UI.Forms.Object {

    RenderFieldContainer() {

        this._fieldData.params = Object.assign(this._fieldData.params ?? {}, {
            vertical: true,
            merged: false,
            wrap: false
        });

        Lang.Store.AsyncQuery('lang.langs').then((langs) => {
            
            this._fieldData.fields = {};
            
            Object.forEach(langs, (langKey, langDesc) => {

                this._fieldData.fields[langKey] = {
                    component: 'Text',
                    desc: langDesc.desc,
                    params: {

                    }
                };

            });

            super.RenderFieldContainer();
        });

    }

    set value(value) {
        Colibri.Common.Wait(() => Object.countKeys(this._fieldData.fields) > 0).then(() => {
            super.value = value;
        });
    }

}

Colibri.UI.Forms.Field.RegisterFieldComponent('Lang.UI.Text', 'App.Modules.Lang.UI.Text', '#{lang-fields-text;Текст (мультиязычный)}', App.Modules.Lang.Icons.Text);
