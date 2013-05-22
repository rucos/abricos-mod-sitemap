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
		{name: 'sys', files: ['form.js','editor.js','container.js']},
		{name: 'sitemap', files: ['lib.js']}
	]
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		buildTemplate = this.buildTemplate,
		BW = Brick.mod.widget.Widget;

	var J = YAHOO.lang.JSON;

	var TMG = this.template;
	var buildTemplate = this.buildTemplate;
	
	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('sitemap');
	}
	var DATA = NS.data;
	
	if (!Brick.objectExists('Brick.mod.sys.data')){
		Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
	}
	
	
	var PageEditorWidget = function(container, page, cfg){
		cfg = L.merge({
			'onCancel': null,
			'onSave': null
		}, cfg || {});
		
		PageEditorWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 'tnames': 'pageeditorwidget,select,option,moditem' 
		}, page, cfg);
	};
	YAHOO.extend(PageEditorWidget, BW, {
		init: function(page, cfg){
			this.page = page;
			this.cfg = cfg;
		},
		onLoad: function(page, cfg){
			if (!L.isValue(page)){
				this.elShow('nullitem');
				this.elHide('view');
				return;
			}
			var TM = this._TM;
			
			new YAHOO.widget.TabView(this.gel('tab'));

			var Editor = Brick.widget.Editor;
			this.editor = new Editor(this.gel('editor'), {
				'width': '750px', height: '250px', 
				'mode': page.editorMode>0 ? Editor.MODE_CODE : Editor.MODE_VISUAL,
				'value': page.body
			});
			
			var mItem = NS.manager.menuList.find(page.menuId);
			if (L.isValue(mItem) && page.menuId > 0 && page.name == 'index'){
				this.elShow('menucont');
				
				this.elSetValue({
					'mtitle': mItem.title,
					'mdesc': mItem.descript,
					'mname': mItem.name,
					'moff': mItem.off
				});
			}else{
	 			this.elHide('pgnamecont'); 
		 		this.elSetValue('pgname', 'index');
			}
			
			var s = TM.replace('option', {'id': '','tl': ''});
			var tmps = NS.manager.templates;
			for (var i=0;i<tmps.length;i++){
				s += TM.replace('option', {'id': tmps[i],'tl': tmps[i]});
			}

			this.elSetHTML('templates', TM.replace('select', {'list': s}));
			
			this.elSetValue({
				'pgtitle': page.title,
		 		'pgkeys': page.metaKeys,
		 		'pgdesc': page.metaDesc,
		 		'pgname': page.name,
		 		'select.id': page.template
			});

			
	 		if (page.name == 'index'){
	 			this.elHide('pgnamecont');
	 		}

	 		this.renderMods();
		},
		renderMods: function(){
			var TM = this._TM, page = this.page, lst = "";
	 		this.modsid = {};
	 		if (L.isString(page.mods) && page.mods.length > 0){
				var o = YAHOO.lang.JSON.parse(page.mods), i = 0;

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
				this.elSetHTML('modlist', lst);	 		
	 		}else{
				this.elSetHTML('modlist', lst);	 		
	 		}
		},
		onClick: function(el, tp){
			var TId = this._TId;
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
		close: function(){
			NS.life(this.cfg['onCancel']);
		},
		save: function(){
			
		}
	});
	NS.PageEditorWidget = PageEditorWidget;
	
	var PageEditorPanel = function(page, cfg){
		this.page = page;
		cfg = L.merge({
			'onClose': null,
			'overflow': true
		}, cfg || {});
		this.ccfg = cfg;
		PageEditorPanel.superclass.constructor.call(this, cfg);
	};
	YAHOO.extend(PageEditorPanel, Brick.widget.Dialog, {
		initTemplate: function(){
			return buildTemplate(this, 'pageeditorpanel').replace('pageeditorpanel');
		},
		onLoad: function(){
			var __self = this, cfg = this.ccfg;
			var closeCallback = function(){
				NS.life(cfg['close']);
			};
			this.editorWidget = new PageEditorWidget(this._TM.getEl('pageeditorpanel.widget'), this.page, {
				'onClose': closeCallback,
				'onSave': closeCallback
			});
		}
		
		/*
		renderElements: function(){

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

			var __self = this;
			NS.initManager(function(man){
				man.loadBrickList(function(list){
					if (L.isNull(list)){ return; }
					new Mods(function(id){
						__self.addModule(id);
					});
				});
			});
		},
		addModule: function(id){
			var o = this._mods == "" ? {} : J.parse(this._mods);
			var di = NS.manager.brickList.get(id);
			
			if (!o[di['mName']]){ o[di['mName']] = {}; }
			
			o[di['mName']][di['bName']] = '';
			this._mods = J.stringify(o);
			this.renderMods();
		},
		renderMods: function(){
			
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
		/**/
	});
	
	NS.PageEditorPanel = PageEditorPanel;
	
	NS.API.showPageEditorPanelObj = function(param){
		param = L.merge({
			pageid: 0, 
			withmenu: false, 
			parentmenuid: 0, 
			isonlypage: false,
			savecallback: null
		}, param || {});
		NS.API.showPageEditorPanel(param.pageid, param.withmenu, param.parentmenuid, param.isonlypage, param.savecallback);
	};
	
	NS.API.showPageEditorPanel = function(pageId, withMenu, parentMenuId, isOnlyPage, saveCallBack){
		NS.roles.load(function(){
			var widget = new NS.PageEditorPanel(pageId, withMenu, parentMenuId, isOnlyPage);
			widget.saveCallBack = saveCallBack;
		});
	};
	
	var Mods = function(callback){
		this.callback = callback;
		Mods.superclass.constructor.call(this);
	};
	YAHOO.extend(Mods, Brick.widget.Dialog, {
		el: function(name){ return Dom.get(this._TId['mods'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return buildTemplate(this, 'mods,modstable,modsrow').replace('mods');
		},
		onLoad: function(){
			var TM = this._TM;
			var lst = "";
			NS.manager.brickList.foreach(function(di){
				lst += TM.replace('modsrow', {
					'id': di['id'], 'own': di['mName'], 'nm': di['bName']
				});
			});
			TM.getEl('mods.table').innerHTML = TM.replace('modstable', {'rows': lst});
		},
		onClick: function(el){
			var TId = this._TId, tp = TId['mods']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			if (prefix == (TId['modsrow']['select']+'-')){
				this.callback(numid); this.close(); return true;
			}
			return false;
		}
	});

	
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
};
