<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

require_once 'dbquery.php';

class SMMenuItem extends AbricosItem {

    /**
     * @var SMMenuItem
     */
    public $parent = null;

    /**
     * Заголовок
     *
     * @var string
     */
    public $title;

    public $descript;

    /**
     * Имя (часть URI)
     *
     * @var string
     */
    public $name;

    /**
     * Идентификатор родителя
     *
     * @var integer
     */
    public $parentid = 0;

    /**
     * Список дочерних элементов меню
     *
     * @var SMMenuItemList
     */
    public $childs;

    /**
     * Порядок сортировки
     *
     * @var integer
     */
    public $order;

    public $isSelect = false;

    public $link;

    /**
     * Если true - скрывать
     *
     * @var boolean
     */
    public $off;

    public function __construct($d){
        parent::__construct($d);

        $this->title = isset($d['tl']) ? strval($d['tl']) : "";
        $this->name = isset($d['nm']) ? strval($d['nm']) : "";
        $this->descript = isset($d['dsc']) ? strval($d['dsc']) : "";

        $this->parentid = isset($d['pid']) ? intval($d['pid']) : "";
        $this->link = isset($d['lnk']) ? strval($d['lnk']) : "";
        $this->order = isset($d['ord']) ? intval($d['ord']) : 0;
        $this->off = isset($d['off']) ? $d['off'] > 0 : false;

        $this->childs = new SMMenuItemList($this);
    }

    public function IsLink(){
        return !empty($this->link);
    }

    private $_calcURI = null;

    public function URI(){
        if ($this->IsLink()){
            return $this->link;
        }
        if (is_null($this->_calcURI)){
            if (!empty($this->parent)){
                $this->_calcURI = $this->parent->URI().$this->name."/";
            } else {
                $this->_calcURI = "/".$this->name."/";
            }
        }
        return $this->_calcURI;
    }

    private $_calcLevel = null;

    public function Level(){
        if (is_null($this->_calcLevel)){
            if (!empty($this->parent)){
                $this->_calcLevel = $this->parent->Level() + 1;
            } else {
                $this->_calcLevel = 1;
            }
        }
        return $this->_calcLevel;
    }

    public function ToAJAX(){
        $ret = parent::ToAJAX();
        $ret->tl = $this->title;
        $ret->pid = $this->parentid;
        $ret->dsc = $this->descript;
        $ret->nm = $this->name;
        $ret->lnk = $this->link;
        $ret->ord = $this->order;
        $ret->off = $this->off ? 1 : 0;

        if ($this->childs->Count() > 0){
            $obj = $this->childs->ToAJAX();
            $ret->childs = $obj->list;
        }

        return $ret;
    }


    private static $_gids = array();

    /**
     * Преобразовать локальный идентификатор элемента модуля в глобальный
     */
    public static function ToGlobalId($modname, $id){
        if (empty(SMMenuItem::$_gids[$modname])){
            $delta = (count(SMMenuItem::$_gids) + 1) * 100000000;
            SMMenuItem::$_gids[$modname] = $delta;
        }
        return SMMenuItem::$_gids[$modname] + $id;
    }
}

class SMMenuItemListLine extends AbricosList {
    /**
     * @return SMMenuItem
     */
    public function Get($id){
        return parent::Get($id);
    }

    /**
     * @return SMMenuItem
     */
    public function GetByIndex($i){
        return parent::GetByIndex($i);
    }
}

class SMMenuItemList extends AbricosList {

    /**
     * @var SMMenuItem
     */
    public $owner;

    public function __construct($mItem){
        parent::__construct();

        $this->owner = $mItem;
    }

    public function Add($item){
        parent::Add($item);
        if (empty($item->parent)){
            $item->parent = $this->owner;
        }
    }

    /**
     * @return SMMenuItem
     */
    public function Get($id){
        return parent::Get($id);
    }

    /**
     * @return SMMenuItem
     */
    public function GetByIndex($i){
        return parent::GetByIndex($i);
    }

