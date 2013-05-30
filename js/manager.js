/*
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

/**
 * @module Sitemap
 * @namespace Brick.mod.sitemap
 */
var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sitemap', files: ['api.js','editor.js']},
		{name: 'sys', files: ['data.js','form.js']}
	]
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		buildTemplate = this.buildTemplate,
		BW = Brick.mod.widget.Widget;
	
	var API = NS.API;

	var ManagerPanel = function(){
		ManagerPanel.superclass.constructor.call(this, {
			'width': '780px', fixedcenter: true
		});
	};
	YAHOO.extend(ManagerPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return buildTemplate(this, 'managerpanel').replace('managerpanel');
		},
		onLoad: function(){
			this.managerWidget = new NS.ManagerWidget(this._TM.getEl('managerpanel.container'));
		},
		onClick: function(el){
			
			if (el.id == this._TId['managerpanel']['bclose']){
				this.close(); return true;
			}
			return false;
		}
	});
	
	NS.ManagerPanel = ManagerPanel;	

	var ManagerWidget = function(container, cfg){
		cfg = L.merge({}, cfg || {});
		
		ManagerWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 
			'tnames': 'managerwidget,maplist,mapitem,mapitempage,imgtypelink,imgtypemenu,biempty,biup,bidown,biadd,bieditp,biedit,birem,biremp' 
		}, cfg);
	};
	YAHOO.extend(ManagerWidget, BW, {
		init: function(cfg){
			this.cfg = cfg;
			this._isLoadManager = false;
		},
		onLoad: function(){
			var __self = this;
			NS.initManager(function(man){
				__self._onLoadManager();
			});
		},
		_onLoadManager: function(){
			this.elHide('loading');
			this.elShow('view');
			this._isLoadManager = true;
			this.render();
		},
		buildList: function(menuList){
			var __self = this;
			var TM = this._TM, T = this._T, lst = "", index=0;
			menuList.foreach(function(item){
				var btns = "";
				btns += (index == 0 ? T['biempty'] : T['biup']);
				btns += (item.order < menuList.count()-1 ? T['bidown'] : T['biempty']);
				btns += T['biedit'];
				btns += (L.isValue(item.link) ? T['biempty'] : T['biadd']);
				btns += T['birem'];
				
				var lstChilds = "";
				if (item.childs.count() > 0){
					lstChilds = TM.replace('maplist', {
						'id': item.id,
						'list': __self.buildList(item.childs)
					});
				}
				
				NS.manager.pageList.foreach(function(page){
					if (page.name == 'index' || page.menuid != item.id){ return; }
					lstChilds += TM.replace('mapitempage', {
						'url': page.URL(),
						'title': page.name+".html",
						'level': item.level+1,
						'buttons': T['biempty']+T['biempty']+T['bieditp']+T['biempty']+T['biremp'],
						'id': page.id
					});
				});
				
				lst += TM.replace('mapitem', {
					'imgtype': TM.replace(L.isValue(item.link) ? 'imgtypelink' : 'imgtypemenu'),
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
		render: function(){
			if (!this._isLoadManager){ return; }
			
			var list = NS.manager.menuList;
			this.elSetHTML('items', this.buildList(list));
			
			this.renderList(list);
		},
		renderList: function(list){
			list = list || NS.manager.menuList;
			var __self = this, TId = this._TId;
			
			list.foreach(function(item){
				var container = Dom.get(TId['maplist']['id']+'-'+item.id);
				var img = Dom.get(TId['mapitem']['expand']+'-'+item.id);
				if (!L.isNull(img)){ img.style.display = item.childs.count() > 0 ? '' : 'none'; }
				
				img.src = Brick.util.Language.getc('mod.sitemap.img.'+(item.expand?'collapse':'expand'));
				Dom.setStyle(container, 'display', item.expand ? '' : 'none');
				__self.renderList(item.childs);
				
			});
		},
		onClick: function(el, tp){
			var TId = this._TId;
			
			switch(el.id){
			case tp['rootedit']: 
				var page = NS.manager.pageList.find(0, 'index');
				new NS.PageEditorPanel(page);
				return true;
			case tp['rootadd']:
				new NS.MenuItemCreatePanel(0);
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['mapitem']['expand']+'-'):
				this.itemChangeExpand(numid);
				return true;
			case (TId['biup']['id']+'-'): this.itemMove(numid, 'up'); return true;
			case (TId['bidown']['id']+'-'): this.itemMove(numid, 'down'); return true;
			case (TId['biadd']['id']+'-'):
				new NS.MenuItemCreatePanel(numid);
				return true;
			case (TId['bieditp']['id']+'-'):
				API.showPageEditorPanel(numid);
				return true;
			case (TId['biedit']['id']+'-'):
				var item = NS.manager.menuList.find(numid);
				if (item.link){
					API.showLinkEditorPanel(numid);
				}else{
					var page = NS.manager.pageList.find(numid, 'index');
					new NS.PageEditorPanel(page);
				}
				return true;
			case (TId['birem']['id']+'-'): this.removeMenu(numid); return true;
			case (TId['biremp']['id']+'-'): this.removePage(numid); return true;
			}
			return false;
		},
		itemChangeExpand: function(menuid){
			var list = NS.manager.menuList;
			var item = list.find(menuid);
			if (!L.isValue(item)){ return; }
			item.expand = !item.expand;
			this.renderList();
		},
		itemMove: function(menuid, act){
			var item = NS.manager.menuList.find(menuid);
			if (L.isNull(item)){ return; }
			
			var list = L.isNull(item.parent) ? NS.manager.menuList : item.parent.childs;
			
			for (var i=0;i<list.count();i++){ list.getByIndex(i).order = i;}
			for (var i=0;i<list.count();i++){
				var item = list.getByIndex(i);
				if (item.id == menuid){
					if (act == 'up'){
						list.getByIndex(i-1).order = i;
						list.getByIndex(i).order = i-1;
					}else if(act == 'down'){
						list.getByIndex(i).order = i+1;
						list.getByIndex(i+1).order = i;
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
			this.render();
		}
	});
	NS.ManagerWidget = ManagerWidget;
	
	NS.API.showManagerWidget = function(container){
		return new NS.ManagerWidget(container);
	};

	var MenuItemCreatePanel = function(menuid){
		this.menuid = menuid;
		MenuItemCreatePanel.superclass.constructor.call(this);
	};
	YAHOO.extend(MenuItemCreatePanel, Brick.widget.Dialog, {
		initTemplate: function(){
			return buildTemplate(this, 'mnuadd').replace('mnuadd');
		},
		onClick: function(el){
			var tp = this._TId['mnuadd']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['badd']: this.create(); return true;
			}
		},
		create: function(){
			var pMenu = NS.manager.menuList.find(this.menuid);
			
			if (this._TM.getEl('mnuadd.type0').checked){
				new NS.PageEditorPanel(new NS.Page({'nm': 'index'}), {
					'parentMenuItem': pMenu
				});
			}else if(this._TM.getEl('mnuadd.type1').checked){
				// API.showLinkEditorPanel(0, this.menuid);
			}else{
				new NS.PageEditorPanel(new NS.Page(), {
					'parentMenuItem': pMenu
				});
			}
			this.close();
		}
	});

	NS.MenuItemCreatePanel = MenuItemCreatePanel;
};
