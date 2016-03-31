var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['application.js']},
        {name: '{C#MODNAME}', files: ['old-lib.js']}
    ]
};
Component.entryPoint = function(NS){

    NS.roles = new Brick.AppRoles('{C#MODNAME}', {
        isAdmin: 50,
        isWrite: 30,
        isView: 10
    });

    var COMPONENT = this,
        SYS = Brick.mod.sys;

    SYS.Application.build(COMPONENT, {}, {
        initializer: function(){
            var instance = this;
            NS.roles.load(function(){
                NS.initManager(function(){
                    instance.initCallbackFire();
                });
            }, this);
        },
    }, [], {
        REQS: {},
        ATTRS: {
            isLoadAppStructure: {value: false},
        },
        URLS: {
            ws: "#app={C#MODNAMEURI}/wspace/ws/",
            manager: {
                view: function(){
                    return this.getURL('ws') + 'manager/ManagerWidget/';
                }
            },
            create: function(parentid){
                return this.getURL('ws') + 'create/CreateWidget/' + (parentid | 0) + '/';
            },
            root: {
                edit: function(){
                    return this.getURL('ws') + 'pageEditor/PageEditorWidget/0/0/root/';
                },
            },
            menu: {
                append: function(parentid){
                    return this.getURL('ws') + 'pageEditor/PageEditorWidget/0/'+ (parentid | 0) + '/menu/';
                },
                edit: function(pageid){
                    return this.getURL('ws') + 'pageEditor/PageEditorWidget/' + (pageid | 0) + '/';
                },
            },
            link: {
                append: function(parentid){
                    return this.getURL('ws') + 'linkEditor/LinkEditorWidget/0/'+ (parentid | 0) + '/';
                },
                edit: function(linkid){
                    return this.getURL('ws') + 'linkEditor/LinkEditorWidget/' + (linkid | 0) + '/';
                }
            },
            page: {
                append: function(parentid){
                    return this.getURL('ws') + 'pageEditor/PageEditorWidget/0/'+ (parentid | 0) + '/page/';
                },
                edit: function(pageid){
                    return this.getURL('ws') + 'pageEditor/PageEditorWidget/' + (pageid | 0) + '/0/page/';
                },
            },
        }
    });
};