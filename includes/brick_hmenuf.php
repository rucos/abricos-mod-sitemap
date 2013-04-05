<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$brick = Brick::$builder->brick;
$v = &$brick->param->var;
$p = &$brick->param->param;

/*
$pViewLevel = intval($p['level']);
$mods = explode("/", $p['mods']);
$mm = Abricos::GetModule('sitemap')->GetManager()->GetMenu(true, $mods);

if (!function_exists("sitemap_brick_hmenuf")){
}

$from = $p['from'];
$notItems = !empty($p['not']) ? explode("&", $p['not']) : array();

$fromMenu = $mm->menu;
if (!empty($from)){
	$fromMenu = $mm->Find($from);
}
/**/

if (!function_exists("sitemap_brick_hmenuf")){
	/*
	function sitemap_brick_hmenuf(SitemapMenuItem $menu, $p, $v, $parent, $isroot = false, $notItems, $viewLevel, $isHide){
		
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
			$lst .= sitemap_brick_hmenuf($child, $p, $v, $menu, false, $notItems, $viewLevel, !empty($parent));
		}
		if (!empty($lst)){
			$lst = Brick::ReplaceVarByData($v["menu"], array(
					"id" => $menu->id,
					"lvl" => $menu->level,
					"hide" => ($isHide ? "hide" : ""),
					"rows" => $lst
			));
		}
		if ($isroot){
			return $lst;
		}
	
		$isSelect = $menu->isSelected;
		if ($p['notselp'] && $isChildSelect){
			$isSelect = false;
		}
	
		return Brick::ReplaceVarByData($v['item'], array(
				"id" => $menu->id,
				"sel" => $isSelect ? "selected" : "",
				"last" => ($menu->isLast && empty($menu->child)) ? "last" : "",
				"tl" => $menu->title,
				"link" => $menu->link,
				"lvl" => ($menu->level-1),
				"child" => $lst
		));
	}
	/**/
	
	function sitemap_brick_hmenuf_build(SMMenuItemList $mlist, Ab_CoreBrick $brick, SMMenuItem $parent, $viewLevel, $isHide){
	
	}
	
}

if (!function_exists("sitemap_brick_hmenuf_builditem")){
	
}

Abricos::GetModule("sitemap")->GetManager();
$man = SitemapManager::$instance;
$mList = $man->MenuList();

if (empty($mList)){ $brick->content = ""; return; }

$level = 0;
$id = 0;

if (!empty($p['from'])){
	$mItem = $mList->FindByPath($p['from']);
	if (empty($mItem)){
		$brick->content = ""; return;
	}
	$mList = $mItem->childs;
	$level = $mItem->level;
}



$result = "";
$childs = "";

/*
if (!empty($fromMenu)){
	$result = sitemap_brick_hmenuf($fromMenu, $p, $v, null, true, $notItems, $fromMenu->level, false);

	foreach ($fromMenu->child as $menu){
		$childs .= sitemap_brick_hmenuf($menu, $p, $v, $fromMenu, true, $notItems, 0, true);
	}
}
/**/

$lst = "";
for ($i=0; $i<$mList->Count(); $i++){
	$mi = $mList->GetByIndex($i);
	$lst .= Brick::ReplaceVarByData($v['item'], array(
		"id" => $mi->id,
		"sel" => $mi->isSelect ? "selected" : "",
		// "last" => ($menu->isLast && empty($menu->child)) ? "last" : "",
		"tl" => $mi->title,
		// "link" => $mi->link,
		"lvl" => $mi->level,
		"child" => ""
	));
}

$brick->content = Brick::ReplaceVarByData($brick->content, array(
	"result" => $lst,
	"childs" => $childs
));

?>