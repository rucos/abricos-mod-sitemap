/**
* @version $Id: editor.js 9 2009-08-17 09:48:36Z roosit $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.sitemap.page');
	Brick.namespace('mod.sitemap.link');
	
	Brick.namespace('mod.sys');

	var Dom, E,	L, C, T, J, TId;
	Dom = YAHOO.util.Dom;
	E = YAHOO.util.Event;
	L = YAHOO.lang;

	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var readScript = Brick.readScript;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;
	var tSetVarA = Brick.util.Template.setPropertyArray;
	
	var DATA, DATAsys;

	Brick.Loader.add({
		yahoo: ['tabview','json'],
		mod:[{name: 'sys', files: ['form.js','data.js','editor.js','container.js']}],
    onSuccess: function() {
			J = YAHOO.lang.JSON;
			
			if (!Brick.objectExists('Brick.mod.sitemap.data')){
				Brick.mod.sitemap.data = new Brick.util.data.byid.DataSet('sitemap');
			}
			DATA = Brick.mod.sitemap.data;
			
			if (!Brick.objectExists('Brick.mod.sys.data')){
				Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
			}
			DATAsys = Brick.mod.sys.data;

			T = Brick.util.Template['sitemap']['editor'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			Brick.util.CSS.update(Brick.util.CSS['sitemap']['editor']);
			
			moduleInitialize();
			delete moduleInitialize;
	  }
	});

var moduleInitialize = function(){
	
/* * * * * * * * * * * * Page Editor * * * * * * * * * * */
(function(){
	
	var Editor = function(rows){
		this.rows = rows;
		Editor.superclass.constructor.call(this, T['pageeditor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		onClose: function(){ this._editor.destroy(); },
		el: function(name){ return Dom.get(TId['pageeditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			var tp = TId['pageeditor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			case tp['baddmod']: this.selectModule(); return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case TId['moditem']['insert']+'-':
				this.insertModule(numid); return true;
			case TId['moditem']['remove']+'-':
				this.removeModule(numid); return true;
			}
			return false;

		},
		onLoad: function(){
			
			var tabView = new YAHOO.widget.TabView(TId['pageeditor']['tab']);

	 		this.row = this.rows['page'].getByIndex(0);
	 		var page = this.row.cell;
	 		this.setelv('pgtitle', page['tl']);
	 		this.setelv('pgkeys', page['mtks']);
	 		this.setelv('pgdesc', page['mtdsc']);
	 		this.setelv('pgname', page['nm']);
	 		if (page['nm'] == 'index'){ this.el('pgnamecont').style.display = 'none'; }

			this._editor = new Brick.widget.editor.TinyMCE(TId['pageeditor']['editor'],{
				'value': page['bd'],
				width: '773px', height: '400px', buttonsgroup: 'page' 
			});
			if (this.rows['pagemenu']){
		 		var menu = this.rows['pagemenu'].getByIndex(0).cell;
		 		this.setelv('mtitle', menu['tl']);
		 		this.setelv('mdesc', menu['dsc']);
		 		this.setelv('mname', menu['nm']);
			}else{
				this.el('menucont').style.display = 'none';
			}
			
			var ttsRows = DATA.get('templates', true).getRows();
			var s = "";
			ttsRows.foreach (function(row){
				var di = row.cell;
				var key = di['nm']+':'+di['vl'];
				s += tSetVarA(T['option'], {
					'id': key,
					'tl': key
				});
			});
			this.el('templates').innerHTML = tSetVar(T['select'], 'list', s);
			this.renderMods();
		},
		nameTranslite: function(){
			var el = this.el('mname');
			var title = this.el('mtitle');
			if (!el.value && title.value){
				el.value = Brick.util.Translite.ruen(title.value);
			}
		},
		save: function(){
			this.nameTranslite();
			var page = this.rows['page'].getByIndex(0);
			if (page.isNew()){
				DATA.get('page').getRows({id: 0}).add(page);
				DATA.get('pagelist').getRows().clear();
			}
			page.update({
				'nm': this.elv('pgname'),
				'tl': this.elv('pgtitle'),
				'mtks': this.elv('pgkeys'),
				'mtdsc': this.elv('pgdesc'),
				'bd': this._editor.getValue()
			});
			if (this.rows['pagemenu']){
				var menu = this.rows['pagemenu'].getByIndex(0); 
				if (menu.isNew()){
					DATA.get('pagemenu').getRows({id: 0}).add(menu);
				}
				menu.update({
					'tl': this.elv('mtitle'),
					'dsc': this.elv('mdesc'),
					'nm': this.elv('mname')
				});
				var menulist = DATA.get('menulist');
				if ((menu.isUpdate() && !L.isNull(menulist)) || menu.isNew()){ menulist.getRows().clear(); }
				DATA.get('pagemenu').applyChanges();
			}else{
				var pagelist = DATA.get('pagelist');
				if (!L.isNull('pagelist')){
					pagelist.getRows().clear();
				}
			}
			DATA.get('page').applyChanges();
			DATA.request();
			this.close();
		},
		selectModule: function(){
			var tables = {
				'bricks': DATAsys.get('bricks', true)
			};
			var rows = tables['bricks'].getRows({tp: 0});
			
			var loaddata = function(tables, callback){
				if (!DATAsys.isFill(tables)){
					var ondsupdate = function(){
						DATAsys.onComplete.unsubscribe(ondsupdate);
						callback();
					};
					DATAsys.onComplete.subscribe(ondsupdate);
					DATAsys.request();
					return;
				}
				callback();
			};
			var __self = this;
			loaddata(tables, function(){
				new Mods(rows, function(id){
					__self.addModule(rows.getById(id));
				});
			});
		},
		addModule: function(r){
			var o = {};
			if (this.row.cell['mods'].length > 0){
				o = J.parse(this.row.cell['mods']);
			}
			var di = r.cell;
			if (!o[di['own']]){ o[di['own']] = {}; }
			o[di['own']][di['nm']] = '';
			this.row.update({ 'mods': J.stringify(o) });
			this.renderMods();
		},
		renderMods: function(){
			var smods = this.row.cell['mods']; 
			if (smods == ''){ return; }
			
			var o = J.parse(smods);
			this.modsid = {};

			var lst = "", i=0;
			
			for (var own in o){
				for (var bk in o[own]){
					this.modsid[i] = { 'own': own, 'bk': bk};
					lst += tSetVarA(T['moditem'], {
						'own': own,
						'nm': bk, 
						'id': i 
					});
					i++;
				}
			}
			this.el('modlist').innerHTML = lst;
		},
		insertModule: function(id){
			var o = this.modsid[id];
			this._editor.insertValue("[mod]"+o['own']+":"+o['bk']+"[/mod]");
		},
		removeModule: function(id){
			var no = {}, co = this.modsid[id];
			var smods = this.row.cell['mods']; 
			var o = J.parse(smods);
			
			for (var own in o){ 
				for (var bk in o[own]){
					if (own != co['own'] || bk != co['bk']){
						if (!no[own]){no[own]={};}
						no[own][bk] = '';
					}
				}
			}
			this.row.update({'mods': J.stringify(no)});
			this.renderMods();
		}
	});
	
	Brick.mod.sitemap.page.Editor = Editor;
	
	var Mods = function(rows, callback){
		this.rows = rows;
		this.callback = callback;
		Mods.superclass.constructor.call(this, T['mods']);
	}
	YAHOO.extend(Mods, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['mods'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			var tp = TId['mods']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			if (prefix == TId['modsrow']['select']+'-'){
				this.callback(numid); this.close(); return true;
			}
			return false;
		},
		onLoad: function(){
			var lst = "";
			this.rows.foreach(function(row){
				var di = row.cell;
				lst += tSetVarA(T['modsrow'], {'id': di['id'], 'own': di['own'], 'nm': di['nm']});
			});
			lst = tSetVar(T['modstable'], 'rows', lst);
			Dom.get(TId['mods']['table']).innerHTML = lst;
		}
	});
	
	
})();

/* * * * * * * * * * * * Link Editor * * * * * * * * * * */
(function(){

	var Editor = function(rows){
		this.rows = rows;
		Editor.superclass.constructor.call(this, T['linkeditor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['linkeditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			var tp = TId['linkeditor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			}
		},
		onLoad: function(){
			var d = this.rows.getByIndex(0).cell;
	 		this.setelv('mtitle', d['tl']);
	 		this.setelv('mdesc', d['dsc']);
	 		this.setelv('mlink', d['lnk']);
		},
		save: function(){
			var row = this.rows.getByIndex(0);
			row.update({
				'tl': this.elv('mtitle'),
				'dsc': this.elv('mdesc'),
				'lnk': this.elv('mlink')
			});
			if (row.isNew()){DATA.get('link').getRows().add(row);}
			
			var menulist = DATA.get('menulist');
			if ((row.isUpdate() && !L.isNull(menulist)) || row.isNew()){ menulist.getRows().clear(); }

			DATA.get('link').applyChanges();
			DATA.request();
			this.close();
		}
	});
	
	Brick.mod.sitemap.link.Editor = Editor;
})();
};
})();