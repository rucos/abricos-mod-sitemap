/*
@version $Id: lib.js 1452 2012-03-30 09:34:16Z roosit $
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: 'sys', files: ['item.js','number.js']},
        {name: 'widget', files: ['notice.js']},
        {name: '{C#MODNAME}', files: ['roles.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		L = YAHOO.lang,
		R = NS.roles;

	var SysNS = Brick.mod.sys;

	NS.lif = function(f){return L.isFunction(f) ? f : function(){}; };
	NS.life = function(f, p1, p2, p3, p4, p5, p6, p7){
		f = NS.lif(f); f(p1, p2, p3, p4, p5, p6, p7);
	};
	NS.Item = SysNS.Item;
	NS.ItemList = SysNS.ItemList;
	
	var Page = function(d){
		d = L.merge({
			'nm': '',
			'tl': '',
			'mid': 0,
			'dtl': null
		}, d || {});
		Page.superclass.constructor.call(this, d);
	};
	YAHOO.extend(Page, NS.Item, {
		init: function(d){
			this.detail = null;
			Page.superclass.init.call(this, d);
		},
		update: function(d){
			this.name = d['nm'];
			this.title = d['tl'];
			this.menuId = d['mid']|0;
			
			if (L.isValue(d['dtl'])){
				this.detail = new PageDetail();
			}
		}
	});
	NS.Page = Page;
	
	var PageDetail = function(d){
		d = L.merge({
			'bd': '',
			'mods': '',
			'em': 0,
			'mtdsc': '',
			'mtks': '',
			'tpl': ''
		}, d || {});
		this.init(d);
	};
	PageDetail.prototype = {
		init: function(d){
			this.body = d['bd'];
			this.mods = d['mods'];
			this.editorMode = d['em']|0;
			this.metaKeys = d['mtks'];
			this.metaDesc = d['mtdsc'];
			this.template = d['tpl'];
		}
	};
	NS.PageDetail = PageDetail;
	
	var PageList = function(d){
		PageList.superclass.constructor.call(this, d, Page, {});
	};
	YAHOO.extend(PageList, SysNS.ItemList, {});
	NS.PageList = PageList;
	
	var Menu = function(d){
		d = L.merge({
			'pid': 0,
			'tl':'', // заголовок
			'nm': '', // имя (URL)
			'ord': 0,
			'childs': []
		}, d || {});
		Menu.superclass.constructor.call(this, d);
	};
	YAHOO.extend(Menu, SysNS.Item, {
		init: function(d){
			this.parent		= null;
			this.childs		= new NS.MenuList(d['childs']);
			
			var __self = this;
			this.childs.foreach(function(menu){
				menu.parent = __self;
			});
			Menu.superclass.init.call(this, d);
		},
		update: function(d){
			this.parentid	= d['pid']|0;
			this.title		= d['tl'];
			this.name		= d['nm'];
			this.order		= d['ord']|0;
		},
		getPathLine: function(){
			var line = [this];
			if (!L.isNull(this.parent)){
				var pline = this.parent.getPathLine();
				pline[pline.length] = this;
				line = pline;
			}
			return line;
		},
		URL: function(){
			var url = "/", pline = this.getPathLine();
			for (var i=1;i<pline.length;i++){
				url += pline[i].name+'/';
			}
			return url;
		}
	});		
	NS.Menu = Menu;
	
	var MenuList = function(d){
		MenuList.superclass.constructor.call(this, d, Menu, {
			'order': '!order,title'
		});
	};
	YAHOO.extend(MenuList, SysNS.ItemList, {
		find: function(menuid){
			var fmenu = null;
			this.foreach(function(menu){
				if (menu.id == menuid){
					fmenu = menu;
					return true;
				}
				var ffmenu = menu.childs.find(menuid);
				if (!L.isNull(ffmenu) && ffmenu.id == menuid){
					fmenu = ffmenu;
					return true;
				}
			});
			return fmenu;
		}
	});
	NS.MenuList = MenuList;	
	
	var MBrick = function(d){
		d = L.merge({
			'md': '',
			'bk': ''
		}, d || {});
		MBrick.superclass.constructor.call(this, d);
	};
	YAHOO.extend(MBrick, NS.Item, {
		update: function(d){
			this.mName = d['md'];
			this.bName = d['bk'];
		}
	});
	NS.MBrick = MBrick;

	var MBrickList = function(d){
		MBrickList.superclass.constructor.call(this, d, MBrick);
	};
	YAHOO.extend(MBrickList, NS.ItemList, {});
	NS.MBrickList = MBrickList;

	var Manager = function(callback){
		this.init(callback);
	};
	Manager.prototype = {
		init: function(callback){
			NS.manager = this;
			
			this.menuList = new NS.MenuList();
			this.pageList = new NS.PageList();
			this.brickList = null;
			this.templates = [];

			var __self = this;
			this.ajax({
				'do': 'initdata'
			}, function(d){
				__self._updateTemplates(d);
				__self.menuList = __self._updateMenuList(d);
				__self.pageList = __self._updatePageList(d);
				
				NS.life(callback, __self);
			});
		},
		ajax: function(data, callback){
			Brick.ajax('{C#MODNAME}', {
				'data': data || {},
				'event': function(request){
					NS.life(callback, request.data);
				}
			});
		},
		_updateTemplates: function(d){
			if (!L.isValue(d) || !L.isValue(d['templates'])){
				return null;
			}
			this.templates = d['templates'];
		},
		_updateMenuList: function(d){
			if (!L.isValue(d) || !L.isValue(d['menus']) || !L.isValue(d['menus']['list'])){
				return null;
			}
			var list = new NS.MenuList(d['menus']['list']);
Brick.console(list);			
			/*
			var rootItem = list.find(0);
			if (!L.isNull(rootItem)){
				// rootItem.title = this.getLang('menu.title');
				rootItem.title = 'Root';
			}
			/**/
			return list;
		},
		_updatePageList: function(d){
			if (!L.isValue(d) || !L.isValue(d['pages']) || !L.isValue(d['pages']['list'])){
				return null;
			}
			var list = new NS.MenuList(d['pages']['list']);

			return list;
		},
		menuListLoad: function(callback){
			if (!L.isNull(this.menuList)){
				NS.life(callback, this.menuList);
				return;
			}
			var __self = this;
			this.ajax({
				'do': 'menulist'
			}, function(d){
				__self.menuList = __self._updateMenuList(d);
				NS.life(callback, __self.menuList);
			});
		},
		loadBrickList: function(callback){
			if (L.isNull(!this.brickList)){
				NS.life(callback, this.brickList);
			}
			var __self = this;
			this.ajax({
				'do': 'bricks'
			}, function(d){
				
				if (L.isNull(d)){
					NS.life(callback, null);
				}
				
				var bkList = new MBrickList(d);
				__self.brickList = bkList;
				NS.life(callback, bkList);
			});
		},
		_updatePage: function(d){
			if (!L.isValue(d) || !L.isValue(d['page'])){ return null; }

			return new Page(d['page']);
		},
		pageLoad: function(pageid, callback){
			var __self = this;
			this.ajax({
				'do': 'page',
				'pageid': pageid
			}, function(d){
				var page = __self._updatePage(d);
				NS.life(callback, page);
			});
		},
		pageSave: function(pageid, sd, callback){
			var __self = this;
			this.ajax({
				'do': 'pagesave',
				'savedata': sd
			}, function(d){
				var page = __self._updatePage(d);
				NS.life(callback, page);
			});
		}
	};
	NS.Manager = Manager;
	NS.manager = null;
	
	NS.initManager = function(callback){
		if (L.isNull(NS.manager)){
			NS.manager = new Manager(callback);
		}else{
			NS.life(callback, NS.manager);
		}
	};
};