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
				Dom.addClass(item.parentNode, 'nochild');
				return; 
			} 
			if (Dom.hasClass(child, 'hide')){
				Dom.removeClass(item.parentNode, 'open');
			}else{
				Dom.addClass(item.parentNode, 'open');
			}
		}
	};
	
	
	var HMenu = function(el){
		this.init(el);
	};
	HMenu.prototype = {
		init: function(el){
			
			this.el = el;
			
			var __self = this;
			E.on(el, 'click', function(e){
				var el = E.getTarget(e);
				if (__self.onClick(el)){ E.preventDefault(e); }
			});
		},
		onClick: function(el){
			if (Dom.hasClass(el, 'smvm-opcl')
				|| Dom.hasClass(el, 'smvmtl-opcl')){
				this.changeStatus(el);
			}
			return true;
		},
		changeStatus: function(item){
			var id = (item.id || "").replace('smvmtl', 'smvm');
			var child = Dom.get(id+'-c');
			
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
				Dom.addClass(item.parentNode, 'nochild');
				return; 
			} 
			if (Dom.hasClass(child, 'hide')){
				Dom.removeClass(item.parentNode, 'open');
			}else{
				Dom.addClass(item.parentNode, 'open');
			}
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

		var menus = Dom.getElementsByClassName('hmenufline');
		for (var i=0;i<menus.length;i++){
			new HMenu(menus[i]);
		}
	};
	
};
