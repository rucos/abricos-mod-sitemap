<?php

/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
require_once 'classes.php';

class SitemapManager extends Ab_ModuleManager {

    /**
     * @var SitemapManager
     */
    public static $instance = null;
    private $_disableRoles = false;

    public function __construct(SitemapModule $module) {
        parent::__construct($module);
        SitemapManager::$instance = $this;
    }

    public function DisableRoles() {
        $this->_disableRoles = true;
    }

    public function EnableRoles() {
        $this->_disableRoles = false;
    }

    public function IsAdminRole() {
        if ($this->_disableRoles) {
            return true;
        }
        return $this->IsRoleEnable(SitemapAction::ADMIN);
    }

    public function IsWriteRole() {
        if ($this->IsAdminRole()) {
            return true;
        }
        return $this->IsRoleEnable(SitemapAction::WRITE);
    }

    public function IsViewRole() {
        if ($this->IsWriteRole()) {
            return true;
        }
        return $this->IsRoleEnable(SitemapAction::VIEW);
    }

    public function AJAX($d) {
        switch ($d->do) {
            case 'initdata':
                return $this->InitDataToAJAX();
            case 'menulist':
                return $this->MenuListToAJAX();
            case 'menusaveorders':
                return $this->MenuSaveOrders($d->savedata);
            case 'pagelist':
                return $this->PageListToAJAX();
            case 'page':
                return $this->PageToAJAX($d->pageid);
            case 'pagesave':
                return $this->PageSaveToAJAX($d->savedata);
            case 'linksave':
                return $this->LinkSaveToAJAX($d->savedata);
            case 'menuremove':
                return $this->MenuRemove($d->menuid);
            case 'bricks':
                return $this->BrickList();
            case 'templatelist':
                return $this->TemplateListToAJAX();
        }
        return null;
    }

    public function ArrayToObject($o) {
        if (is_array($o)) {
            $ret = new stdClass();
            foreach ($o as $key => $value) {
                $ret->$key = $value;
            }
            return $ret;
        } else if (!is_object($o)) {
            return new stdClass();
        }
        return $o;
    }

    public function InitDataToAJAX() {
        if (!$this->IsAdminRole()) {
            return null;
        }
        $ret = new stdClass();

        $obj = $this->TemplateListToAJAX();
        $ret->templates = $obj->templates;

        $obj = $this->MenuListToAJAX();
        $ret->menus = $obj->menus;

        $obj = $this->PageListToAJAX();
        $ret->pages = $obj->pages;

        return $ret;
    }

    private $_cacheMenuList;

    /**
     * Древовидный список меню
     *
     * @param boolean $clearCache
     * @return SMMenuItemList
     */
    public function MenuList($clearCache = false) {
        if (!$this->IsViewRole()) {
            return false;
        }

        if ($clearCache) {
            $this->_cacheMenuList = null;
        }

        if (!empty($this->_cacheMenuList)) {
            return $this->_cacheMenuList;
        }

        $list = array();
        $rows = SitemapDBQuery::MenuList($this->db);
        while (($d = $this->db->fetch_array($rows))) {
            $mItem = new SMMenuItem($d);
            array_push($list, $mItem);
        }

        $mList = new SMMenuItemList(null);

        $count = count($list);
        for ($i = 0; $i < $count; $i++) {
            $item = $list[$i];

            if ($item->parentid == 0) {
                $mList->Add($item);
            } else {
                for ($ii = 0; $ii < $count; $ii++) {
                    $pitem = $list[$ii];

                    if ($pitem->id == $item->parentid) {
                        $pitem->childs->Add($item);
                        break;
                    }
                }
            }
        }

        // есть ли модули участвующие в построении подменю
        $count = $mList->Count();
        for ($i = 0; $i < $count; $i++) {
            $item = $mList->GetByIndex($i);
            $module = Abricos::GetModule($item->name);

            if (empty($module) || !method_exists($module, 'Sitemap_IsMenuBuild') || !$module->Sitemap_IsMenuBuild()) {
                continue;
            }
            $manager = $module->GetManager();
            if (empty($manager) || !method_exists($manager, 'Sitemap_MenuBuild')) {
                continue;
            }

            $manager->Sitemap_MenuBuild($item);
        }

        $mItem = $mList->FindByPath(Abricos::$adress->dir, true);

        if (!empty($mItem)) {
            do {
                $mItem->isSelect = true;
                $mItem = $mItem->parent;
            } while (!empty($mItem));
        }

        $this->_cacheMenuList = $mList;
        return $mList;
    }

