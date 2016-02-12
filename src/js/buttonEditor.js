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

    NS.EasyPageEditorButtonWidget = Y.Base.create('easyPageEditorButtonWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
        },
        destructor: function(){
            this.closeEditor();
        },
        closeEditor: function(){
            if (!this.editor){
                return;
            }
            this.editor.destroy();
            this.editor = null;
            var tp = this.template;
            tp.toggleView(false, 'editor', 'buttons');
        },
        showEditor: function(){
            this.set('waiting', true);
            Brick.use('sitemap', 'pageEditor', function(){
                this.set('waiting', false);
                this._showEditor();
            }, this);
        },
        _showEditor: function(){
            var tp = this.template;
            tp.toggleView(true, 'editor', 'buttons');
            this.editor = new NS.PageEditorWidget({
                srcNode: tp.append('editor', '<div></div>'),
                pageType: this.get('pageType'),
                menuid: this.get('menuid')
            });
            this.editor.on('saved', function(){
                Brick.Page.reload();
                this.closeEditor();
            }, this);
            this.editor.on('canceled',this.closeEditor, this);
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            contentNode: {getter: Y.one},
            pageType: {},
            menuid: {
                value: 0,
                getter: function(val){
                    return val | 0
                }
            },
            pageid: {
                value: 0,
                getter: function(val){
                    return val | 0
                }
            },
        },
        CLICKS: {
            showEditor: 'showEditor'
        },
    });

};
