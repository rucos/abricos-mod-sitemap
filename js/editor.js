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
	yahoo: ['tabview', 'json', 'dragdrop'],
	mod:[
		// {name: 'sys', files: ['form.js','data.js','editor.js','container.js','permission.js']},
		// TODO: Необходимо организовать сортировку запрашиваемых модулей, иначе в некоторых случаях возникают баги
		{name: 'sys', files: ['form.js','editor.js','container.js']},
		{name: 'sitemap', files: ['roles.js']}
	]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		J = YAHOO.lang.JSON;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;

	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('sitemap');
	}
	var DATA = NS.data;
	
	if (!Brick.objectExists('Brick.mod.sys.data')){
		Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
	}
	var DATAsys = Brick.mod.sys.data;
	
(function(){
	
	/**
	 * Редактор страницы.
	 * 
	 * @class PageEditorPanel
	 * @constructor
	 * @param {Integer} pageId Идентификатор страницы.
	 * @param {Boolean} withMenu Редактировать так же элемент меню, 
	 * если эта страница является страницей раздела меню.
	 * @param {Integer} parentMenuId Идентификатор элемента меню, используется в том
	 * случае, если pageId=0, т.е. создается новый элемент.
	 */
	var PageEditorPanel = function(pageId, withMenu, parentMenuId, isOnlyPage){
		this.pageId = pageId || 0;
		this.withMenu = withMenu || false;
		this.parentMenuId = parentMenuId || 0;
		this.isOnlyPage = isOnlyPage || false;
		this.saveCallBack = null;
		
		this._mods = "";
		
		PageEditorPanel.superclass.constructor.call(this, {
			overflow: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(PageEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(this._TId['pageeditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			var TM = TMG.build('pageeditor,select,option,moditem'), 
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			return T['pageeditor'];
		},
		onLoad: function(){
			new YAHOO.widget.TabView(this._TId['pageeditor']['tab']);

			var Editor = Brick.widget.Editor;
			this.editor = new Editor(this._TId['pageeditor']['editor'], {
				width: '750px', height: '250px', 'mode': Editor.MODE_VISUAL
			});
			
			if (this.withMenu){
				this.el('menucont').style.display = '';
			}

			var ttable = {'templates': DATA.get('templates', true)};
			
			if (this.pageId > 0){
				this._initTables();
				if (DATA.isFill(this.tables)){ this.renderElements(); }
			}else if (DATA.isFill(ttable)){
				this.renderElements();
			}
			DATA.onComplete.subscribe(this.dsComplete, this, true);
			DATA.request();
		},
		_initTables: function(){
			this.tables = { 
				'page': DATA.get('page', true),
				'templates': DATA.get('templates', true)
			};
			this.rows = {
				'page': DATA.get('page').getRows({id: this.pageId}) 
			};
			if (this.withMenu){
				this.tables['pagemenu'] = DATA.get('pagemenu', true);
				this.rows['pagemenu'] = DATA.get('pagemenu').getRows({id: this.pageId}); 
			}
		},
		dsComplete: function(type, args){
			if (args[0].checkWithParam('page', {id: this.pageId}) || 
				(this.pageId < 1 && args[0].checkWithParam('templates', {}))){ 
				this.renderElements(); 
			}
		},
		renderElements: function(){
			var TM = this._TM;
			// шаблон
			var ttsRows = DATA.get('templates', true).getRows(), 
				s = TM.replace('option', {'id': '','tl': ''});
			ttsRows.foreach (function(row){
				var di = row.cell;
				var key = di['nm']+':'+di['vl'];
				s += TM.replace('option', {'id': key,'tl': key});
			});
			this.el('templates').innerHTML = TM.replace('select', {'list': s});
			
			if (this.pageId > 0){
			
		 		var page = this.rows['page'].getByIndex(0).cell;
		 		this.setelv('pgtitle', page['tl']);
		 		this.setelv('pgkeys', page['mtks']);
		 		this.setelv('pgdesc', page['mtdsc']);
		 		this.setelv('pgname', page['nm']);
		 		
		 		TM.getEl('select.id').value = page['tpl'];
		 		
		 		if (page['nm'] == 'index'){ 
		 			this.el('pgnamecont').style.display = 'none'; 
		 		}
		 		
		 		this._mods = page['mods'];
		 		
				this.editor.setContent(page['bd']);
				
				var Editor = Brick.widget.Editor;
				if (page['em']*1 > 0){
					this.editor.set('mode', Editor.MODE_CODE);
				}
				
				if (this.withMenu){
			 		var menu = this.rows['pagemenu'].getByIndex(0).cell;
			 		this.setelv('mtitle', menu['tl']);
			 		this.setelv('mdesc', menu['dsc']);
			 		this.setelv('mname', menu['nm']);
			 		this.setelv('moff', menu['off']);
				}
				
				this.renderMods();
			}else{
				if (this.withMenu){
		 			this.el('pgnamecont').style.display = 'none'; 
			 		this.setelv('pgname', 'index');
				}
			}
			
		},
		onClick: function(el){
			var TId = this._TId;
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
		destroy: function(){
			this.editor.destroy();
			DATA.onComplete.unsubscribe(this.dsComplete);
			PageEditorPanel.superclass.destroy.call(this);
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
			
			this._initTables();
			var table = DATA.get('page');
			
			var page = this.pageId>0 ? this.rows['page'].getByIndex(0) : table.newRow();
			var Editor = Brick.widget.Editor;
			
			if (this.pageId == 0){
				DATA.get('page').getRows({id: 0}).add(page);
			}
			page.update({
				'nm': this.elv('pgname'),
				'tl': this.elv('pgtitle'),
				'mtks': this.elv('pgkeys'),
				'mtdsc': this.elv('pgdesc'),
				'bd': this.editor.getContent(),
				'tpl': this._TM.getEl('select.id').value,
				'mods': this._mods,
				'em': this.editor.get('mode') == Editor.MODE_CODE ? 1 : 0
			});
			if (this.pageId == 0){
				page.cell['mid'] = this.parentMenuId;
			}
			table.applyChanges();
			
			if (this.withMenu){
				var tableMenu = DATA.get('pagemenu');
				var menu = this.pageId > 0 ? this.rows['pagemenu'].getByIndex(0) : tableMenu.newRow(); 
				
				if (this.pageId == 0){
					this.rows['pagemenu'].add(menu);
					menu.cell['pid'] = this.parentMenuId;
				}
				menu.update({
					'tl': this.elv('mtitle'),
					'dsc': this.elv('mdesc'),
					'nm': this.elv('mname'),
					'off': this.elv('moff')
				});
				tableMenu.applyChanges();
			}
			
			if (!L.isNull(DATA.get('menulist'))){
				DATA.get('menulist').getRows().clear();
			}
			
			var pagelist = DATA.get('pagelist');
			if (!L.isNull(pagelist)){
				pagelist.getRows().clear();
			}
			var callback = this.saveCallBack; 
			if (L.isFunction(callback)){
				var onDsComplete;
				onDsComplete = function(){
					DATA.onComplete.unsubscribe(onDsComplete);
					callback();
				};
				DATA.onComplete.subscribe(onDsComplete);
			}
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
			var o = this._mods == "" ? {} : J.parse(this._mods);
			var di = r.cell;
			if (!o[di['own']]){ o[di['own']] = {}; }
			o[di['own']][di['nm']] = '';
			this._mods = J.stringify(o);
			this.renderMods();
		},
		renderMods: function(){
			var TM = this._TM;
			var smods = this._mods; 
			if (smods == ''){ return; }
			
			var o = J.parse(smods);
			this.modsid = {};

			var lst = "", i=0;
			
			for (var own in o){
				for (var bk in o[own]){
					this.modsid[i] = { 'own': own, 'bk': bk};
					lst += TM.replace('moditem', {
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
			this.editor.insertValue("[mod]"+o['own']+":"+o['bk']+"[/mod]");
		},
		removeModule: function(id){
			var no = {}, co = this.modsid[id];
			var o =  this._mods == "" ? {} : J.parse(this._mods); 
			
			for (var own in o){ 
				for (var bk in o[own]){
					if (own != co['own'] || bk != co['bk']){
						if (!no[own]){no[own]={};}
						no[own][bk] = '';
					}
				}
			}
			this._mods = J.stringify(no);
			this.renderMods();
		}
	});
	
	NS.PageEditorPanel = PageEditorPanel;
	
	API.showPageEditorPanelObj = function(param){
		param = L.merge({
			pageid: 0, 
			withmenu: false, 
			parentmenuid: 0, 
			isonlypage: false,
			savecallback: null
		}, param || {});
		API.showPageEditorPanel(param.pageid, param.withmenu, param.parentmenuid, param.isonlypage, param.savecallback);
	};
	
	API.showPageEditorPanel = function(pageId, withMenu, parentMenuId, isOnlyPage, saveCallBack){
		NS.roles.load(function(){
			var widget = new NS.PageEditorPanel(pageId, withMenu, parentMenuId, isOnlyPage);
			widget.saveCallBack = saveCallBack;
		});
	};
	
	var Mods = function(rows, callback){
		this.rows = rows;
		this.callback = callback;
		Mods.superclass.constructor.call(this);
	};
	YAHOO.extend(Mods, Brick.widget.Dialog, {
		el: function(name){ return Dom.get(TId['mods'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			var TM = TMG.build('mods,modstable,modsrow'), 
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			return T['mods'];
		},
		onClick: function(el){
			var TId = this._TId;
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
			var TM = this._TM;
			var lst = "";
			this.rows.foreach(function(row){
				var di = row.cell;
				lst += TM.replace('modsrow', {'id': di['id'], 'own': di['own'], 'nm': di['nm']});
			});
			TM.getEl('mods.table').innerHTML = TM.replace('modstable', {'rows': lst});
		}
	});
})();	
	
//Link Editor 
(function(){

	/**
	 * Редактор ссылки.
	 * 
	 * @class LinkEditorPanel
	 * @constructor
	 * @param {Integer} linkId Идентификатор ссылки.
	 * @param {Integer} parentMenuId Идентификатор элемента меню, используется в том
	 * случае, если linkId=0, т.е. создается новый элемент.
	 */
	var LinkEditorPanel = function(linkId, parentMenuId){
		this.linkId = linkId || 0;
		this.parentMenuId = parentMenuId || 0;
		LinkEditorPanel.superclass.constructor.call(this);
	};
	YAHOO.extend(LinkEditorPanel, Brick.widget.Dialog, {
		el: function(name){ return Dom.get(this._TId['linkeditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			var TM = TMG.build('linkeditor'), 
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			return T['linkeditor']; 
		},
		onLoad: function(){
			if (this.linkId > 0){
				this._initTables();
				if (DATA.isFill(this.tables)){ this.renderElements(); }
				DATA.onComplete.subscribe(this.dsComplete, this, true);
			}else{
				this.renderElements();
			}
		},
		_initTables: function(){
			var tables = {'link': DATA.get('link', true)};
			var rows = tables['link'].getRows({'id': this.linkId});
			this.tables = tables;
			this.rows = rows;
		},
		dsComplete: function(type, args){
			if (args[0].checkWithParam('link', {id: this.linkId})){ 
				this.renderElements(); 
			}
		},
		renderElements: function(){
			if (this.linkId > 0){
				var d = this.rows.getByIndex(0).cell;
		 		this.setelv('mtitle', d['tl']);
		 		this.setelv('mdesc', d['dsc']);
		 		this.setelv('mlink', d['lnk']);
			}
		},
		onClick: function(el){
			var tp = this._TId['linkeditor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			}
			return false;
		},
		save: function(){
			this._initTables();
			var row = this.linkId > 0 ? this.rows.getByIndex(0) : DATA.get('link').newRow();
			if (this.linkId == 0){
				this.rows.add(row);
				row.update({
					'pid': this.parentMenuId
				});
			}
			row.update({
				'tl': this.elv('mtitle'),
				'dsc': this.elv('mdesc'),
				'lnk': this.elv('mlink')
			});
			
			var menulist = DATA.get('menulist');
			if ((row.isUpdate() && !L.isNull(menulist)) || row.isNew()){ menulist.getRows().clear(); }

			DATA.get('link').applyChanges();
			DATA.request();
			this.close();
		}
	});
	NS.LinkEditorPanel = LinkEditorPanel;
})();
};
