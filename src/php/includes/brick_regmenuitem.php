<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/*
 * Регистрация элемента меню из внешних стартовых кирпичей
 */

$brick = Brick::$builder->brick;
$v = & $brick->param->var;
$p = & $brick->param->param;

$adr = Abricos::$adress;

if (empty($brick->parent) || $brick->parent->type != Brick::BRICKTYPE_CONTENT) {
    // регистрация элемента меню возможна только для стартовых кирпичей
    return;
}

if ($adr->level == 0) {
    // вызываемый кирпич является заглавной страницей
    return;
}

if (empty($p['link']) && empty($p['name'])) {
    $p['name'] = $adr->dir[$adr->level - 1];
    if (empty($p['name'])) {
        return;
    }
}

if (empty($p['title'])) {
    $p['title'] = $p['name'];
}

SitemapModule::$instance->GetManager();
$mList = SitemapManager::$instance->MenuList();
$mItem = $mList->FindByPath($adr->dir, false);

if (!empty($mItem)) {
    return;
}

$man = SitemapManager::$instance;
$man->RolesDisable();

$parentMenuId = 0;

if ($adr->level == 1) {
    // первый уровень, значит нет родителя
    $parentMenuId = 0;
} else {
    $parentName = $adr->dir[$adr->level - 2];
    if (empty($parentName)) {
        return;
    }

    $mParentItem = $mList->FindByPath($adr->dir, true);

    if (empty($mParentItem) || $mParentItem->Level() != $adr->level - 1) {
        // нет родителя или родитель уровня выше
        return;
    }
    $parentMenuId = $mParentItem->id;
}

$man->MenuSave(array(
    "pid" => $parentMenuId,
    "nm" => $p['name'],
    "tl" => $p['title'],
    "ord" => intval($p['order'])
));

$man->RolesEnable();

?>