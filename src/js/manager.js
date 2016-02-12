var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['data.js', 'form.js']},
        {name: '{C#MODNAME}', files: ['editor.js']},
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    var L = YAHOO.lang;

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
        _findItemContainer: function(itemid, itemType){
            var tp = this.template,
                ret = null;

            tp.one('list').all('.list-group-item').each(function(node){
                var titemid = node.getData('id') | 0,
                    titemType = node.getData('type');

                if (itemid !== titemid || itemType !== titemType){
                    return;
                }
                ret = node;
            }, this);

            return ret;
        },
        _visibleRemoveItemContainer: function(itemid, itemType, isShow){
            itemid = itemid | 0;

            var tp = this.template,
                nodeContainer = this._findItemContainer(itemid, itemType);

            if (!nodeContainer){
                return;
            }

            var nodeRemove = nodeContainer.one('.removeContainer'),
                nodeButtons = nodeContainer.one('.buttonsContainer');

            if (isShow){
                nodeRemove.setHTML(tp.replace(itemType + 'Remove', {id: itemid}));
                nodeRemove.removeClass('hide');
                nodeButtons.addClass('hide');
            } else {
                nodeRemove.addClass('hide');
                nodeButtons.removeClass('hide');
            }
        },

        showRemoveMenu: function(menuid){
            this._visibleRemoveItemContainer(menuid, 'menu', true);
        },
        closeRemoveMenu: function(menuid){
            this._visibleRemoveItemContainer(menuid, 'menu', false);
        },
        removeMenu: function(menuid){
            var instance = this,
                item = NS.manager.menuList.find(menuid);

            if (!item){
                return;
            }
            this.set('waiting', true);

            NS.manager.menuRemove(item.id, function(){
                instance.set('waiting', false);
                instance.closeRemoveMenu(menuid);
                instance.renderList();
            });
        },

        showRemovePage: function(pageid){
            this._visibleRemoveItemContainer(pageid, 'page', true);
        },
        closeRemovePage: function(pageid){
            this._visibleRemoveItemContainer(pageid, 'page', false);
        },
        removePage: function(pageid){
            var instance = this,
                item = NS.manager.pageList.find(pageid);
            
            if (!item){
                return;
            }

            this.set('waiting', true);

            NS.manager.pageRemove(item.id, function(){
                instance.set('waiting', false);
                instance.closeRemovePage(pageid);
                instance.renderList();
            });
        },

        showRemoveLink: function(linkid){
            this._visibleRemoveItemContainer(linkid, 'link', true);
        },
        closeRemoveLink: function(linkid){
            this._visibleRemoveItemContainer(linkid, 'link', false);
        },
        removeLink: function(linkid){
            var instance = this,
                item = NS.manager.menuList.find(linkid);

            if (!item){
                return;
            }

            this.set('waiting', true);

            NS.manager.menuRemove(item.id, function(){
                instance.set('waiting', false);
                instance.closeRemoveLink(linkid);
                instance.renderList();
            });
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

                case 'showRemoveMenu':
                    this.showRemoveMenu(itemid);
                    return true;
                case 'closeRemoveMenu':
                    this.closeRemoveMenu(itemid);
                    return true;
                case 'removeMenu':
                    this.removeMenu(itemid);
                    return true;

                case 'showRemovePage':
                    this.showRemovePage(itemid);
                    return true;
                case 'closeRemovePage':
                    this.closeRemovePage(itemid);
                    return true;
                case 'removePage':
                    this.removePage(itemid);
                    return true;

                case 'showRemoveLink':
                    this.showRemoveLink(itemid);
                    return true;
                case 'closeRemoveLink':
                    this.closeRemoveLink(itemid);
                    return true;
                case 'removeLink':
                    this.removeLink(itemid);
                    return true;
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {
                value: 'widget,table,rowMenu,rowPage,rowLink,upDownButtons,childButtons' +
                ',menuRemove,pageRemove,linkRemove'
            }
        },
        childVisibleStatus: {}
    });

};
