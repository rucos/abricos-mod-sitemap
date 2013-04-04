<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$brick = Brick::$builder->brick;
$param = $brick->param;

$manager = Abricos::GetModule('sitemap')->GetManager();
$mm = $manager->GetMenu();

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