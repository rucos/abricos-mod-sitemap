/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	var wWait = Brick.widget.WindowWait;
	var DATA;
	
	Brick.namespace('mod.sitemap.api');

(function(){

	var loadlib = function(callback){
		wWait.show();
		Brick.Loader.add({
			mod:[
			     {name: 'sitemap', files: ['editor.js']},
			     {name: 'sys', files: ['data.js']}
			    ],
	    onSuccess: function() {
				wWait.hide();
				if (!Brick.objectExists('Brick.mod.sitemap.data')){
					Brick.mod.sitemap.data = new Brick.util.data.byid.DataSet('sitemap');
				}
				DATA = Brick.mod.sitemap.data;
				callback();
		  }
		});
	};
	
	var loaddata = function(tables, callback){
		if (!DATA.isFill(tables)){
			var ondsupdate = function(){
				DATA.onComplete.unsubscribe(ondsupdate);
				callback();
			};
			DATA.onComplete.subscribe(ondsupdate);
			DATA.request();
			return;
		}
		callback();
	};
	
	var loadovertables = function(tables){
		tables['templates'] = DATA.get('templates', true);
	};
	
	var Editor = function(){
		this.init();
	};
	Editor.prototype = {
		init: function(){ this.isLoadLib = false; },
		editPage: function(pageid){
			var __self = this;
			if (!this.isLoadLib){
				this.isLoadLib = true;
				loadlib(function(){ __self.editPage(pageid) });
				return;
			}
			var tables = { 'page': DATA.get('page', true) }
			loadovertables(tables);
			var rows = { 'page': tables['page'].getRows({id: pageid}) }
			loaddata(tables, function(){
				__self.activeEditor = new Brick.mod.sitemap.page.Editor(rows);
			});
		},
		createPage: function(menuid, pagename){
			var __self = this;
			if (!this.isLoadLib){
				this.isLoadLib = true;
				loadlib(function(){ __self.createPage(menuid) });
				return;
			}
			var tables = { 'page': DATA.get('page', true) }
			loadovertables(tables);
			var rows = { 'page': tables['page'].getRows({id: 0}) }
			loaddata(tables, function(){
				var nrows = { 'page': rows['page'].clone() }
				nrows['page'].add(tables['page'].newRow());
				var row = nrows['page'].getByIndex(0); 
				row.cell['nm'] = pagename;
				row.cell['mid'] = menuid;
				__self.activeEditor = new Brick.mod.sitemap.page.Editor(nrows);
			});
		},
		removePage: function(pageid){
			var __self = this;
			if (!this.isLoadLib){
				this.isLoadLib = true;
				loadlib(function(){ __self.removePage(pageid) });
				return;
			}
			var tables = {'pagelist': DATA.get('pagelist', true) }
			loaddata(tables, function(){
				var page = tables['pagelist'].getRows().getById(pageid);
				if (YAHOO.lang.isNull(page)){ return; }
				page.remove();
				tables['pagelist'].applyChanges();
				DATA.request();
			});
		},

		removeMenu: function(menuid){
			var __self = this;
			if (!this.isLoadLib){
				this.isLoadLib = true;
				loadlib(function(){ __self.removeMenu(menuid) });
				return;
			}
			var tables = {
				'pagelist': DATA.get('pagelist', true), 
				'menulist': DATA.get('menulist', true)
			}
			loaddata(tables, function(){
				var menu = tables['menulist'].getRows().getById(menuid);
				if (YAHOO.lang.isNull(menu)){ return; }
				menu.remove();
				tables['menulist'].applyChanges();
				tables['pagelist'].getRows().clear();
				DATA.request();
			});
		},
		editMenu: function(pageid){
			var __self = this;
			if (!this.isLoadLib){
				this.isLoadLib = true;
				loadlib(function(){ __self.editMenu(pageid) });
				return;
			}
			var tables = {
				'page': DATA.get('page', true), 
				'pagemenu': DATA.get('pagemenu', true)
			};
			loadovertables(tables);
			var rows = {
				'page': tables['page'].getRows({id: pageid}),
				'pagemenu': tables['pagemenu'].getRows({id: pageid})
			};
			loaddata(tables, function(){
				__self.activeEditor = new Brick.mod.sitemap.page.Editor(rows);
			});
		},
		createMenu: function(menuid){
			var __self = this;
			if (!this.isLoadLib){
				this.isLoadLib = true;
				loadlib(function(){ __self.createMenu(menuid) });
				return;
			}
			var tables = {
				'page': DATA.get('page', true), 
				'pagemenu': DATA.get('pagemenu', true)
			}
			loadovertables(tables);
			var rows = {
				'page': tables['page'].getRows({id: 0}),
				'pagemenu': tables['pagemenu'].getRows({id: 0})
			}
			loaddata(tables, function(){
				var nrows = {
					'page': rows['page'].clone(),
					'pagemenu': rows['pagemenu'].clone()
				}
				nrows['page'].add(tables['page'].newRow());
				nrows['page'].getByIndex(0).cell['nm'] = 'index';
				nrows['pagemenu'].add(tables['pagemenu'].newRow());
				nrows['pagemenu'].getByIndex(0).cell['pid'] = menuid;
				__self.activeEditor = new Brick.mod.sitemap.page.Editor(nrows);
			});
		},
		createLink: function(menuid){
			var __self = this;
			if (!this.isLoadLib){
				this.isLoadLib = true;
				loadlib(function(){ __self.createLink(menuid) });
				return;
			}
			var tables = {'link': DATA.get('link', true)}
			var rows = tables['link'].getRows({'id': 0});
			loaddata(tables, function(){
				var row = tables['link'].newRow();
				row.cell['pid'] = menuid;
				row.cell['tp'] = 1;
				var nrows = rows.clone();
				nrows.add(row);
				__self.activeEditor = new Brick.mod.sitemap.link.Editor(nrows);
			});
		},
		editLink: function(menuid){
			var __self = this;
			if (!this.isLoadLib){
				this.isLoadLib = true;
				loadlib(function(){ __self.editLink(menuid) });
				return;
			}
			var tables = {'link': DATA.get('link', true)}
			var rows = tables['link'].getRows({'id': menuid});
			loaddata(tables, function(){
				__self.activeEditor = new Brick.mod.sitemap.link.Editor(rows);
			});
		}
	};
	
	Brick.mod.sitemap.api.editor = new Editor();

})();
})();