    private $_cacheMenuListLine;

    public function MenuListToAJAX() {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $list = $this->MenuList(true, true);
        if (empty($list)) {
            return null;
        }

        $ret = new stdClass();
        $ret->menus = $list->ToAJAX();

        return $ret;
    }

    public function MenuListLineMethod(SMMenuItemList $fromList, SMMenuItemListLine $toList) {
        for ($i = 0; $i < $fromList->Count(); $i++) {
            $mItem = $fromList->GetByIndex($i);
            $toList->Add($mItem);
            $this->MenuListLineMethod($mItem->childs, $toList);
        }
        return $toList;
    }

    /**
     * Линейный список меню
     *
     * @param boolean $clearCache
     * @return SMMenuItemList
     */
    public function MenuListLine($clearCache = false) {
        if (!$this->IsViewRole()) {
            return null;
        }

        if ($clearCache) {
            $this->_cacheMenuListLine = null;
        }

        if (!empty($this->_cacheMenuListLine)) {
            return $this->_cacheMenuListLine;
        }

        $mList = $this->MenuList($clearCache);
        $mListLine = new SMMenuItemListLine();

        return $this->MenuListLineMethod($mlist, $mListLine);
    }

    public function Menu($menuid) {
        if (!$this->IsViewRole()) {
            return null;
        }

        $list = $this->MenuList();
        $item = $list->Find($menuid);

        return $item;
    }

    public function MenuToAJAX($menuid) {
        $menu = $this->Menu($menuid);

        if (empty($menu)) {
            return null;
        }

        $ret = new stdClass();
        $ret->menu = $menu->ToAJAX();
        return $ret;
    }

