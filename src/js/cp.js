/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2011 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[ {name: 'user', files: ['cpanel.js']} ]
};
Component.entryPoint = function(){
	
	if (Brick.Permission.check('sitemap', '50') != 1){ return; }
	
	var cp = Brick.mod.user.cp;
	
	var menuItem = new cp.MenuItem(this.moduleName);
	menuItem.icon = '/modules/sitemap/js/images/cp_icon.gif';
	menuItem.entryComponent = 'manager';
	menuItem.entryPoint = 'Brick.mod.sitemap.API.showManagerWidget';
	
	cp.MenuManager.add(menuItem);
};
