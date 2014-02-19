<?php

/**
 * @package Abricos
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class SitemapMenuBrickBulder {

    private static $_counter = 1;

    public $brickid;

    /**
     * @var Ab_CoreBrick
     */
    public $brick;

    /**
     * Пустой кирпич, если нет элементов меню
     * @var boolean
     */
    public $cfgClearIfEmpty = false;

    /**
     * Ограничение вложенности
     *
     * 0 - без ограничений
     * @var integer
     */
    public $cfgLimitLevel = 0;

    /**
     * Вывод меню с определенного уровня
     * @var integer
     */
    public $cfgFromLevel = 0;

    /**
     * Вывод подменю определенного меню.
     * Необходимо указывать путь меню.
     * Например: eshop/electro
     * @var string
     */
    public $cfgFromMenu = '';

    /**
     * True - блок подменю исходя из текущего адреса страницы
     * @var boolean
     */
    public $cfgIsSubMenu = false;

    public function __construct(Ab_CoreBrick $brick) {

        $this->brickid = SitemapMenuBrickBulder::$_counter++;

        $this->brick = $brick;

        $p = & $brick->param->param;

        $this->cfgClearIfEmpty = $this->ToBoolean($p['clearIfEmpty']);
        $this->cfgFromMenu = $p['fromMenu'];
        $this->cfgIsSubMenu = $this->ToBoolean($p['isSubMenu']);
    }

    public function GetTplMenu($level) {
        $v = & $this->brick->param->var;
        $nm = 'menu-level-' . $level;
        if (!empty($v[$nm])) {
            return $v[$nm];
        }
        return $v['menu'];
    }

    public function GetTplMenuItem($isNotChild, $level) {
        $v = & $this->brick->param->var;

        $nm = "item";
        $nmLevel = $nm . "-level-" . $level;
        $nmNotChild = "itemNotChild";
        $nmNotChildLevel = $nmNotChild . "-level-" . $level;

        if ($isNotChild) {
            if (!empty($v[$nmNotChildLevel])) {
                return $v[$nmNotChildLevel];
            } else if (!empty($v[$nmNotChild])) {
                return $v[$nmNotChild];
            }
        }
        if (!empty($v[$nmLevel])) {
            return $v[$nmLevel];
        }
        return $v[$nm];
    }

    private function ToBoolean($var) {
        switch (strtolower($var)) {
            case 'true':
            case 'on':
            case 'yes':
            case '1':
                return true;
        }
        return false;
    }

    public function BuildItem(SMMenuItem $item, $level) {
        if ($item->off) {
            return "";
        }

        $sMenuSub = $this->BuildMenu($item->childs, $level + 1, $item->id);

        $tplItem = $this->GetTplMenuItem(empty($sMenuSub), $level);

        return Brick::ReplaceVarByData($tplItem, array(
            "id" => $item->id,
            "sel" => $item->isSelect ? "selected" : "",
            "tl" => $item->title,
            "lnk" => $item->URI(),
            "lvl" => $level,
            "childs" => $sMenuSub
        ));
    }

    public function BuildMenu(SMMenuItemList $list, $level, $id) {
        if ($list->Count() == 0) {
            return "";
        }

        $lst = "";
        for ($i = 0; $i < $list->Count(); $i++) {
            $lst .= $this->BuildItem($list->GetByIndex($i), $level);
        }

        return Brick::ReplaceVarByData($this->GetTplMenu($level), array(
            "id" => $id,
            "lvl" => $level,
            "rows" => $lst
        ));
    }

    public function Build() {
        $list = SitemapManager::$instance->MenuList();

        if ($this->cfgIsSubMenu) {
            $adr = Abricos::$adress;
            $item = $list->FindByPath($adr->dir, false);

            if (empty($item)) {
                return "";
            }
            $list = $item->childs;
        } else if (!empty($this->cfgFromMenu)) {
            $item = $list->FindByPath($this->cfgFromMenu);
            if (empty($item)) {
                return "";
            }
            $list = $item->childs;
        }

        $sMenu = $this->BuildMenu($list, 0, 0);
        $sResult = Brick::ReplaceVarByData($this->brick->content, array(
            "result" => $sMenu,
            "brickid" => ($this->brick->name . $this->brickid)
        ));

        return $sResult;
    }
}

?>