    public function MenuSaveOrders($sd) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        foreach ($sd as $d) {
            SitemapDBQuery::MenuOrderUpdate($this->db, $d->id, $d->o);
        }
    }

    private $_cachePageByAddress = null;

    public function PageByCurrentAddress() {
        if (!$this->IsViewRole()) {
            return null;
        }

        if (!is_null($this->_cachePageByAddress)) {
            return $this->_cachePageByAddress;
        }

        $menuid = 0;
        $mItem = $this->MenuList()->FindByPath(Abricos::$adress->dir, true);
        if (empty($mItem) && Abricos::$adress->level > 0) {
            return null;
        }
        if (!empty($mItem)) {
            if (!empty($mItem->link))
                $menuid = 0;
            else
                $menuid = $mItem->id;
        }

        $d = SitemapDBQuery::PageByName($this->db, $menuid, Abricos::$adress->contentName);
        if (empty($d)) {
            return null;
        }

        $page = new SitemapPage($d);
        $page->detail = new SitemapPageDetail($d);

        return $page;
    }

    /**
     * @return SitemapPageList
     */
    public function PageList() {
        if (!$this->IsViewRole()) {
            return null;
        }

        $list = new SitemapPageList();

        $rows = SitemapDBQuery::PageList($this->db);
        while (($d = $this->db->fetch_array($rows))) {
            $list->Add(new SitemapPage($d));
        }
        return $list;
    }

    public function PageListToAJAX() {
        $list = $this->PageList();
        if (empty($list)) {
            return null;
        }

        $ret = new stdClass();
        $ret->pages = $list->ToAJAX();
        return $ret;
    }

    /**
     * @param integer $pageid
     * @return SitemapPage
     */
    public function Page($pageid) {
        if (!$this->IsViewRole()) {
            return null;
        }

        $d = SitemapDBQuery::Page($this->db, $pageid);
        if (empty($d)) {
            return null;
        }

        $page = new SitemapPage($d);
        $page->detail = new SitemapPageDetail($d);

        return $page;
    }

    public function PageToAJAX($pageid) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $page = $this->Page($pageid);
        if (empty($page)) {
            return null;
        }

        $ret = new stdClass();
        $ret->page = $page->ToAJAX();
        return $ret;
    }

    public function PageSaveToAJAX($sd) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $pageid = $this->PageSave($sd);
        if (empty($pageid)) {
            return null;
        }

        $page = $this->Page($pageid);

        $ret = new stdClass();
        $ret->page = $page->ToAJAX();

        if ($page->menuid > 0) {
            $menu = $this->Menu($page->menuid);
            $ret->menu = $menu->ToAJAX();
        }

        return $ret;
    }

    protected function PageSaveMethod($menuid, $sd) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $sd = $this->ArrayToObject($sd);

        $pageid = intval($sd->id);

        $utmf = Abricos::TextParser(true);
        $sd->tl = $utmf->Parser($sd->tl);
        $sd->mid = intval($menuid);

        $sd->mks = $utmf->Parser($sd->mks);
        $sd->mdsc = $utmf->Parser($sd->mdsc);

        if ($pageid == 0) {
            $pageid = SitemapDBQuery::PageAppend($this->db, $sd);
        } else {

            $row = SitemapDBQuery::Page($this->db, $pageid);
            if (empty($row)) {
                return null;
            }

            $sd->cid = $row['cid'];
            SitemapDBQuery::PageUpdate($this->db, $sd);
        }

        return $pageid;
    }

    /**
     * Сохранение/создание страницы
     *
     * @param array|object $fsd
     */
    public function PageSave($fsd) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $fsd = $this->ArrayToObject($fsd);
        $fsd->page = $this->ArrayToObject($fsd->page);
        $fsd->menu = $this->ArrayToObject($fsd->menu);

        $fsd->menu->id = intval($fsd->menu->id);

        $sd = $fsd->page;
        if ($fsd->menu->id == 0 && empty($sd->nm)) {
            $sd->nm = "index";
        }

        $sd->nm = translateruen($sd->nm);
        if ($sd->nm == "index" && empty($fsd->menu->nm) && empty($fsd->menu->tl) && $fsd->menu->pid == 0 && $fsd->menu->id == 0) {
            $menuid = 0;
        } else if (!empty($sd->nm) && $sd->nm != 'index') {
            $menuid = $fsd->menu->pid;
        } else {
            $this->_menuSaveFromPageSave = true;
            $menuid = $this->MenuSave($fsd->menu);
            $this->_menuSaveFromPageSave = false;
            if (is_null($menuid)) {
                return null;
            }
        }

        return $this->PageSaveMethod($menuid, $sd);
    }

    private $_menuSaveFromPageSave = false;

    /**
     * Сохранить/создать элемент меню
     *
     * В качестве параметра $sd можно передать именованный массив или объект
     *
     * Пример создание элемента меню тип-ссылка:
     * MenuSave(array(
     *    'nm' => 'mylink',
     *  'tl' => 'Проекты и задачи',
     *  'lnk' => '/bos/#app=botask/ws/showWorkspacePanel'
     * ));
     *
     *
     * @param object|array $sd
     * @return NULL|integer
     */
    public function MenuSave($sd) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $sd = $this->ArrayToObject($sd);
        if (!empty($sd->lnk)) {
            return $this->LinkSave($sd);
        }

        $menuid = intval($sd->id);

        $utmf = Abricos::TextParser(true);
        $sd->tl = $utmf->Parser($sd->tl);
        if (empty($sd->tl)) {
            return null;
        }

        $sd->dsc = $utmf->Parser($sd->dsc);
        $sd->pid = intval($sd->pid);

        $sd->nm = trim($sd->nm);
        $sd->nm = translateruen(empty($sd->nm) ? translateruen($sd->tl) : $sd->nm);
        $sd->tp = 0;

        if (empty($sd->nm)) {
            return null;
        }

        if ($menuid == 0) {
            $menuid = SitemapDBQuery::MenuAppend($this->db, $sd);
            if (!$this->_menuSaveFromPageSave) {
                $this->PageSaveMethod($menuid, array(
                    "nm" => "index"
                ));
            }
        } else {
            SitemapDBQuery::MenuUpdate($this->db, $sd);
        }
        $this->_cacheMenuList = null;

        return $menuid;
    }

    public function MenuRemove($menuid) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $menu = $this->Menu($menuid);
        if (empty($menu)) {
            return null;
        }

        $childs = $menu->childs;

        for ($i = 0; $i < $childs->Count(); $i++) {
            $childItem = $childs->GetByIndex($i);
            $this->MenuRemove($childItem->id);
        }

        SitemapDBQuery::MenuRemove($this->db, $menuid);

        $this->_cacheMenuList = null;

        return true;
    }

    public function LinkSave($sd) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $linkid = intval($sd->id);

        $utmf = Abricos::TextParser(true);
        $sd->tl = $utmf->Parser($sd->tl);
        if (empty($sd->tl)) {
            return null;
        }

        $sd->dsc = $utmf->Parser($sd->dsc);
        $sd->pid = intval($sd->pid);

        $sd->lnk = trim($sd->lnk);
        if (empty($sd->lnk)) {
            $sd->lnk = "/";
        }
        $sd->tp = 1;

        if ($linkid == 0) {
            $linkid = SitemapDBQuery::MenuAppend($this->db, $sd);
        } else {
            SitemapDBQuery::MenuUpdate($this->db, $sd);
        }
        $this->_cacheMenuList = null;

        return $linkid;
    }

    public function LinkSaveToAJAX($sd) {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $linkid = $this->LinkSave($sd);
        if (empty($linkid)) {
            return null;
        }

        $menu = $this->Menu($linkid);

        $ret = new stdClass();
        $ret->menu = $menu->ToAJAX();

        return $ret;
    }

    public function TemplateList() {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $rows = array();
        $dir = dir(CWD."/tt");
        while (false !== ($entry = $dir->read())) {
            if ($entry == "." || $entry == ".." || empty($entry)) {
                continue;
            }
            $files = globa(CWD."/tt/".$entry."/*.html");
            foreach ($files as $file) {
                $bname = basename($file);
                array_push($rows, $entry.":".substr($bname, 0, strlen($bname) - 5));
            }
        }
        return $rows;
    }

    public function TemplateListToAJAX() {
        $list = $this->TemplateList();
        if (empty($list)) {
            return null;
        }

        $ret = new stdClass();
        $ret->templates = $list;
        return $ret;
    }

    /*     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
     * TODO: старые методы - на удаление
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    public function BrickList() {
        if (!$this->IsAdminRole()) {
            return null;
        }

        Abricos::$instance->modules->RegisterAllModule();

        $id = 1;
        $brickdb = array();

        $mods = Abricos::$instance->modules->GetModules();
        foreach ($mods as $module) {
            $files = array();
            $files1 = globa(CWD."/modules/".$module->name."/brick/*.html");

            if (!empty($files1)) {
                foreach ($files1 as $file) {
                    array_push($files, $file);
                }
            }
            foreach ($files as $file) {
                $bname = basename($file, ".html");
                $key = $module->name.".".$bname;

                array_push($brickdb, array(
                    "id" => $id++,
                    "md" => $module->name,
                    "bk" => $bname
                ));
            }
        }
        return $brickdb;
    }

    /**
     * Построение кирпича на основе полных данных структуры сайта
     *
     * @param CMSSysBrick $brick - кирпич
     */
    public function BrickBuildFullMenu(Ab_CoreBrick $brick) {
        $mm = $this->GetMenu(true);

        if (empty($mm->menu->child)) {
            $brick->content = "";
            return;
        }
        $brick->param->var['result'] = SitemapManager::BrickBuildFullMenuGenerate($mm->menu, $brick->param);
    }

    private function BrickBuildFullMenuGenerate(SitemapMenuItem $menu, $param) {
        $prefix = ($menu->isSelected && $menu->id != 0) ? "sel" : "";

        $t = Brick::ReplaceVarByData($param->var['item'.$prefix], array(
            "tl" => $menu->title, "link" => $menu->link
        ));

        $lst = "";
        foreach ($menu->child as $child) {
            $lst .= SitemapManager::BrickBuildFullMenuGenerate($child, $param);
        }
        if (!empty($lst)) {
            $lst = Brick::ReplaceVar($param->var["root"], "rows", $lst);
        }
        if ($menu->id == 0) {
            return $lst;
        }
        $t = Brick::ReplaceVar($t, "child", $lst);

        return $t;
    }

}

