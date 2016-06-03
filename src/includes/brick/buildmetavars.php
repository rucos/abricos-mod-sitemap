<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/*
 * Генерация значений META-тегов 
 */

$brick = Brick::$builder->brick;
$v = &$brick->param->var;
$p = &$brick->param->param;

$adr = Abricos::$adress;

SitemapModule::$instance->GetManager();
$mList = SitemapManager::$instance->MenuList();
$mItem = $mList->FindByPath($adr->dir, true);

$arr = array();
while (!empty($mItem)){
    array_push($arr, $mItem->title);
    $mItem = $mItem->parent;
}

array_push($arr, SystemModule::$instance->GetPhrases()->Get('site_name'));

Brick::$builder->SetGlobalVar('meta_title', implode(" / ", $arr));
