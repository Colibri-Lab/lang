App.Modules.Lang.LangTree = class extends Colibri.UI.Tree { 

    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     */
    __renderBoundedValues(data, path) {

        if(!Object.isObject(data)) {
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