/**
 * Конструктор меню
 *
 * @package Abricos
 * @subpackage Sitemap
 */
class SitemapMenuList {

    /**
     * Root menu item
     *
     * @var SitemapMenuItem
     */
    public $menu = null;

    /**
     * Массив пути из меню
     *
     * @var mixed
     */
    public $menuLine = array();

    public function __construct($full = false) {
        $db = Abricos::$db;
        $data = array();
        $rows = SitemapQuery::MenuList($db);
        while (($row = $db->fetch_array($rows))) {
            $row['id'] = intval($row['id']);
            $row['pid'] = intval($row['pid']);
            $data[$row['id']] = $row;
        }
        $this->menu = new SitemapMenuItem(null, 0, -1, 0, 'root', 'root', '/', 0);
        array_push($this->menuLine, $this->menu);
        $this->Build($this->menu, $data, 0, $full);
    }

    public function Build(SitemapMenuItem $parent, $data, $level, $full) {
        $lastChildMenu = null;
        foreach ($data as $row) {
            if ($row['pid'] != $parent->id) {
                continue;
            }
            $child = new SitemapMenuItem($parent, $row['id'], $row['pid'], $row['tp'], $row['nm'], $row['tl'], $row['lnk'], $level + 1);
            $child->source = $row['source'];
            if ($child->type == SitemapQuery::MENUTYPE_LINK) {
                if (Abricos::$adress->requestURI == $child->link) {
                    $child->isSelected = true;
                }
            } else {
                if (strpos(Abricos::$adress->requestURI, $child->link) === 0) {
                    $child->isSelected = true;
                }
            }
            array_push($parent->child, $child);
            if ($child->isSelected) {
                if ($child->type != SitemapQuery::MENUTYPE_LINK) {
                    array_push($this->menuLine, $child);
                }
            }
            if ($full || $child->isSelected) {
                $this->Build($child, $data, $level + 1, $full);
            }

            $lastChildMenu = $child;
        }
        if (!is_null($lastChildMenu)) {
            $lastChildMenu->isLast = true;
        }
    }

