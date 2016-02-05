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

    NS.MenuEditorWidget = Y.Base.create('menuEditorWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            var menuid = this.get('menuid'),
                page = NS.manager.pageList.find(menuid, 'index');

            if (!page){
                return; // TODO: show 404 - not found
            }

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
                menu,
                page = this.get('page');

            if (page.id == 0){
                menu = new NS.Menu({
                    pid: this.get('parentid') | 0
                });
            } else {
                menu = NS.manager.menuList.find(page.menuid);
            }

            this.set('menu', menu);

            if (!menu && page.name == 'index'){ // заглавная страница
                tp.hide('pageNameContainer');
                tp.setValue('pageName', 'index');
            } else if (page.name !== 'index'){
            } else {
                tp.show('menuContainer')

                tp.setValue({
                    menuTitle: menu.title,
                    menuDescript: menu.descript,
                    menuName: menu.name,
                    menuOff: menu.off > 0
                });
            }

            this.editor = new Editor({
                srcNode: tp.gel('editor'),
                mode: page.detail.editorMode > 0 ? Editor.MODE_CODE : Editor.MODE_VISUAL,
                content: page.detail.body
            });

            tp.setValue({
                pageName: page.name,
                pageTitle: page.title,
                pageKeys: page.detail.metaKeys,
                pageDescript: page.detail.metaDesc
            });

            var s = tp.replace('option', {'id': '', 'tl': ''}),
                tmps = NS.manager.templates;

            for (var i = 0; i < tmps.length; i++){
                s += tp.replace('option', {'id': tmps[i], 'tl': tmps[i]});
            }

            tp.setHTML({
                templates: tp.replace('select', {'list': s})
            });

            tp.setValue({
                'select.id': page.detail.template
            });

            this.moduleListWidget = new NS.PageModuleListWidget({
                srcNode: tp.one('modules'),
                page: page
            });

            console.log(menu);
            console.log(page);
        },
        nameTranslite: function(){
            var tp = this.template,
                name = tp.getValue('pageName') || '',
                title = tp.getValue('pageTitle') || '';

            if (name === '' && title !== ''){
                tp.setValue({
                    pageName: Brick.util.Translite.ruen(title)
                });
            }
        },
        save: function(){
            this.nameTranslite();

            var tp = this.template,
                page = this.get('page'),
                menu = this.get('menu');

            var sd = {
                'page': {
                    id: page.id,
                    nm: tp.getValue('pageName'),
                    tl: tp.getValue('pageTitle'),
                    mtks: tp.getValue('pageKeys'),
                    mtdsc: tp.getValue('pageDescript'),
                    // 'tpl': this.gel('select.id').value,
                    // 'mods': this._mods,
                    bd: this.editor.get('content'),
                    em: this.editor.get('mode') == SYS.Editor.MODE_CODE ? 1 : 0
                },
                'menu': {
                    id: page.menuid,
                    // 'pid': L.isValue(this.cfg['parentMenuItem']) ? this.cfg['parentMenuItem'].id : 0,
                    'tl': tp.getValue('menuTitle'),
                    'dsc': tp.getValue('menuDescript'),
                    'nm': tp.getValue('menuName'),
                    'off': tp.getValue('menuOff')
                }
            };
            console.log(sd);

            /*

             var menuid = sd['menu']['id'];
             if (L.isValue(this.cfg['parentMenuItem'])){
             sd['menu']['pid'] = this.cfg['parentMenuItem'].id;
             } else if (menuid > 0){
             var menu = NS.manager.menuList.find(menuid);
             if (L.isValue(menu) && L.isValue(menu.parent)){
             sd['menu']['pid'] = menu.parent.id;
             }
             }
             NS.manager.pageSave(this.page.id, sd, function(){
             NS.life(cfg['onSave']);
             });
             /**/
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget,select,option,moditem'},
            menuid: {value: 0},
            modules: {value: ''},
            page: {},
            menu: {}
        },
        CLICKS: {
            save: 'save',
            cancel: 'cancel',
        },
        parseURLParam: function(args){
            args = args || [];
            return {
                menuid: (args[0] | 0),
                parentid: (args[1] | 0),
                onlyPage: !!args[2]
            };
        }
    });

    NS.PageModuleListWidget = Y.Base.create('pageModuleListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
        },
        renderMods: function(){
            var tp = this.template,
                mods = this.get('page').detail.mods,
                lst = "";

            this.modsid = {};

            if (Y.Lang.isString(mods) && mods.length > 0){
                var o = Y.JSON.parse(mods),
                    i = 0;

                for (var own in o){
                    for (var bk in o[own]){
                        this.modsid[i] = {'own': own, 'bk': bk};
                        lst += tp.replace('moditem', {
                            'own': own,
                            'nm': bk,
                            'id': i
                        });
                        i++;
                    }
                }
            }
            tp.setHTML('modlist', lst);
        },
        _showFindModule: function(){
            var tp = this.template,
                lst = "";

            tp.toggleView(false, 'pageContainer', 'dialogContainer');

            NS.manager.brickList.foreach(function(di){
                lst += tp.replace('option', {
                    id: di.id,
                    tl: di.mName + ':' + di.bName
                });
            });
            tp.setHTML({
                allList: tp.replace('select', {list: lst})
            });
        },
        showFindModule: function(){
            this.set('waiting', true);
            var instance = this;
            NS.manager.loadBrickList(function(list){
                instance.set('waiting', false);
                if (list){
                    instance._showFindModule();
                }
            });
        },
        closeFindModule: function(){
            this.template.toggleView(true, 'pageContainer', 'dialogContainer');
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'modules,select,option'},
            page: {value: ''},
            selectd: {value: []},
        },
        CLICKS: {
            findModule: 'showFindModule',
            addModule: 'addModule',
            closeFindModule: 'closeFindModule'
        }
    });


};
