/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	if (!Brick.objectExists('Brick.User.CP.Manager')){ return; }
	if (!Brick.env.user.isAdmin()){ return; }

	var wWait = Brick.widget.WindowWait;

	Brick.User.CP.Manager.register({
		name: 'sitemap',
		titleid: "sitemap.admin.cp.title",
		icon: "/modules/sitemap/js/images/cp_icon.gif",
		css: ".icon-sitemap	{ background-position: 0px 3px; }",
		initialize: function(container){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'sitemap', files: ['cp_man.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.mod.sitemap.cppage.initialize(container);
			  }
			});
		}
	});

})();