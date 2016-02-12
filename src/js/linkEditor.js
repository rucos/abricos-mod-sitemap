var Component = new Brick.Component();
Component.requires = {
    yui: ['json-parse', 'json-stringify'],
    mod: [
        {name: 'sys', files: ['editor.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.LinkEditorWidget = Y.Base.create('linkEditorWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){

            this.publish('saved', {defaultFn: this._defSaved});
            this.publish('canceled', {defaultFn: this._defCandeled});

            var parentid = this.get('parentid'),
                linkid = this.get('linkid'),
                link;

            if (linkid === 0){ // create sitemap link item
                link = new NS.Menu({pid: linkid});
            } else {
                link = NS.manager.menuList.find(linkid);
            }

            if (!link){
                return; // TODO: show 404 - not found
            }

            this.set('link', link);

            this.template.setValue({
                title: link.title,
                descript: link.descript,
                link: link.link
            });

        },
        destructor: function(){
        },
        save: function(){

            var tp = this.template,
                link = this.get('link');

            var sd = {
                id: link.id,
                pid: link.parentid,
                tl: tp.getValue('title'),
                dsc: tp.getValue('descript'),
                lnk: tp.getValue('link'),
            };

            this.set('waiting', true);

            var instance = this;
            NS.manager.linkSave(link.id, sd, function(){
                instance.set('waiting', false);
                instance.fire('saved');
            });
        },
        cancel: function(){
            this.fire('canceled');
        },
        _defSaved: function(){
            this.go('ws');
        },
        _defCandeled: function(){
            this.go('ws');
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            linkid: {
                value: 0,
                getter: function(val){
                    return val | 0;
                }
            },
            parentid: {
                value: 0,
                getter: function(val){
                    return val | 0
                }
            },
            link: {},
        },
        CLICKS: {save: 'save', cancel: 'cancel',},
        parseURLParam: function(args){
            args = args || [];
            return {
                linkid: (args[0] | 0),
                parentid: (args[1] | 0)
            };
        }
    });

};
