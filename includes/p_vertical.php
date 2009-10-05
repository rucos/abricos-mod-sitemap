<?php
/**
* @version $Id: pub_menublock.php 3 2009-06-10 10:26:44Z roosit $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

$brick = Brick::$builder->brick;
$db = Brick::$db;
$param = $brick->param;

$modSitemap = Brick::$modules->GetModule('sitemap');
$mm = $modSitemap->GetMenu(true);
$hmenu = null;
foreach ($mm->menu->child as $child){
	if ($child->isSelected){
		$hmenu = $child;
		break;
	}
}
if (is_null($hmenu)){	return; }

$param->var['title'] = $hmenu->title;
if (empty($hmenu->child)){
	$param->var['result'] = $param->var['altmenu'];
	return;
}

$lst = "";
foreach ($hmenu->child as $child){
	$sel = $child->isSelected ? "sel" : "";
	$lstchild = "";
	if (!empty($child->child)){
		foreach ($child->child as $cchild){
			$csel = $cchild->isSelected ? "sel" : "";
			$lstchild .= Brick::ReplaceVarByData($param->var['itemsub'.$csel], array(
				"link" => $cchild->link,
				"tl" => $cchild->title,
			)); 
		}
	}
	$lst .= Brick::ReplaceVarByData($param->var['item'.$sel], array(
		"link" => $child->link,
		"tl" => $child->title,
		"child" => !empty($lstchild) ? Brick::ReplaceVar($param->var['menu'], "rows", $lstchild) : "" 
	));
}
if (!empty($lst)){
	$param->var['result'] = Brick::ReplaceVar($param->var['root'], "rows", $lst);
}
?>