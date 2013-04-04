<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$brick = Brick::$builder->brick;
$db = Abricos::$db;
$param = $brick->param;

$manager = Abricos::GetModule('sitemap')->GetManager();
$mm = $manager->GetMenu(true);
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