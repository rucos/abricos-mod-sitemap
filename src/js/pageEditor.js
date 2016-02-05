var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.PageEditorWidget = Y.Base.create('pageEditorWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            var pageid = this.get('pageid'),
                page = NS.manager.pageList.find(pageid, 'index');

            this.set('page', page);

            if (!page){
                return; // TODO: show 404 - not found
            }

            this.set('waiting', true);

            if (page.detail || page.id === 0){
                this.renderPage();
            } else {
                var instance = this;
                NS.manager.pageLoad(pageid, function(){
                    instance.renderPage();
                });
            }
        },
        destructor: function(){
        },
        renderPage: function(){
            this.set('waiting', false);

            var page = this.get('page');
            console.log(page);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            pageid: {value: 0},
            page: {}
        },
        parseURLParam: function(args){
            args = args || [];
            return {
                pageid: (args[0] | 0)
            };
        }
    });

};
