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

SitemapModule::$instance->GetManager();
$mList = SitemapManager::$instance->MenuList();
$mItem = $mList->FindByPath(Abricos::$adress->dir, true);

$arr = array();
$first = true;
while(!empty($mItem)){
	array_push($arr, Brick::ReplaceVarByData($v[$first ? "itemsel" : "item"], array(
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

$brick->content = Brick::ReplaceVarByData($brick->content, array(
	"result" => implode($v['del'], array_reverse($arr))
));

?>