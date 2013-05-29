/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
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

	/**
	 * Панель администратора.
	 * 
	 * @class ManagerPanel
	 */
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

	function createTree(parent, menus, level, pages){
		var id = parent.id;
		menus.foreach(function(row){
			if (id != row.cell['pid']){ return; }
			var node = new mapnode(parent, row, level);
			parent.addChild(node);
			createTree(node, menus, level+1, pages);
		});
		pages.foreach(function(row){
			if (row.cell['mid'] == id && row.cell['nm'] != 'index'){
				var node = new mapnodepage(parent, row, level);
				parent.addPage(node);
			}
		});
	};

	var ManagerWidget = function(container, cfg){
		cfg = L.merge({}, cfg || {});
		
		ManagerWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 'tnames': 'managerwidget,maplist,mapitem,mapitempage,imgtypelink,imgtypemenu,biempty,biup,bidown,biadd,bieditp,biedit,birem,biremp' 
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
					if (page.name == 'index' || page.menuId != item.id){ return; }
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
				// var row = this.tables['pagelist'].getRows().find({'mid': 0, 'nm': 'index'});
				// API.showPageEditorPanel(row.id, false, 0);
				return true;
			case tp['rootadd']: 
				// new NS.ItemCreatePanel(0);
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
				new NS.ItemCreatePanel(numid);
				return true;
			case (TId['bieditp']['id']+'-'):
				API.showPageEditorPanel(numid);
				return true;
			case (TId['biedit']['id']+'-'):
				var item = this.root.find(numid);
				if (item.link){
					API.showLinkEditorPanel(numid);
				}else{
					var row = this.tables['pagelist'].getRows().find({'mid': numid, 'nm': 'index'});
					API.showPageEditorPanel(row.id, true);
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
	/*
	var ManagerWidget = function(container){
		container = L.isString(container) ? Dom.get(container) : container;
		this.init(container);
	};
	ManagerWidget.prototype = {
		init: function(container){
			var TM = buildTemplate(this, 'managerwidget,maplist,mapitem,mapitempage,imgtypelink,imgtypemenu,biempty,biup,bidown,biadd,bieditp,biedit,birem,biremp');
			container.innerHTML = TM.replace('managerwidget');
	
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			
			this.root = null;
			
			this.tables = {
				'menulist': DATA.get('menulist', true), 
				'pagelist': DATA.get('pagelist', true)
			};

			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		onClick: function(el){
			var TId = this._TId;
			
			if (el.id == TId['managerwidget']['rootedit']){
				var row = this.tables['pagelist'].getRows().find({'mid': 0, 'nm': 'index'});
				API.showPageEditorPanel(row.id, false, 0);
			}else if (el.id == TId['managerwidget']['rootadd']) {
				new NS.ItemCreatePanel(0);
			}else{
				var prefix = el.id.replace(/([0-9]+$)/, '');
				var numid = el.id.replace(prefix, "");
				
				switch(prefix){
				case (TId['mapitem']['expand']+'-'):
					this.itemChangeEC(numid);
					return true;
				case (TId['biup']['id']+'-'): this.itemMove(numid, 'up'); return true;
				case (TId['bidown']['id']+'-'): this.itemMove(numid, 'down'); return true;
				case (TId['biadd']['id']+'-'):
					new NS.ItemCreatePanel(numid);
					return true;
				case (TId['bieditp']['id']+'-'):
					API.showPageEditorPanel(numid);
					return true;
				case (TId['biedit']['id']+'-'):
					var item = this.root.find(numid);
					if (item.link){
						API.showLinkEditorPanel(numid);
					}else{
						var row = this.tables['pagelist'].getRows().find({'mid': numid, 'nm': 'index'});
						API.showPageEditorPanel(row.id, true);
					}
					return true;
				case (TId['birem']['id']+'-'): this.removeMenu(numid); return true;
				case (TId['biremp']['id']+'-'): this.removePage(numid); return true;
				}
			}
			return false;
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['menulist','pagelist'])){ this.render(); }
		},
		destroy: function(){
			 DATA.onComplete.unsubscribe(this.onDSUpdate, this);
		},
		render: function(){
			var rootRow = this.tables['menulist'].newRow();
			rootRow.cell['nm'] = 'root';
			rootRow.cell['tl'] = Brick.env.host;
			rootRow.cell['pid'] = -1;
			
			var root = new mapnode(null, rootRow);
			createTree(root, this.tables['menulist'].getRows(), 1, this.tables['pagelist'].getRows()); 
			if (!L.isNull(this.root)){
				cloneOptions(this.root, root);
			}
			this.root = root;

			
			var s = this.renderNode (this.root);
			
			s = tSetVar(s, 'p', 'bk_sitemap');
			
			this._TM.getEl('managerwidget.items').innerHTML = s;
			
			this.initNode(root);
		}, 
		renderNode: function(node){
			
			var TM = this._TM, T = this._T, TId = this._TId;
			
			var lst = "", t, item, child, tc, btns, i;
			var count = node.child.length;
			
			for (i=0;i<node.pages.length;i++){
				item = node.pages[i];
				lst += TM.replace('mapitempage', {
					'url': item.getUrl(),
					'title': item.name,
					'level': item.level,
					'buttons': T['biempty']+T['biempty']+T['bieditp']+T['biempty']+T['biremp'],
					'id': item.id
				});
			}
			
			for (i=0;i<node.child.length;i++){
				item = node.child[i];
				t = T['mapitem'];
				
				if (item.link){
					t = tSetVar(t, 'imgtype', T['imgtypelink']);
				}else{
					t = tSetVar(t, 'imgtype', T['imgtypemenu']);
				}

				t = tSetVar(t, 'url', item.getUrl());
				t = tSetVar(t, 'title', item.title);
				t = tSetVar(t, 'level', item.level);
				t = tSetVar(t, 'childstatus', item.child.length > 0 ? 'children-visible' : 'no-children');
				
				btns = "";
				btns += (item.order == 0 ? T['biempty'] : T['biup']);
				btns += (item.order < count-1 ? T['bidown'] : T['biempty']);
				btns += T['biedit'];
				btns += (item.link.length > 0 ? T['biempty'] : T['biadd']);
				btns += T['birem'];
				t = tSetVar(t, 'buttons', btns);
				t = tSetVar(t, 'id', item.id);

				child = "";
				tc = this.renderNode(item);
				if (tc != ""){
					child = TM.replace('maplist', {
						'id': item.id,
						'list': tc
					});
				}
				lst += tSetVar(t, 'child', child);
			}

			return lst;
		},
		itemChangeEC: function(id, status){
			var TId = this._TId;
			var container = Dom.get(TId['maplist']['id']+'-'+id);
			if (L.isNull(container)){ return; }
			var img = Dom.get(TId['mapitem']['expand']+'-'+id);
			if (typeof status == 'undefined'){ status = container.style.display == 'none'; }
			container.style.display = status ? '' : 'none';
			img.src = Brick.util.Language.getc('mod.sitemap.img.'+(status?'collapse':'expand'));
			var node = this.root.find(id);
			node.options.expand = status;
		},
		removeMenu: function(menuid){
			var menu = DATA.get('menulist').getRows().getById(menuid);
			if (L.isNull(menu)){ return; }
			menu.remove();
			DATA.get('menulist').applyChanges();
			DATA.get('pagelist').getRows().clear();
			DATA.request();
		},
		removePage: function(pageid){
			var page = DATA.get('pagelist').getRows().getById(pageid);
			if (YAHOO.lang.isNull(page)){ return; }
			page.remove();
			DATA.get('pagelist').applyChanges();
			DATA.request();
		}
	};
	
	NS.ManagerWidget = ManagerWidget;
	/**/
	
	var mapnode = function(parent, row, level){
		this.parent = parent;
		this.level = level;
		this.row = row;

		var d = row.cell;
		if (d['pid'] == -1){ d['id'] = 0; }
		this.type = d['lnk'] ? 'link' : 'menu';
		
		this.pid = d['pid'];
		this.id = d['id'];

		this.name = d['nm'];
		this.title = d['tl'];
		this.descript = d['dsc'];
		this.deldate = d['dd'];
		this.status = d['off'];
		this.link = d['lnk'];

		this.order = 0;
		this.child = [];
		this.pages = [];
		
		this.options = { expand: false };
	};
	mapnode.prototype = {
		addChild: function(childNode){
			childNode.order = this.child.length;
			this.child[this.child.length] = childNode;
		},
		addPage: function (page){ this.pages[this.pages.length] = page; },
		childCount: function(){ return this.child.length+this.pages.length; },
		find: function(id){
			if (this.id == id){ return this; }
			var i, ret = null;
			for (i=0;i<this.child.length;i++){
				ret=this.child[i].find(id);
				if (!L.isNull(ret)){
					return ret;
				}
			}
			return null;
		},
		fullPath: function(){
			var ret = this.title;
			if (!L.isNull(this.parent)){
				ret = this.parent.fullPath() +'/'+ ret;
			}
			return ret;
		},
		getUrl: function(){
			if (L.isNull(this.parent)){ return '/'; }
			if (this.type == 'link'){ return this.link; }
			return this.parent.getUrl()+this.name+'/';
		}
	};
	
	var mapnodepage = function(parent, row, level){
		this.parent = parent;
		this.type = 'page';
		var d = row.cell;
		this.id = d['id'];
			
		this.menuid = d['mid'];
		this.contentid = d['cid'];
		this.name = d['nm']+'.html';
		this.level = level;
		
		this.getUrl = function(){
			if (L.isNull(this.parent)){
				return '/';
			}
			return this.parent.getUrl()+this.name;
		};
	};

	var cloneOptions = function(node, tree){
		var treeNode = tree.find(node.id);
		if (!L.isNull(treeNode)){
			treeNode.options.expand = node.options.expand;
		}
		for (var i=0;i<node.child.length;i++){
			cloneOptions(node.child[i], tree);
		}
	};	

	var ItemCreatePanel = function(menuid){
		this.menuid = menuid;
		ItemCreatePanel.superclass.constructor.call(this);
	};
	YAHOO.extend(ItemCreatePanel, Brick.widget.Dialog, {
		el: function(name){ return Dom.get(this._TId['mnuadd'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
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
			if (this.el('type0').checked){
				API.showPageEditorPanel(0, true ,this.menuid);
			}else if(this.el('type1').checked){
				API.showLinkEditorPanel(0, this.menuid);
			}else{
				API.showPageEditorPanel(0, false, this.menuid, true);
			}
			this.close();
		}
	});

	NS.ItemCreatePanel = ItemCreatePanel;
};
