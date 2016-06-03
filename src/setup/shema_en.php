<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$updateManager = Ab_UpdateManager::$current;
$db = Abricos::$db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){

    $mainpage = "
		<h2>Welcome!</h2>

		<p>Congratulations! <a href='http://abricos.org' title=''>Abricos Platform</a> has been successfully installed on your site.</p>

		<p>Where to start?</p>

		<h4>For security reasons, change the password for the account <i>admin</i></h4>
		<p>By default, the system creates an administrative user <i>admin</i>.
		You need to install the new password and e-mail address on the account.
		To do this, log in using login <i>admin</i>, password <i>admin</i> and go
		to your <a href='/bos/#app=uprofile/ws/showws/'>user profile </a> to edit.</p>

		<h4>Basic configuration of the site</h4>
		<p>
		<a href='/bos/#app=user/board/showBoardPanel'>Control Panel</a> - is the
		main tool the site administrator. <br />

		To set up the site and manage the content you want at least two tabs: <br />

		<i>General Settings</i> - allows you to edit the name, a short description, e-mail administrator, site style, etc.; <br />

		<i>Website Structure</i> - you can create and edit site menu items, while managing the sections and subsections of the site..
		</p>

		<h3>Additional information</h3>
		<p>
			<a href='http://abricos.org' title=''>Official Website</a><br />
			<a href='http://abricos.org/mods/' title=''>Additional modules</a><br />
			<a href='http://abricos.org/forum/' title='Forum'>Forum</a><br />
		</p>
	";

    $about = "
		<h2>About</h2>
		<p><a href='http://abricos.org'>Abricos Platform</a> - this is a Content Management System (CMS) and Web Application Platform.</p>
	";

    $mainpageId = Ab_CoreQuery::ContentAppend($db, $mainpage, 'sitemap');
    $aboutpageId = Ab_CoreQuery::ContentAppend($db, $about, 'sitemap');

    $db->query_write("
		INSERT INTO ".$pfx."sys_menu
		(parentmenuid, menutype, name, title, descript, link, language, menuorder, level, off, dateline, deldate) VALUES
		(0, 1, '', 'Home', 'Home Page', '/', '".Abricos::$LNG."', 0, 0, 0, 0, 0)
	");
    $db->query_write("
		INSERT INTO ".$pfx."sys_menu
		(parentmenuid, menutype, name, title, descript, link, language, menuorder, level, off, dateline, deldate) VALUES
		(0, 0, 'about', 'About', '', '', '".Abricos::$LNG."', 50, 0, 0, 0, 0)
	");
    $aboutmenuId = $db->insert_id();

    $db->query_write("
		INSERT INTO ".$pfx."sys_page (menuid, contentid, pagename, title, language, metakeys, metadesc, usecomment, dateline, deldate, mods) VALUES
		(0, ".$mainpageId.", 'index', '', '".Abricos::$LNG."', '', '', 0, ".TIMENOW.", 0, ''),
		(".$aboutmenuId.", ".$aboutpageId.", 'index', '', '".Abricos::$LNG."', '', '', 0, ".TIMENOW.", 0, '')
	");
}