    /**
     * @return SMMenuItem
     */
    public function GetByName($name){
        $name = trim($name);
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $item = $this->GetByIndex($i);
            if ($item->name == $name){
                return $item;
            }
        }
        return null;
    }

    /**
     * Поиск элемента по списку, включая поиск по дочерним элементам
     *
     * @param integer $id
     * @return SMMenuItem
     */
    public function Find($id){
        $id = intval($id);

        $item = $this->Get($id);
        if (!empty($item)){
            return $item;
        }

        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $item = $this->GetByIndex($i)->childs->Find($id);
            if (!empty($item)){
                return $item;
            }
        }

        return null;
    }

    /**
     * Поиск элемента меню по адресу
     *
     * Если $isNotEMatching=true и элемент не будет найден, то
     * метод вернет последний найденный элемент в цепочке
     *
     * Пример адреса: eshop/myfolder1/subfolder2
     *
     * @param array|string $path
     * @param boolean $isNotEMatching
     * @return SMMenuItem
     */
    public function FindByPath($path, $isNotEMatching = false){
        if (is_array($path)){
            $path = implode("/", $path);
        }
        $path = trim($path);

        //if (empty($path)){ return ""; }

        // удалить последний слеш
        if (substr($path, strlen($path) - 1, 1) == "/"){
            $path = substr($path, 0, strlen($path) - 1);
        }
        // удалить первый слеш
        if (substr($path, 0, 1) == "/"){
            $path = substr($path, 1);
        }

        $arr = explode("/", $path);

        $item = $this->GetByName($arr[0]);
        if (count($arr) > 1 && !empty($item)){
            $narr = array();
            for ($i = 1; $i < count($arr); $i++){
                array_push($narr, $arr[$i]);
            }
            $cItem = $item->childs->FindByPath(implode("/", $narr), $isNotEMatching);
            if (empty($cItem) && $isNotEMatching){
                return $item;
            }
            return $cItem;
        }
        return $item;
    }
}

class SitemapPage extends AbricosItem {
    public $menuid;
    public $name;
    public $title;

    /**
     * @var SitemapPageDetail
     */
    public $detail = null;

    public function __construct($d){
        parent::__construct($d);
        $this->menuid = intval($d['mid']);
        $this->name = strval($d['nm']);
        $this->title = strval($d['tl']);
    }

    public function ToAJAX(){
        $ret = parent::ToAJAX();
        $ret->mid = $this->menuid;
        $ret->nm = $this->name;
        $ret->tl = $this->title;

        if (!empty($this->detail)){
            $ret->dtl = $this->detail->ToAJAX();
        }
        return $ret;
    }
}

class SitemapPageDetail {
    public $metaKeys;
    public $metaDesc;
    public $template;
    public $mods;
    public $editorMode;
    public $contentid;
    public $body;

    public function __construct($d){
        $this->body = strval($d['bd']);
        $this->metaKeys = strval($d['mtks']);
        $this->metaDesc = strval($d['mtdsc']);
        $this->template = strval($d['tpl']);
        $this->mods = strval($d['mods']);
        $this->editorMode = intval($d['em']);
        $this->contentid = intval($d['cid']);
    }

    public function ToAJAX(){
        $ret = new stdClass();
        $ret->bd = $this->body;
        $ret->mtks = $this->metaKeys;
        $ret->mtdsc = $this->metaDesc;
        $ret->tpl = $this->template;
        $ret->mods = $this->mods;
        $ret->em = $this->editorMode;
        return $ret;
    }
}

class SitemapPageList extends AbricosList {
}

class SitemapConfig {

    /**
     * @var SMConfig
     */
    public static $instance;

    public function __construct($cfg){
        SitemapConfig::$instance = $this;

        if (empty($cfg)){
            $cfg = array();
        }

        /*
        if (isset($cfg['subscribeSendLimit'])){
            $this->subscribeSendLimit = intval($cfg['subscribeSendLimit']);
        }
        /**/
    }
}