    private function CheckMenu($menu, $dir) {
        foreach ($menu->child as $child) {
            if ($child->name == $dir) {
                return $child;
            }
        }
        return null;
    }

    public function Find($uri) {
        $dirs = explode("/", $uri);
        $current = $this->menu;
        foreach ($dirs as $dir) {
            $current = $this->CheckMenu($current, $dir);
        }
        return $current;
    }

    private function PFindSource($menu, $fieldName, $value) {
        foreach ($menu->child as $child) {
            if ($child->source[$fieldName] == $value) {
                return $child;
            }
            $findItem = $this->PFindSource($child, $fieldName, $value);
            if (!is_null($findItem)) {
                return $findItem;
            }
        }
        return null;
    }

    public function FindSource($fieldName, $value) {
        return $this->PFindSource($this->menu, $fieldName, $value);
    }

}

/**
 * Элемент меню
 *
 * @package Abricos
 * @subpackage Sitemap
 */
class SitemapMenuItem {

    public $id;
    public $pid;
    public $type;
    public $name;
    public $title;
    public $link;
    public $parent = null;
    public $child = array();
    public $level = 0;
    public $source = null;

    /**
     * Меню является последним на этом уровне в списке
     *
     * @var boolean
     */
    public $isLast = false;

    /**
     * Активный пункт меню
     *
     * @var boolean
     */
    public $isSelected = false;

    public function __construct($parent, $id, $pid, $type, $name, $title, $link, $level = 0) {
        if (is_null($parent)) {
            $link = $link;
        } else {
            $link = empty($link) ? $parent->link.$name."/" : $link;
        }

        $this->id = $id;
        $this->pid = $pid;
        $this->type = intval($type);
        $this->name = $name;
        $this->title = $title;
        $this->link = $link;
        $this->level = $level;
    }

}

class CMSSitemapMenu extends SitemapMenuList {

}

class CMSSitemapMenuItem extends SitemapMenuItem {

}

?>