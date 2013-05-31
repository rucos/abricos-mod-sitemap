<?php
/**
 * Выборка страницы из БД по идентификатору
 * 
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

// выборка контента из БД
$brick = Brick::$builder->brick;
$brick->content = "";

Abricos::GetModule('sitemap')->GetManager();
$man = SitemapManager::$instance;
$page = $man->PageByCurrentAddress();

if (empty($page)){
	$brick->content = $brick->param->var['pagenotfound'];
	return;
}

if ($man->IsAdminRole()){
	$brick->content .= Brick::ReplaceVarByData($brick->param->var['editor'], array(
		"pagenm"	=> $page->name,
		"pageid"	=> $page->id,
		"withmenu"	=> $page->menuid > 0 && $page->name == 'index' ? 'true' : 'false',
		"menuid"	=> $page->menuid
	));
}

$brick->content .= $page->detail->body;

if (!empty($page->detail->mods)){
	$mods = json_decode($page->detail->mods);
	foreach ($mods as $own => $val){
		foreach ($mods->$own as $bkname => $val2){
			Brick::$builder->LoadBrickS($own, $bkname, $brick);
		}
	}
}
if (!empty($page->title)){
	Brick::$builder->SetGlobalVar('meta_title', $page->title);
}
if (!empty($page->detail->metaKeys)){
	Brick::$builder->SetGlobalVar('meta_keys', $page->detail->metaKeys);
}
if (!empty($page->detail->metaDesc)){
	Brick::$builder->SetGlobalVar('meta_desc', $page->detail->metaDesc);
}

?>