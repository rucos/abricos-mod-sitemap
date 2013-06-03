/*
@package Abricos
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
			this.menuid = d['mid']|0;
			
			if (L.isValue(d['dtl']) || d['id'] == 0){
				this.detail = new PageDetail(d['dtl']);
			}
		},
		URL: function(){
			var url = "";
			
			var menuItem = NS.manager.menuList.find(this.menuid);
			if (L.isValue(menuItem)){
				url = menuItem.URL();
			}
			if (this.name != "index"){
				url += this.name+".html";
			}
			
			return url;
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
	YAHOO.extend(PageList, SysNS.ItemList, {
		find: function(menuid, name){
			name = name || 'index';
			var fpage = null;
			this.foreach(function(page){
				if (page.menuid == menuid && page.name == name){
					fpage = page;
					return true;
				}
			});
			return fpage;
		}
	});
	NS.PageList = PageList;
	
	var Menu = function(d){
		d = L.merge({
			'pid': 0,
			'tl': '', // заголовок
			'dsc': '',
			'nm': '', // имя (URL)
			'lnk': '',
			'ord': 0,
			'childs': []
		}, d || {});
		Menu.superclass.constructor.call(this, d);
	};
	YAHOO.extend(Menu, SysNS.Item, {
		init: function(d){
			this.parent		= null;
			this.level		= 1;
			this.childs		= new NS.MenuList(d['childs']);
			
			Menu.superclass.init.call(this, d);
		},
		update: function(d){
			this.parentid	= d['pid']|0;
			this.title		= d['tl'];
			this.descript	= d['dsc'];
			this.name		= d['nm'];
			this.isLink		= L.isString(d['lnk']) && d['lnk'].length > 0;
			this.link		= this.isLink ? d['lnk'] : null;
			this.order		= d['ord']|0;
		},
		getPathLine: function(){
			var line = [this];
			if (L.isValue(this.parent)){
				var pline = this.parent.getPathLine();
				pline[pline.length] = this;
				line = pline;
			}
			return line;
		},
		URL: function(){
			if (L.isValue(this.link)){ return this.link; }
			var url = "/", pline = this.getPathLine();
			for (var i=0;i<pline.length;i++){
				url += pline[i].name+'/';
			}
			return url;
		}
	});		
	NS.Menu = Menu;
	
	var MenuList = function(d){
		MenuList.superclass.constructor.call(this, d, Menu, {
			'order': 'order,title'
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
	
	
	var isValue = function(o, path){
		if (!L.isValue(o)){ return false; }
		path = path || "";
		var a = path.split(".");
		for (var j=0; j<a.length; j++) {
			if (!L.isValue(o[a[j]])){ return false; }
			o=o[a[j]];
		}
		return L.isValue(o);
	};

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
					
					// setTimeout(function(){ // DEBUG

						NS.life(callback, request.data);
						
					// }, 1500);
				}
			});
			
			
		},
		_updateTemplates: function(d){
			if (!isValue(d,'templates')){ return null; }
			this.templates = d['templates'];
		},
		_updateMenuList: function(d){
			if (!isValue(d, 'menus.list')){ return null; }
			
			var list = new NS.MenuList(d['menus']['list']);
			
			var upd = function(lst, parent){
				
				lst.foreach(function(item){
					item.parent = parent;
					item.level = L.isValue(parent) ? parent.level+1 : 1;
					upd(item.childs, item);
				});
			};
			upd(list, null);
			return list;
		},
		_updateMenu: function(d){
			if (!isValue(d, 'menu')){ return null; }
			
			var di = d['menu'], menuid = di['id']|0;
			
			if (menuid == 0){ return null; }
			
			var menu = this.menuList.find(menuid);
			
			if (L.isNull(menu)){
				
				menu = new Menu(di);
				this.menuList.add(menu);
			}else{
				menu.update(di);
			}
			this._restructureMenuList();
			
			return menu;
		},
		_restructureMenuList: function(){
			
			var menuListToArray = function(list, arr){
				list.foreach(function(item){
					arr[arr.length] = item;
					menuListToArray(item.childs, arr);
				});
			};

			var arr = [], list = new MenuList();
			menuListToArray(this.menuList, arr);
			
			this.menuList.clear();
			for (var i=0;i<arr.length;i++){
				var item = arr[i];
				item.childs.clear();
				item.parent = null;
				item.level = 1;
				list.add(item);
			}
			
			for (var i=0;i<arr.length;i++){
				var item = arr[i];
				if (item.parentid == 0){
					this.menuList.add(item);
				}else{
					var parent = list.get(item.parentid);
					if (L.isValue(parent)){
						parent.childs.add(item);
						item.parent = parent;
					}
				}
			}
			
			var upd = function(lst, parent){
				lst.foreach(function(item){
					item.level = L.isValue(parent) ? parent.level+1 : 1;
					upd(item.childs, item);
				});
			};
			upd(this.menuList, null);
		},
		_updatePageList: function(d){
			if (!L.isValue(d) || !L.isValue(d['pages']) || !L.isValue(d['pages']['list'])){
				return null;
			}
			
			var list = new NS.PageList(d['pages']['list']);
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
		menuSaveOrders: function(sd, callback){
			this.ajax({
				'do': 'menusaveorders',
				'savedata': sd
			}, function(d){
				NS.life(callback);
			});
		},
		menuRemove: function(menuid, callback){
			var __self = this, list = this.menuList, item = list.find(menuid);
			if (L.isValue(item.parent)){
				list = item.parent.childs;
			}
			
			if (!L.isValue(item)){
				NS.life(callback);
				return;
			}
			
			this.ajax({'do': 'menuremove', 'menuid': menuid}, function(d){
				list.remove(menuid);
				__self._restructureMenuList();
				NS.life(callback);
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
		
			var page = this.pageList.get(d['page']['id']);
			
			if (L.isValue(page)){
				page.update(d['page']);
			}else{
				page = new Page(d['page']);
				this.pageList.add(page);
			}

			return page;
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
				__self._updateMenu(d);
				var page = __self._updatePage(d);
				NS.life(callback, page);
			});
		},
		linkSave: function(linkid, sd, callback){
			var __self = this;
			this.ajax({
				'do': 'linksave',
				'savedata': sd
			}, function(d){
				var menu = __self._updateMenu(d);
				NS.life(callback, menu);
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