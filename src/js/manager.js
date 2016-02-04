var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sitemap', files: ['editor.js']},
        {name: 'sys', files: ['panel.js', 'data.js', 'form.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        L = YAHOO.lang,
        buildTemplate = this.buildTemplate;

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.ManagerWidget = Y.Base.create('managerWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            this.sitemapWidget = new NS.SitemapWidget({
                srcNode: this.template.one('body')
            });
        },
        destructor: function(){
            if (this.sitemapWidget){
                this.sitemapWidget.destroy();
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'wrap'}
        }
    });

    NS.SitemapWidget = Y.Base.create('managerWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){

            this.renderList();

            this.old_renderManager();
        },
        _renderList: function(menuList){
            var tp = this.template,
                lst = "";

            menuList.foreach(function(item){
                lst += tp.replace(item.isLink ? 'rowLink' : 'rowPage', {
                    id: item.id,
                    title: item.title,
                    url: item.URL(),
                    upDownButtons: tp.replace('upDownButtons')
                });
            });
            return lst;
        },
        renderList: function(){
            var tp = this.template;
            tp.setHTML({
                list: tp.replace('table', {
                    rows: this._renderList(NS.manager.menuList)
                })
            });
        },

        old_renderManager: function(){
            this.template.setHTML({
                items: this.buildList()
            });
            this.old_renderList();
        },
        old_renderList: function(list){
            list = list || NS.manager.menuList;

            var tp = this.template,
                instance = this,
                lng = this.language;

            list.foreach(function(item){

                var img = tp.one('mapitem.expand-' + item.id);

                if (img){
                    tp.toggleView(item.childs.count() > 0, 'mapitem.expand-' + item.id);
                    img.set('src', lng.get('img.' + (item.expand ? 'collapse' : 'expand')));
                }

                tp.toggleView(item.expand, 'maplist.id-' + item.id);

                instance.old_renderList(item.childs);
            });
        },
        onClick: function(e){
            var numid = e.target.getData('id'),
                pcfg = {
                    'onSave': function(){
                        instance.old_renderManager();
                    }
                };

            switch (e.dataClick) {
                case 'rootedit':
                    var page = NS.manager.pageList.find(0, 'index');
                    new NS.PageEditorPanel({page: page, config: pcfg});
                    return true;
                case 'rootadd':
                    new NS.MenuItemCreatePanel({
                        onSave: function(){
                            instance.old_renderManager();
                        }
                    });
                    return true;
                case 'itemExpand':
                    this.itemChangeExpand(numid);
                    return true;

                case 'itemEdit':
                    var item = NS.manager.menuList.find(numid);
                    if (item.isLink){
                        new NS.LinkEditorPanel(item, pcfg);
                    } else {
                        var page = NS.manager.pageList.find(numid, 'index');
                        new NS.PageEditorPanel({page: page, config: pcfg});
                    }
                    return true;
            }

            var TId = this.template.idMap,
                instance = this,
                el = e.target.getDOMNode();


            var prefix = el.id.replace(/([0-9]+$)/, '');
            var numid = el.id.replace(prefix, "");

            switch (prefix) {
                case (TId['biup']['id'] + '-'):
                    this.itemMove(numid, 'up');
                    return true;
                case (TId['bidown']['id'] + '-'):
                    this.itemMove(numid, 'down');
                    return true;
                case (TId['biadd']['id'] + '-'):
                    new NS.MenuItemCreatePanel({
                        menuId: numid,
                        onSave: function(){
                            instance.old_renderManager();
                        }
                    });
                    return true;
                case (TId['bieditp']['id'] + '-'):
                    // API.showPageEditorPanel(numid);
                    return true;
                case (TId['birem']['id'] + '-'):
                    this.menuRemove(numid);
                    return true;
                case (TId['biremp']['id'] + '-'):
                    this.removePage(numid);
                    return true;
            }
            return false;
        },

        buildList: function(menuList){
            menuList = menuList || NS.manager.menuList;

            var instance = this,
                tp = this.template,
                lst = "",
                index = 0;

            menuList.foreach(function(item){
                var btns = "";
                btns += tp.replace(index == 0 ? 'biempty' : 'biup');
                btns += tp.replace(item.order < menuList.count() - 1 ? 'bidown' : 'biempty');
                btns += tp.replace('biedit');
                btns += tp.replace(item.isLink ? 'biempty' : 'biadd');
                btns += tp.replace('birem');

                var lstChilds = "";
                if (item.childs.count() > 0){
                    lstChilds = tp.replace('maplist', {
                        'id': item.id,
                        'list': instance.buildList(item.childs)
                    });
                }

                NS.manager.pageList.foreach(function(page){
                    if (page.name == 'index' || page.menuid != item.id){
                        return;
                    }
                    lstChilds += tp.replace('mapitempage', {
                        'url': page.URL(),
                        'title': page.name + ".html",
                        'level': item.level + 1,
                        'buttons': tp.replace('biempty') +
                        tp.replace('biempty') +
                        tp.replace('bieditp') +
                        tp.replace('biempty') +
                        tp.replace('biremp'),
                        'id': page.id
                    });
                });

                lst += tp.replace('mapitem', {
                    'imgtype': tp.replace(item.isLink ? 'imgtypelink' : 'imgtypemenu'),
                    'url': item.URL(),
                    'title': item.title,
                    'level': item.level,
                    'childstatus': item.childs.count() > 0 ? 'children-visible' : 'no-children',
                    'buttons': btns,
                    'id': item.id,
                    'child': lstChilds
                });
                index++;
            });
            return lst;
        },
        menuRemove: function(menuid){
            var instance = this, item = NS.manager.menuList.find(menuid);
            new NS.MenuItemRemovePanel(item, function(){
                instance.old_renderManager();
            });
        },
        itemChangeExpand: function(menuid){
            var list = NS.manager.menuList;
            var item = list.find(menuid);
            if (!L.isValue(item)){
                return;
            }
            item.expand = !item.expand;
            this.old_renderList();
        },
        itemMove: function(menuid, act){
            var item = NS.manager.menuList.find(menuid);
            if (L.isNull(item)){
                return;
            }

            var list = L.isNull(item.parent) ? NS.manager.menuList : item.parent.childs;

            for (var i = 0; i < list.count(); i++){
                list.getByIndex(i).order = i;
            }
            for (var i = 0; i < list.count(); i++){
                var item = list.getByIndex(i);
                if (item.id == menuid){
                    if (act == 'up'){
                        list.getByIndex(i - 1).order = i;
                        list.getByIndex(i).order = i - 1;
                    } else if (act == 'down'){
                        list.getByIndex(i).order = i + 1;
                        list.getByIndex(i + 1).order = i;
                    }
                }
            }
            list.reorder();
            var sd = [];
            list.foreach(function(item){
                sd[sd.length] = {
                    'id': item.id,
                    'o': item.order
                };
            });
            NS.manager.menuSaveOrders(sd);
            this.old_renderManager();
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {
                value: 'widget,table,rowPage,rowLink,upDownButtons' +
                ',maplist,mapitem,mapitempage,imgtypelink,imgtypemenu,biempty,biup,bidown,biadd,bieditp,biedit,birem,biremp'
            }
        }
    });

    NS.MenuItemCreatePanel = Y.Base.create('termsOfUseDialog', SYS.Dialog, [], {
        onClick: function(e){
            switch (e.dataClick) {
                case "cancel":
                    this.hide();
                    return true;
                case "create":
                    this.createMenuItem();
                    return true;
            }
        },

        createMenuItem: function(){
            var instance = this;
            var onSave = function(){
                NS.life(instance.get('onSave'));
            };

            var pMenuId = this.get('menuId');
            var pMenu = NS.manager.menuList.find(pMenuId),
                tm = this.template;

            if (tm.gel('mnuadd.type0').checked){
                new NS.PageEditorPanel({
                    page: new NS.Page({'nm': 'index'}),
                    config: {
                        'parentMenuItem': pMenu,
                        'onSave': onSave
                    }
                });
            } else if (tm.gel('mnuadd.type1').checked){
                new NS.LinkEditorPanel(new NS.Menu({
                    'pid': L.isValue(pMenu) ? pMenu.id : 0
                }), {'onSave': onSave});
            } else {
                new NS.PageEditorPanel({
                    page: new NS.Page(),
                    config: {
                        'parentMenuItem': pMenu,
                        'onSave': onSave
                    }
                });
            }
            this.hide();
        }
    }, {
        ATTRS: {
            menuId: {value: 0},
            onSave: {value: null},
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'mnuadd'
            }
        }
    });

    /*

     var MenuItemCreatePanel = function(menuid, cfg){
     this.ccfg = L.merge({
     'onSave': null
     }, cfg || {});
     this.menuid = menuid;
     MenuItemCreatePanel.superclass.constructor.call(this);
     };
     YAHOO.extend(MenuItemCreatePanel, Brick.widget.Dialog, {
     initTemplate: function(){
     return buildTemplate(this, 'mnuadd').replace('mnuadd');
     },
     onClick: function(el){
     var tp = this._TId['mnuadd'];
     switch (el.id) {
     case tp['bcancel']:
     this.close();
     return true;
     case tp['badd']:
     this.create();
     return true;
     }
     },
     });

     NS.MenuItemCreatePanel = MenuItemCreatePanel;
     /**/

    var MenuItemRemovePanel = function(item, callback){
        this.item = item;
        this.callback = callback;
        MenuItemRemovePanel.superclass.constructor.call(this, {fixedcenter: true});
    };
    YAHOO.extend(MenuItemRemovePanel, Brick.widget.Dialog, {
        initTemplate: function(){
            return buildTemplate(this, 'removepanel').replace('removepanel');
        },
        onClick: function(el){
            var tp = this._TId['removepanel'];
            switch (el.id) {
                case tp['bcancel']:
                    this.close();
                    return true;
                case tp['bremove']:
                    this.remove();
                    return true;
            }
            return false;
        },
        remove: function(){
            var TM = this._TM, gel = function(n){
                    return TM.getEl('removepanel.' + n);
                },
                instance = this;
            Dom.setStyle(gel('btns'), 'display', 'none');
            Dom.setStyle(gel('bloading'), 'display', '');
            NS.manager.menuRemove(this.item.id, function(){
                instance.close();
                NS.life(instance.callback);
            });
        }
    });
    NS.MenuItemRemovePanel = MenuItemRemovePanel;

};
