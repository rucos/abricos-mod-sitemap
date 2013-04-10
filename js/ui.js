/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
var Component = new Brick.Component();
Component.requires = {
	yahoo:['dom']
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	NS['UI'] = NS['UI'] || {}; 
	
	var VMenu = function(el){
		this.init(el);
	};
	VMenu.prototype = {
		init: function(el){
			this.el = el;
			
			var __self = this;
			E.on(el, 'click', function(e){
				var el = E.getTarget(e);
				if (__self.onClick(el)){ E.preventDefault(e); }
			});
			
			var btns = Dom.getElementsByClassName('smvm-opcl');
			for (var i=0;i<btns.length;i++){
				this.updateStatus(btns[i]);
			}
		},
		onClick: function(el){
			if (Dom.hasClass(el, 'smvm-opcl')){
				this.changeStatus(el);
				return true;
			}
			return false;
		},
		changeStatus: function(item){
			item['href'] = "#";
			var child = Dom.get(item.id+'-c');
			if (L.isNull(child)){ return; }
			if (Dom.hasClass(child, 'hide')){
				Dom.removeClass(child, 'hide');
			}else{
				Dom.addClass(child, 'hide');
			}
			this.updateStatus(item);
		},
		updateStatus: function(item){
			var child = Dom.get(item.id+'-c');
			if (L.isNull(child)){
				// Dom.addClass(item.parentNode, 'nochild');
				return; 
			} 
			if (Dom.hasClass(child, 'hide')){
				Dom.removeClass(item.parentNode, 'open');
			}else{
				Dom.addClass(item.parentNode, 'open');
			}
		}
	};
	
	
	var HMenu = function(el, pel){
		this.init(el, pel);
	};
	HMenu.prototype = {
		init: function(el, pel){
			
			this.el = el;
			this.pel = pel;
			this.elVMenu = Dom.getElementsByClassName('ttmenu', "", pel)[0];
			this.elSelected = Dom.getElementsByClassName('selected', "", el)[0];
			
			var __self = this;
			E.on(el, 'click', function(e){
				var el = E.getTarget(e);
				if (__self.onClick(el)){ E.preventDefault(e); }
			});
			
			this.selectedItem = null;
			
			var checkParent = function(cel){
				if (cel == pel) { return true; }
				if (cel.parentNode){
					return checkParent(cel.parentNode);
				}
				return false;
			};
			E.on(document.body, 'click', function(e){
				var cel = E.getTarget(e);
				if (!checkParent(cel)){
					__self.closeChildMenu();
				}else{
					if (Dom.hasClass(cel, 'closebtn')
						|| Dom.hasClass(cel, 'closebtna')){
						__self.closeChildMenu();
						E.preventDefault(e);
					}			
				}
			});
		},
		closeChildMenu: function(){
			Dom.addClass(this.elSelected, 'selected');
			Dom.addClass(this.elVMenu, 'hide');
		},
		onClick: function(el){
			if (Dom.hasClass(el, 'smvm-opcl')
				|| Dom.hasClass(el, 'smvmtl-opcl')){
				this.changeStatus(el); // TODO: чистой воды костыль!
				return this.changeStatus(el);
			}
			return true;
		},
		changeStatus: function(item){
// Brick.console(item);			
			var id = (item.id || "").replace('smvmtl', 'smvm'),
				child = Dom.get(id+'-c'),
				elLi = Dom.get(id+'-li');
			
			if (L.isNull(child) || L.isNull(elLi)){ return false; }
			
			var rgm = Dom.getRegion(this.el),
				rg = Dom.getRegion(elLi),
				y = rg.top+rg.height,
				mh = Math.max(rgm.top+rgm.height-y, 0),
				elVMenu = this.elVMenu;

			Dom.setY(elVMenu, y);
			Dom.setStyle(elVMenu, 'width', (rgm.width-2)+'px');
			Dom.setStyle(elVMenu, 'min-height', mh+'px');
			Dom.removeClass(elVMenu, 'hide');

			
			var els = Dom.getElementsByClassName('selected', "", this.el);
			for (var i=0;i<els.length;i++){
				Dom.removeClass(els[i], 'selected');
			}
			Dom.addClass(elLi, 'selected');
			
			Dom.addClass(this.selectedItem, 'hide');
			this.selectedItem = child;
			
			if (Dom.hasClass(child, 'hide')){
				Dom.removeClass(child, 'hide');
			}else{
				Dom.addClass(child, 'hide');
			}
			
			return true;
		}
	};
	
	var firstInit = false;
	NS.UI.vmenuInit = function(){
		if (firstInit){ return; }
		firstInit = true; 
		
		var menus = Dom.getElementsByClassName('vmenuf');
		for (var i=0;i<menus.length;i++){
			new VMenu(menus[i]);
		}
		
		var hmenus = Dom.getElementsByClassName('hmenuf');
		var arr = [];
		for (var i=0;i<hmenus.length;i++){
			var menus = Dom.getElementsByClassName('hmenufline', '', hmenus[i]);
			Brick.console(menus);
			for (var ii=0;ii<menus.length;ii++){
				arr[arr.length] = new HMenu(menus[ii], hmenus[i]);
			}
		}
	};
	
};
