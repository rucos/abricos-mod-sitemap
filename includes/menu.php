<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;
$param = $brick->param;

$isFull = $param->param['full'] == 'true';
$pViewLevel = intval($param->param['level']);
$mods = explode("/",$param->param['mods']);
$mm = CMSRegistry::$instance->modules->GetModule('sitemap')->GetManager()->GetMenu($isFull, $mods);

if (empty($mm->menu->child)){
	$brick->content = "";
	return;
}

if (!function_exists("sitemap_pub_menublock_out")){
	function sitemap_pub_menublock_out(CMSSitemapMenuItem $menu, $param, $parent, $isroot = false, $notItems, $viewLevel = 0){
		if ($viewLevel > 0 && ($menu->level > $viewLevel+1)){ 
			return ""; 
		}
		$isnot = false;
		foreach ($notItems as $nitem){
			if ($nitem == $menu->name){
				return "";
			}
		}
		
		$lst = "";
		$isChildSelect = false;
		foreach ($menu->child as $child){
			if ($child->isSelected){
				$isChildSelect = true;
			}
			$lst .= sitemap_pub_menublock_out($child, $param, $menu, false, $notItems, $viewLevel);
		}
		if (!empty($lst)){
			$lst = Brick::ReplaceVarByData($param->var["menu"], array(
				"id" => $menu->id,
				"lvl" => $menu->level,
				"hide" => (!$isroot && !$menu->isSelected ? "hide" : ""),
				"rows" => $lst
			)); 
		}
		if ($isroot){ return $lst; }
		
		$isSelect = $menu->isSelected;
		if ($param->param['notselp'] && $isChildSelect){
			$isSelect = false;
		}
		
		return Brick::ReplaceVarByData($param->var['item'], array(
			"id" => $menu->id,
			"sel" => $isSelect ? "selected" : "",
			"last" => ($menu->isLast && empty($menu->child)) ? "last" : "",	 
			"tl" => $menu->title,
			"link" => $menu->link,
			"child" => $lst
		));
	}
}

$from = $param->param['from'];
$notItems = !empty($param->param['not']) ? explode("&", $param->param['not']) : array();
$param->var['title'] = !empty($param->param['title']) ? Brick::ReplaceVarByData($param->var['title'], array('tl'=>$param->param['title'])) : "";
if (empty($from)){
	$param->var['result'] = sitemap_pub_menublock_out($mm->menu, $param, null, true, $notItems, $pViewLevel);
}else{
	$fromMenu = $mm->Find($from);
	if (!empty($fromMenu)){
		$param->var['result'] = sitemap_pub_menublock_out($fromMenu, $param, null, true, $notItems, $pViewLevel);
	}
}


?>