/*
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

/**
 * @module Sitemap
 * @namespace Brick.mod.sitemap
 */
var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sitemap', files: ['api.js', 'editor.js']},
        {name: 'sys', files: ['panel.js', 'data.js', 'form.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        L = YAHOO.lang,
        buildTemplate = this.buildTemplate;

    var Y = Brick.YUI,

        WAITING = 'waiting',
        BOUNDING_BOX = 'boundingBox',

        COMPONENT = this,

        SYS = Brick.mod.sys;

    NS.ManagerWidget = Y.Base.create('managerWidget', NS.AppWidget, [
    ], {
        onInitAppWidget: function(err, appInstance, options){
            this.renderManager();
        },
        renderManager: function(){
            var list = NS.manager.menuList;

            Y.Node.one(this.template.gel('items')).setHTML(this.buildList(list));

            this.renderList(list);
        },
        renderList: function(list){
            list = list || NS.manager.menuList;
            var __self = this, TId = this.template.idMap;
            var lng = this.language;

            list.foreach(function(item){
                var container = Dom.get(TId['maplist']['id'] + '-' + item.id);
                var img = Dom.get(TId['mapitem']['expand'] + '-' + item.id);
                if (!L.isNull(img)){
                    img.style.display = item.childs.count() > 0 ? '' : 'none';
                }

                img.src = lng.get('img.' + (item.expand ? 'collapse' : 'expand'));
                Dom.setStyle(container, 'display', item.expand ? '' : 'none');
                __self.renderList(item.childs);
            });
        },
        onClick: function(e){
            var TId = this.template.idMap, __self = this;

            var el = e.target.getDOMNode();

            var pcfg = {
                'onSave': function(){
                    __self.renderManager();
                }
            };

            var tp = this.template.idMap['managerwidget'];

            switch (el.id) {
                case tp['rootedit']:
                    var page = NS.manager.pageList.find(0, 'index');
                    new NS.PageEditorPanel(page, pcfg);
                    return true;
                case tp['rootadd']:
                    new NS.MenuItemCreatePanel({
                        onSave: function(){
                            __self.renderManager();
                        }
                    });
                    return true;
            }

            var prefix = el.id.replace(/([0-9]+$)/, '');
            var numid = el.id.replace(prefix, "");

            switch (prefix) {
                case (TId['mapitem']['expand'] + '-'):
                    this.itemChangeExpand(numid);
                    return true;
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
                            __self.renderManager();
                        }
                    });
                    return true;
                case (TId['bieditp']['id'] + '-'):
                    // API.showPageEditorPanel(numid);
                    return true;
                case (TId['biedit']['id'] + '-'):
                    var item = NS.manager.menuList.find(numid);
                    if (item.isLink){
                        new NS.LinkEditorPanel(item, pcfg);
                    } else {
                        var page = NS.manager.pageList.find(numid, 'index');
                        new NS.PageEditorPanel(page, pcfg);
                    }
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
            var __self = this;
            var TM = this.template, T = this.template.data, lst = "", index = 0;
            menuList.foreach(function(item){
                var btns = "";
                btns += (index == 0 ? T['biempty'] : T['biup']);
                btns += (item.order < menuList.count() - 1 ? T['bidown'] : T['biempty']);
                btns += T['biedit'];
                btns += (item.isLink ? T['biempty'] : T['biadd']);
                btns += T['birem'];

                var lstChilds = "";
                if (item.childs.count() > 0){
                    lstChilds = TM.replace('maplist', {
                        'id': item.id,
                        'list': __self.buildList(item.childs)
                    });
                }

                NS.manager.pageList.foreach(function(page){
                    if (page.name == 'index' || page.menuid != item.id){
                        return;
                    }
                    lstChilds += TM.replace('mapitempage', {
                        'url': page.URL(),
                        'title': page.name + ".html",
                        'level': item.level + 1,
                        'buttons': T['biempty'] + T['biempty'] + T['bieditp'] + T['biempty'] + T['biremp'],
                        'id': page.id
                    });
                });

                lst += TM.replace('mapitem', {
                    'imgtype': TM.replace(item.isLink ? 'imgtypelink' : 'imgtypemenu'),
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
            var __self = this, item = NS.manager.menuList.find(menuid);
            new NS.MenuItemRemovePanel(item, function(){
                __self.renderManager();
            });
        },
        itemChangeExpand: function(menuid){
            var list = NS.manager.menuList;
            var item = list.find(menuid);
            if (!L.isValue(item)){
                return;
            }
            item.expand = !item.expand;
            this.renderList();
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
            this.renderManager();
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'managerwidget,maplist,mapitem,mapitempage,imgtypelink,imgtypemenu,biempty,biup,bidown,biadd,bieditp,biedit,birem,biremp'
            }
        }
    });

    NS.MenuItemCreatePanel = Y.Base.create('termsOfUseDialog', SYS.Dialog, [
    ], {
        onClick: function(e){
            switch(e.dataClick){
                case "cancel":
                    this.hide();
                    return true;
                case "create":
                    this.createMenuItem();
                    return true;
            }
        },

        createMenuItem: function(){
            var __self = this;
            var onSave = function(){
                NS.life(__self.get('onSave'));
            };
            var pMenu = NS.manager.menuList.find(this.menuid),
                tm = this.template;


            if (tm.gel('mnuadd.type0').checked){
                new NS.PageEditorPanel(new NS.Page({'nm': 'index'}), {
                    'parentMenuItem': pMenu,
                    'onSave': onSave
                });
            } else if (tm.gel('mnuadd.type1').checked){
                new NS.LinkEditorPanel(new NS.Menu({
                    'pid': L.isValue(pMenu) ? pMenu.id : 0
                }), {'onSave': onSave});
            } else {
                new NS.PageEditorPanel(new NS.Page(), {
                    'parentMenuItem': pMenu,
                    'onSave': onSave
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
                    return  TM.getEl('removepanel.' + n);
                },
                __self = this;
            Dom.setStyle(gel('btns'), 'display', 'none');
            Dom.setStyle(gel('bloading'), 'display', '');
            NS.manager.menuRemove(this.item.id, function(){
                __self.close();
                NS.life(__self.callback);
            });
        }
    });
    NS.MenuItemRemovePanel = MenuItemRemovePanel;

};
