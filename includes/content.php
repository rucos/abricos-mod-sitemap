<?php
/**
 * Выборка страницы из БД по идентификатор
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

// выборка контента из БД
$brick = Brick::$builder->brick;
$modSitemap = Abricos::GetModule('sitemap');
$page = $modSitemap->page;
// $pid = -1;
$manager = $modSitemap->GetManager();

$brick->content = "";
if (!is_null($page)){
	
	if ($manager->IsAdminRole()){
		$brick->content .= Brick::ReplaceVarByData($brick->param->var['editor'], array(
			"pagenm"=>$page['nm'],
			"pageid"=>$page['id'],
			"withmenu"=>$page['mid'] > 0 && $page['nm'] == 'index' ? 'true' : 'false',
			"menuid"=>$page['mid']
		));
	}
	
	$brick->content .= $page['bd'];
	
	if (!empty($page['mods'])){
		
		$mods = json_decode($page['mods']);
		foreach ($mods as $own => $val){
			foreach ($mods->$own as $bkname => $val2){
				Brick::$builder->LoadBrickS($own, $bkname, $brick);
			}
		}
	}
	if (!empty($page['tl'])){
		Brick::$builder->SetGlobalVar('meta_title', $page['tl']);
	}else if (!empty($page['menu']['tl'])){
		Brick::$builder->SetGlobalVar('meta_title', $page['menu']['tl']);
	}
	if (!empty($page['mtks'])){
		Brick::$builder->SetGlobalVar('meta_keys', $page['mtks']);
	}
	if (!empty($page['mtdsc'])){
		Brick::$builder->SetGlobalVar('meta_desc', $page['mtdsc']);
	}
}else{
	$brick->content = "<h1>Error 404</h1>Page not found";
}

?>