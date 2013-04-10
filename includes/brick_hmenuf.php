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
	/*
	function sitemap_brick_hmenuf_builditem(SMMenuItem $mi, $isLast, $notChild = false, $level){
		$brick = Brick::$builder->brick;
		return Brick::ReplaceVarByData($brick->param->var['item'], array(
			"id" => $mi->id,
			"sel" => $mi->isSelect ? "selected" : "",
			"last" => $isLast ? "last" : "",
			"tl" => $mi->title,
			"link" => $mi->URI(),
			"lvl" => $level,
			"child" => $notChild ? "" : sitemap_brick_hmenuf_buildmenu($mi, $level+1),
			"nochild" => $mi->childs->Count() > 0 ? "" : "nochild"
		));
	}
	function sitemap_brick_hmenuf_buildmenu(SMMenuItem $mi, $level){
		$cnt = $mi->childs->Count();
		if ($cnt == 0){ return ""; }

		$brick = Brick::$builder->brick;
		$lst = "";
		for ($i=0; $i<$cnt; $i++){
			$lst .= sitemap_brick_hmenuf_builditem($mi->childs->GetByIndex($i), $i==$cnt-1, false, $level);
		}
		return Brick::ReplaceVarByData($brick->param->var['menu'], array(
			"id" => $mi->id,
			"lvl" => $level,
			"rows" => $lst
		));
	}
	/**/
	function sitemap_brick_hmenuf_treelist($tree, SMMenuItem $mi, $level){
		$level = $level+1;
		for ($i=0; $i<$mi->childs->Count(); $i++){
			$cmi = $mi->childs->GetByIndex($i);
			
			$item = new stdClass();
			$item->level = $level;
			$item->item = $cmi;
			array_push($tree->list, $item);

			sitemap_brick_hmenuf_treelist($tree, $cmi, $level);
		}
	}
}

$childs = array();
$lst = ""; 
$cnt = $mList->Count();
$limit = intval($p['linelimit']);
if ($limit == 0){
	$limit = $cnt;
}

$mmItem = new SMMenuItem(array(
	"id" => !empty($mList->owner) ? $mList->owner->id : 0, 
	"tl" => $v['morephrase']
));

for ($i=0; $i<$cnt; $i++){
	$mi = $mList->GetByIndex($i);
	if ($i < $limit){
		$lst .= Brick::ReplaceVarByData($v['lineitem'], array(
			"id" => $mi->id,
			"sel" => $mi->isSelect ? "selected" : "",
			"tl" => $mi->title,
			"link" => $mi->URI()
		));
	}
	if ($i == $limit-1){
		$lst .= Brick::ReplaceVarByData($v['lineitem'], array(
			"id" => $mmItem->id,
			"sel" => "",
			"tl" => $mmItem->title,
			"link" => "#"
		));
	}
	if ($i >= $limit){
		$mmItem->childs->add($mi);
	}else{
		$tree = new stdClass();
		$tree->list = array();
		$tree->item = $mi;
		
		sitemap_brick_hmenuf_treelist($tree, $mi, 1);
		array_push($childs, $tree);
	}
}

if ($mmItem->childs->Count() > 0){
	$tree = new stdClass();
	$tree->list = array();
	$tree->item = $mmItem;
	
	sitemap_brick_hmenuf_treelist($tree, $mmItem, 1);
	array_push($childs, $tree);
}

$sChilds = "";
for ($i=0; $i<count($childs); $i++){
	$tree = $childs[$i];
	
	$ccnt = count($tree->list);
	$colCnt = ceil($ccnt / 4);
	$j = 0; $lstCol = ""; $lstCols = "";
	for ($ii=0; $ii<$ccnt; $ii++){
		if ($j >= $colCnt){
			$lstCols .= Brick::ReplaceVarByData($v['col'], array(
				"rows" => $lstCol,
				"lastcol" => ""
			));
			$lstCol = "";
			$j = 0;
		}
		
		$mi = $tree->list[$ii]->item;
		$level = $tree->list[$ii]->level;
		
		$lstCol .= Brick::ReplaceVarByData($v['item'], array(
			"id" => $mi->id,
			"sel" => $mi->isSelect ? "selected" : "",
			"tl" => $mi->title,
			"link" => $mi->URI(),
			"lvl" => $level
		));
		$j++;
	}
	$lstCols .= Brick::ReplaceVarByData($v['col'], array(
		"rows" => $lstCol,
		"lastcol" => "lastcol"
	));
	
	$sChilds .= Brick::ReplaceVarByData($v['menu'], array(
		"id" => $tree->item->id,
		"rows" => $lstCols
	));
}


$brick->content = Brick::ReplaceVarByData($brick->content, array(
	"result" => $lst,
	"resultmore" => $lstMore,
	"childs" => $sChilds
));

?>