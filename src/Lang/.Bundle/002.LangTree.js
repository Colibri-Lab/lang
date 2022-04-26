App.Modules.Lang.LangTree = class extends Colibri.UI.Tree {

    __renderBoundedValues(data) {

        if(!(data instanceof Object)) {
            data = {};
        }

        let found = [];
        Object.forEach(data, (key, lang) => {

            lang.key = key;

            let node = this.FindNode(key);
            if(!node) {
                node = this.nodes.Add(key);
            }
            node.text = lang.desc;
            node.icon = eval(lang.icon);
            node.tag = lang;
            found.push(lang.key);

        });

        this.nodes.ForEach((name, node) => {
            if(found.indexOf(name) === -1) {
                node.Dispose();
            }
        });


    }

}