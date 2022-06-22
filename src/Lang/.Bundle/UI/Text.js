App.Modules.Lang.UI.Text = class extends Colibri.UI.Forms.Text {

    RenderFieldContainer() {
        super.RenderFieldContainer();
        


    }

}

Colibri.UI.Forms.Field.RegisterFieldComponent('LangText', 'App.Modules.Lang.UI.Text', '#{lang-fields-text;Текст (мультиязычный)}');
