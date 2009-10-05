<?php
/**
* @version $Id: pub_breadcrumb.php 3 2009-06-10 10:26:44Z roosit $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

$brick = Brick::$builder->brick;
$param = $brick->param;

$modSitemap = Brick::$modules->GetModule('sitemap');
$mm = $modSitemap->GetMenu();

$arr = array();
$curlevel = count($mm->menuLine)-1;

foreach ($mm->menuLine as $menu){
	if ($curlevel == $menu->level || $curlevel == 0){
		$t = $param->var['itemsel'];
	}else{
		$t = $param->var['item'];
	}
	$t = Brick::ReplaceVar($t, "tl", ($menu->id == 0 ? $param->var['home'] : $menu->title));
	$t = Brick::ReplaceVar($t, "link", $menu->link);
	
	array_push($arr, $t);
}
$param->var['result'] = implode($param->var['del'], $arr);

?>