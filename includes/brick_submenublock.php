<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

if (!function_exists("sitemap_brick_submenublock_buildlist")){
	function sitemap_brick_submenublock_buildlist(Ab_CoreBrick $brick, SMMenuItemList $childs){
		$v = &$brick->param->var;
		$lst = "";

		for ($i=0; $i<$childs->Count(); $i++){
			$mItem = $childs->GetByIndex($i);
			if ($mItem->off){ continue; }
			
			$lstChilds = sitemap_brick_submenublock_buildlist($brick, $mItem->childs);
			if (!empty($lstChilds)){
				$lstChilds = Brick::ReplaceVarByData($v['table'], array (
					"rows" => $lstChilds
				));
			}
			$lst .= Brick::ReplaceVarByData($v['row'], array (
				"tl" => $mItem->title,
				"link" => $mItem->URI(),
				"childs" => $lstChilds
			));
		}

		return $lst;
	}
}

/*
 * Содержание
 */

$adr = Abricos::$adress;
$brick = Brick::$builder->brick;
$v = &$brick->param->var;
$p = &$brick->param->param;

SitemapModule::$instance->GetManager();
$mList = SitemapManager::$instance->MenuList();

$childs = $mList;

if (empty($p['fromroot'])){
	$mItem = $mList->FindByPath($adr->dir, false);
	
	if (empty($mItem)){
		$brick->content = "";
		return;
	}
	$childs = $mItem->childs;
}

$lst = sitemap_brick_submenublock_buildlist($brick, $childs);

if (empty($lst)){
	$brick->content = "";
	return;
}
$brick->content = Brick::ReplaceVarByData($brick->content, array(
	"result" => $lst
));

?>