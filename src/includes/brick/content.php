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

/** @var SitemapManager $man */
$man = Abricos::GetModule('sitemap')->GetManager();
$page = $man->PageByCurrentAddress();

if (empty($page)){
    $brick->content = $v['pagenotfound'];
    return;
}

if ($man->IsAdminRole()){
    $brick->content = Brick::ReplaceVarByData($v['wrap'], array(
        "brickid" => $brick->id,
        "pageName" => $page->name,
        "pageid" => $page->id,
        "pageType" => $page->menuid > 0 && $page->name == 'index' ? 'menu' : 'page',
        "menuid" => $page->menuid,
        "content" => $page->detail->body
    ));
} else {
    $brick->content = $page->detail->body;
}


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