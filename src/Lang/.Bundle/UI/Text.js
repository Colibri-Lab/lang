App.Modules.Lang.UI.Text = class extends Colibri.UI.Forms.Text {

    RenderFieldContainer() {
        super.RenderFieldContainer();
        


    }

}

Colibri.UI.Forms.Field.RegisterFieldComponent('Lang.UI.Text', 'App.Modules.Lang.UI.Text', '#{lang-fields-text;Текст (мультиязычный)}', App.Modules.Lang.Icons.Text);
