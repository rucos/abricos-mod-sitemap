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

Abricos::GetModule("sitemap")->GetManager();
$man = SitemapManager::$instance;
$mList = $man->MenuList();

if (empty($mList)){ $brick->content = ""; return; }
if (!empty($p['from'])){
	$mItem = $mList->FindByPath($p['from']);
	if (empty($mItem)){
		$brick->content = ""; return;
	}
	$mList = $mItem->childs;
}

if (!function_exists("sitemap_brick_hmenuf_buildmenu")){
	function sitemap_brick_hmenuf_builditem(SMMenuItem $mi, $isLast, $notChild = false){
		$brick = Brick::$builder->brick;
		return Brick::ReplaceVarByData($brick->param->var['item'], array(
			"id" => $mi->id,
			"sel" => $mi->isSelect ? "selected" : "",
			"last" => $isLast ? "last" : "",
			"tl" => $mi->title,
			"link" => $mi->URI(),
			"lvl" => $mi->Level(),
			"child" => $notChild ? "" : sitemap_brick_hmenuf_buildmenu($mi),
			"nochild" => $mi->childs->Count() > 0 ? "" : "nochild"
		));
	}
	function sitemap_brick_hmenuf_buildmenu(SMMenuItem $mi){
		$cnt = $mi->childs->Count();
		if ($cnt == 0){ return ""; }

		$brick = Brick::$builder->brick;
		$lst = "";
		for ($i=0; $i<$cnt; $i++){
			$lst .= sitemap_brick_hmenuf_builditem($mi->childs->GetByIndex($i), $i==$cnt-1);
		}
		return Brick::ReplaceVarByData($brick->param->var['menu'], array(
			"id" => $mi->id,
			"lvl" => $mi->Level(),
			"rows" => $lst
		));
	}
}

$childs = "";
$lst = ""; 
$cnt = $mList->Count();

for ($i=0; $i<$cnt; $i++){
	$mi = $mList->GetByIndex($i);
	$lst .= sitemap_brick_hmenuf_builditem($mi, $i==$cnt, true);
	
	$childs .= sitemap_brick_hmenuf_buildmenu($mi);
}

$brick->content = Brick::ReplaceVarByData($brick->content, array(
	"result" => $lst,
	"childs" => $childs
));

?>