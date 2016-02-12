var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['data.js', 'form.js']},
        {name: '{C#MODNAME}', files: ['editor.js']},
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
            var instance = this,
                tp = this.template,
                index = 0,
                lst = "",
                childVisibleStatus = NS.SitemapWidget.childVisibleStatus;

            menuList.foreach(function(item){

                var childButtons = '',
                    childList = '',
                    childStatus = !!childVisibleStatus[item.id],
                    childCount = 0;

                NS.manager.pageList.foreach(function(page){
                    if (page.name === 'index' || page.menuid != item.id){
                        return;
                    }
                    childList += tp.replace('rowPage', {
                        url: page.URL(),
                        title: page.name + ".html",
                        id: page.id
                    });
                    childCount++;
                });

                if (item.childs.count() > 0){
                    childList += instance._renderList(item.childs);
                    childCount += item.childs.count();
                }

                if (childList !== ''){
                    childButtons = tp.replace('childButtons', {
                        id: item.id,
                        count: childCount,
                        isHideShow: childStatus ? 'hide' : '',
                        isHideHide: !childStatus ? 'hide' : '',
                    });

                    if (childStatus){
                        childList = tp.replace('table', {
                            rows: childList
                        });
                    } else {
                        childList = '';
                    }
                }

                lst += tp.replace(item.isLink ? 'rowLink' : 'rowMenu', {
                    id: item.id,
                    title: item.title,
                    url: item.URL(),
                    upDownButtons: tp.replace('upDownButtons', {
                        id: item.id,
                        disabledUp: index === 0 ? 'disabled' : '',
                        disabledDown: (item.order < menuList.count() - 1) ? '' : 'disabled'
                    }),
                    childButtons: childButtons,
                    childList: childList
                });


                index++;
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
            this.appURLUpdate();
        },

        showChilds: function(itemid){
            NS.SitemapWidget.childVisibleStatus[itemid] = true;
            this.renderList();
        },
        hideChilds: function(itemid){
            NS.SitemapWidget.childVisibleStatus[itemid] = false;
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
                    id: item.id,
                    o: item.order
                };
            });
            NS.manager.menuSaveOrders(sd);
            this.renderList();
        },
        onClick: function(e){
            var target = e.defineTarget || e.target,
                itemid = target.getData('id');

            if (target.get('disabled')){
                return;
            }

            switch (e.dataClick) {
                case 'showChilds':
                    this.showChilds(itemid);
                    return true;
                case 'hideChilds':
                    this.hideChilds(itemid);
                    return true;
                case 'moveUp':
                    this.itemMove(itemid, 'up');
                    return true;
                case 'moveDown':
                    this.itemMove(itemid, 'down');
                    return true;
            }


            // TODO: old remove

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
                    this.old_itemChangeExpand(numid);
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
                    this.old_itemMove(numid, 'up');
                    return true;
                case (TId['bidown']['id'] + '-'):
                    this.old_itemMove(numid, 'down');
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
                    this.old_menuRemove(numid);
                    return true;
                case (TId['biremp']['id'] + '-'):
                    this.removePage(numid);
                    return true;
            }
            return false;
        },
        old_renderManager: function(){
            this.template.setHTML({
                items: this.old_buildList()
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
        old_buildList: function(menuList){
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
                        'list': instance.old_buildList(item.childs)
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
        old_menuRemove: function(menuid){
            var instance = this, item = NS.manager.menuList.find(menuid);
            new NS.MenuItemRemovePanel(item, function(){
                instance.old_renderManager();
            });
        },
        old_itemChangeExpand: function(menuid){
            var list = NS.manager.menuList;
            var item = list.find(menuid);
            if (!L.isValue(item)){
                return;
            }
            item.expand = !item.expand;
            this.old_renderList();
        },
        old_itemMove: function(menuid, act){
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
                value: 'widget,table,rowMenu,rowPage,rowLink,upDownButtons,childButtons' +
                ',maplist,mapitem,mapitempage,imgtypelink,imgtypemenu,biempty,biup,bidown,biadd,bieditp,biedit,birem,biremp'
            }
        },
        childVisibleStatus: {}
    });

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
            NS.manager.old_menuRemove(this.item.id, function(){
                instance.close();
                NS.life(instance.callback);
            });
        }
    });
    NS.MenuItemRemovePanel = MenuItemRemovePanel;

};
