<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$brick = Brick::$builder->brick;
$v = &$brick->param->var;
$p = &$brick->param->param;

if (Abricos::$adress->level === 0){
    $brick->content = "";
    return;
}

SitemapModule::$instance->GetManager();
$mList = SitemapManager::$instance->MenuList();
$mItem = $mList->FindByPath(Abricos::$adress->dir, true);

$mItemCheck = $mItem;

$lineCount = 0;
while (!empty($mItemCheck)){
    $lineCount++;
    $mItemCheck = $mItemCheck->parent;
}

$arr = array();
$first = true;
while (!empty($mItem)){

    $tplItem = "item";
    if ($first && Abricos::$adress->level === $lineCount){
        $tplItem = "itemsel";
    }


    array_push($arr, Brick::ReplaceVarByData($v[$tplItem], array(
        "tl" => $mItem->title,
        "link" => $mItem->URI()
    )));
    $first = false;
    $mItem = $mItem->parent;
}

array_push($arr, Brick::ReplaceVarByData(Abricos::$adress->level == 0 ? $v['itemsel'] : $v['item'], array(
    "tl" => $p['home'],
    "link" => "/"
)));

$brick->content = Brick::ReplaceVarByData($brick->content, array("result" => implode($v['del'], array_reverse($arr))));

?>