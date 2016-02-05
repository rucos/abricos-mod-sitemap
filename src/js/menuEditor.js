var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['editor.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.MenuEditorWidget = Y.Base.create('menuEditorWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            var menuid = this.get('menuid'),
                menu = NS.manager.menuList.find(menuid),
                page = NS.manager.pageList.find(menuid, 'index');

            if (!menu || !page){
                return; // TODO: show 404 - not found
            }

            this.set('menu', menu);
            this.set('page', page);

            this.set('waiting', true);

            if (page.detail || page.id === 0){
                this.renderPage();
            } else {
                var instance = this;
                NS.manager.pageLoad(page.id, function(){
                    instance.renderPage();
                });
            }
        },
        destructor: function(){
            if (this.editor){
                this.editor.destroy();
            }
        },
        renderPage: function(){
            this.set('waiting', false);

            var tp = this.template,
                Editor = SYS.Editor,
                menu = this.get('menu'),
                page = this.get('page');

            this.editor = new Editor({
                srcNode: tp.gel('editor'),
                mode: page.detail.editorMode > 0 ? Editor.MODE_CODE : Editor.MODE_VISUAL,
                content: page.detail.body
            });

            tp.setValue({
                title: menu.title,
                name: menu.name,
                descript: menu.descript
            });

            console.log(menu);
            console.log(page);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            menuid: {value: 0},
            page: {},
            menu: {}
        },
        parseURLParam: function(args){
            args = args || [];
            return {
                menuid: (args[0] | 0)
            };
        }
    });

};
