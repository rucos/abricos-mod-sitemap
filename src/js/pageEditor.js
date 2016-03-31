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

    NS.PageEditorWidget = Y.Base.create('pageEditorWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){

            this.publish('saved', {defaultFn: this._defSaved});
            this.publish('canceled', {defaultFn: this._defCandeled});

            var parentid = this.get('parentid'),
                pageType = this.get('pageType'),
                menuid = this.get('menuid'),
                page;

            if (menuid === 0){ // create sitemap item
                if (pageType === 'root'){
                    page = NS.manager.pageList.find(0, 'index');
                } else if (pageType === 'page'){
                    page = new NS.Page();
                } else {
                    page = new NS.Page({nm: 'index'});
                }
            } else {
                page = NS.manager.pageList.find(menuid, 'index');
            }

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

            if (page.id === 0){
                menu = new NS.Menu({
                    pid: this.get('parentid') | 0
                });
            } else {
                menu = NS.manager.menuList.find(page.menuid);
            }

            this.set('menu', menu);

            if (!menu && page.name === 'index'){ // заглавная страница
                tp.hide('menuContainer,pageNameContainer');
                tp.setValue('pageName', 'index');
            } else if (page.name !== 'index'){
                tp.hide('menuContainer')
                tp.show('pageNameContainer');
            } else {
                tp.show('menuContainer')
                tp.hide('pageNameContainer');

                tp.setValue({
                    menuTitle: menu.title,
                    menuDescript: menu.descript,
                    menuName: menu.name,
                    menuOff: menu.off > 0
                });
            }

            this.editor = new Editor({
                srcNode: tp.gel('editor'),
                toolbar: Editor.TOOLBAR_STANDART,
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
                page: page,
                CLICKS: {
                    insertModuleOnPage: {
                        event: this._onInsertModuleOnPage,
                        context: this
                    }
                }
            });
        },
        _onInsertModuleOnPage: function(e){
            var module = e.target.getData('module'),
                brick = e.target.getData('brick');

            this.editor.insertValue("[mod]" + module + ":" + brick + "[/mod]");
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
                menu = this.get('menu'),
                parentid = this.get('parentid') | 0;

            var sd = {
                page: {
                    id: page.id,
                    nm: tp.getValue('pageName'),
                    tl: tp.getValue('pageTitle'),
                    mtks: tp.getValue('pageKeys'),
                    mtdsc: tp.getValue('pageDescript'),
                    tpl: tp.getValue('select.id'),
                    mods: this.moduleListWidget.toJSON(),
                    bd: this.editor.get('content'),
                    em: this.editor.get('mode') == SYS.Editor.MODE_CODE ? 1 : 0
                },
                menu: {
                    id: page.menuid,
                    pid: parentid,
                    'tl': tp.getValue('menuTitle'),
                    'dsc': tp.getValue('menuDescript'),
                    'nm': tp.getValue('menuName'),
                    'off': tp.getValue('menuOff')
                }
            };

            var menuid = sd['menu']['id'];

            if (parentid === 0){
                var menu = NS.manager.menuList.find(menuid);
                if (menu && menu.parent){
                    sd['menu']['pid'] = menu.parent.id;
                }
            }

            this.set('waiting', true);

            var instance = this;
            NS.manager.pageSave(page.id, sd, function(){
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
            templateBlockName: {value: 'widget,select,option,moditem'},
            menuid: {
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
            pageType: {value: 'menu'},
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
                pageType: args[2] || ''
            };
        }
    });

    NS.PageModuleListWidget = Y.Base.create('pageModuleListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            var page = this.get('page');
            if (!page || !page.detail){
                return;
            }

            var mods = {};
            try {
                mods = Y.JSON.parse(page.detail.mods);
            } catch (e) {
            }

            this.set('selected', mods);
            this.renderMods();
        },
        renderMods: function(){
            var tp = this.template,
                selected = this.get('selected'),
                lst = "";

            for (var m in selected){
                for (var b in selected[m]){
                    lst += tp.replace('modItem', {
                        module: m,
                        brick: b
                    });
                }
            }
            tp.setHTML('selected', lst);
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
        addModuleInList: function(){
            var tp = this.template,
                id = tp.getValue('select.id') | 0,
                brick = NS.manager.brickList.get(id);

            if (!brick){
                return;
            }

            var selected = this.get('selected'),
                m = selected[brick.mName] = selected[brick.mName] || {};

            m[brick.bName] = '';

            this.closeFindModule();

            this.renderMods();
        },
        removeModuleFromSelected: function(e){
            var module = e.target.getData('module'),
                brick = e.target.getData('brick'),
                selected = this.get('selected'),
                nSelected = {};

            for (var m in selected){
                for (var b in selected[m]){
                    if (m !== module || b !== brick){
                        if (!nSelected[m]){
                            nSelected[m] = {};
                        }
                        nSelected[m][b] = '';
                    }
                }
            }
            this.set('selected', nSelected);
            this.renderMods();
        },
        toJSON: function(){
            var selected = this.get('selected');
            return Y.JSON.stringify(selected);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'modules,select,option,modItem'},
            page: {value: ''},
            selected: {value: []},
        },
        CLICKS: {
            findModule: 'showFindModule',
            closeFindModule: 'closeFindModule',
            addModule: 'addModuleInList',
            removeModuleFromSelected: 'removeModuleFromSelected'
        }
    });


};
