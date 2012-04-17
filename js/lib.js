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

	var SitemapManager = function(callback){
		this.init(callback);
	};
	SitemapManager.prototype = {
		init: function(callback){
			
			this.brickList = null;

			NS.sitemapManager = this;
			NS.life(callback, this);
		},
		ajax: function(data, callback){
			Brick.ajax('{C#MODNAME}', {
				'data': data || {},
				'event': function(request){
					NS.life(callback, request.data);
				}
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
		}
	};
	NS.SitemapManager = SitemapManager;
	NS.sitemapManager = null;
	
	NS.initSitemapManager = function(callback){
		if (L.isNull(NS.sitemapManager)){
			NS.sitemapManager = new SitemapManager(callback);
		}else{
			NS.life(callback, NS.sitemapManager);
		}
	};
};