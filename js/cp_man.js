/**
* @version $Id: cp_man.js 9 2009-08-17 09:48:36Z roosit $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.sitemap');

	var T, TId;
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		C = YAHOO.util.Connect,
		J = YAHOO.lang.JSON;

	var BC = Brick.util.Connection;
	var DATA;

	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		mod:[
		     {name: 'sitemap', files: ['api.js']},
		     {name: 'sys', files: ['data.js','form.js']}
		    ],
    onSuccess: function() {
		
			if (!Brick.objectExists('Brick.mod.sitemap.data')){
				Brick.mod.sitemap.data = new Brick.util.data.byid.DataSet('sitemap');
			}
			DATA = Brick.mod.sitemap.data;

			T = Brick.util.Template['sitemap']['cp_man'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			Brick.util.CSS.update(Brick.util.CSS['sitemap']['cp_man']);
			delete Brick.util.CSS['sitemap']['cp_man'];
			
			moduleInitialize();
			delete moduleInitialize;
			
			Brick.Loader.add({yahoo: ["dragdrop"]});
	  }
	});
var moduleInitialize = function(){

(function(){
	
	Brick.mod.sitemap.cppage = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];

				this.manager = new Manager();
				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
				});
				var ds = Brick.mod.sitemap.data;
				ds.request();
			},
			clickEvent: function(el){
				if (this.manager.clickEvent(el)){ return true; }
				return false;
			}
		}
	}();
	
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

	var Manager = function(){
		this.init();
	};
	Manager.prototype = {
		init: function(){
			this.root = null;
			
			this.tables = {'menulist': DATA.get('menulist', true), 'pagelist': DATA.get('pagelist', true)};

			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
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

			var ul = Dom.get(TId['panel']['items']);
			elClear(ul);
			var s = this.renderNode (this.root);
			
			s = tSetVar(s, 'p', 'bk_sitemap');

			ul.innerHTML = s;
			this.initNode(root);
		}, 
		initNode: function(node){
			var img = Dom.get(TId['mapitem']['expand']+'-'+node.id);
			if (!L.isNull(img)){ img.style.display = node.child.length > 0 ? '' : 'none'; }
			if (node.child.length == 0){ return; }
			this.itemChangeEC(node.id, node.options.expand);
			
			for (var i=0;i<node.child.length;i++){
				this.initNode(node.child[i]);
			}
		},
		renderNode: function(node){
			
			var list = "", t, item, child, tc, btns, i;
			var count = node.child.length;
			
			for (i=0;i<node.pages.length;i++){
				item = node.pages[i];
				t = T['mapitempage'];
				t = tSetVar(t, 'url', item.getUrl());
				t = tSetVar(t, 'title', item.name);
				t = tSetVar(t, 'level', item.level);
				t = tSetVar(t, 'buttons', T['biempty']+T['biempty']+T['bieditp']+T['biempty']+T['biremp']);
				t = tSetVar(t, 'id', item.id);
				list += t;
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
					child = tSetVar(T['maplist'], 'id', item.id);
					child = tSetVar(child, 'list', tc);
				}
				list += tSetVar(t, 'child', child);
			}

			return list;
		},
		clickEvent: function(el){
			var __self = this;
			
			if (el.id == TId['panel']['rootedit']){
				var row = this.tables['pagelist'].getRows().find({'mid': 0, 'nm': 'index'});
				Brick.mod.sitemap.api.editor.editPage(row.id);
			}else if (el.id == TId['panel']['rootadd']) {
				new Brick.mod.sitemap.ItemCreater(0);
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
					new Brick.mod.sitemap.ItemCreater(numid);
					return true;
				case (TId['bieditp']['id']+'-'):
					Brick.mod.sitemap.api.editor.editPage(numid);
					return true;
				case (TId['biedit']['id']+'-'):
					var item = this.root.find(numid);
					if (item.link){
						Brick.mod.sitemap.api.editor.editLink(numid);
					}else{
						var row = this.tables['pagelist'].getRows().find({'mid': numid, 'nm': 'index'});
						Brick.mod.sitemap.api.editor.editMenu(row.id);
					}
					return true;
				case (TId['birem']['id']+'-'):
					Brick.mod.sitemap.api.editor.removeMenu(numid);
					return true;
				case (TId['biremp']['id']+'-'):
					Brick.mod.sitemap.api.editor.removePage(numid);
					return true;
				}
			}
			return false;
		},
		itemChangeEC: function(id, status){
			var container = Dom.get(TId['maplist']['id']+'-'+id);
			if (L.isNull(container)){ return; }
			var img = Dom.get(TId['mapitem']['expand']+'-'+id);
			if (typeof status == 'undefined'){ status = container.style.display == 'none'; }
			container.style.display = status ? '' : 'none';
			img.src = Brick.util.Language.getc('sitemap.img.'+(status?'collapse':'expand'));
			var node = this.root.find(id);
			node.options.expand = status;
		},
		itemMove: function(id, act){
			var item = this.root.find(id);
			if (L.isNull(item)){ return; }
			var i, list = item.parent.child, json=[];
			for (i=0;i<list.length;i++){ list[i].row.update({'ord': i}); }
			for (i=0;i<list.length;i++){
				if (list[i].id == id){
					if (act == 'up'){
						list[i-1].row.update({'ord': i});
						list[i].row.update({'ord': i-1});
					}else if(act == 'down'){
						list[i].row.update({'ord': i+1});
						list[i+1].row.update({'ord': i});
					}
				}
			}
			this.tables['menulist'].applyChanges();
			DATA.request();
		}
	}
	
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
		
		this.options = { expand: false }
	};
	mapnode.prototype = {
		addChild: function(childNode){
			childNode.order = this.child.length;
			this.child[this.child.length] = childNode;
		},
		addPage: function (page){ this.pages[this.pages.length] = page },
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
	}
	
	var mapnodepage = function(parent, row, level){
		this.parent = parent;
		this.type = 'page';
		var d = row.cell;
		this.id = d['id'];
			
		this.menuid = d['mid'];
		this.contentid = d['cid'];
		this.name = d['nm']+'.html';
		this.level = level;
	}
	
	mapnodepage.prototype = {
		getUrl: function(){
			if (L.isNull(this.parent)){
				return '/';
			}
			return this.parent.getUrl()+this.name;
		}
	}
	function cloneOptions(node, tree){
		var treeNode = tree.find(node.id);
		if (!L.isNull(treeNode)){
			treeNode.options.expand = node.options.expand;
		}
		for (var i=0;i<node.child.length;i++){
			cloneOptions(node.child[i], tree);
		}
	}
	
})();

/* * * * * * * * * * * * Menu Item Creater * * * * * * * * * * */
(function(){

	var Creater = function(menuid){
		this.menuid = menuid;
		Creater.superclass.constructor.call(this, T['mnuadd']);
	}
	YAHOO.extend(Creater, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['mnuadd'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			var tp = TId['mnuadd']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['badd']: this.create(); return true;
			}
		},
		create: function(){
			if (this.el('type0').checked){
				Brick.mod.sitemap.api.editor.createMenu(this.menuid);
			}else if(this.el('type1').checked){
				Brick.mod.sitemap.api.editor.createLink(this.menuid);
			}else{
				Brick.mod.sitemap.api.editor.createPage(this.menuid);
			}
			this.close();
		}
	});

	Brick.mod.sitemap.ItemCreater = Creater;
})();
};
})();
