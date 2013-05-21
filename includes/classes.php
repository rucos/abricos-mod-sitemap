<?php 
/**
 * @package Abricos
 * @subpackage SM
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
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
	 * @var string
	 */
	public $title;
	
	/**
	 * Имя (часть URI)
	 * @var string
	 */
	public $name;
	
	/**
	 * @var integer
	 */
	public $parentid = 0;

	/**
	 * @var SMMenuItemList
	 */
	public $childs;
	
	public $isSelect = false;
	
	public function __construct($d){
		parent::__construct($d);

		$this->title = strval($d['tl']);
		$this->name = strval($d['nm']);
		$this->parentid = intval($d['pid']);
		
		$this->childs = new SMMenuItemList($this);
	}
	
	private $_calcURI = null;
	public function URI(){
		if (is_null($this->_calcURI)){
			if (!empty($this->parent)){
				$this->_calcURI = $this->parent->URI().$this->name."/";
			}else{
				$this->_calcURI = "/".$this->name."/";
			}
		}
		return $this->_calcURI;
	}

	private $_calcLevel = null;
	public function Level(){
		if (is_null($this->_calcLevel)){
			if (!empty($this->parent)){
				$this->_calcLevel = $this->parent->Level()+1;
			}else{
				$this->_calcLevel = 1;
			}
		}
		return $this->_calcLevel;
	}
	
	public function ToAJAX(){
		$ret = parent::ToAJAX();
		$ret->tl = $this->title;
		$ret->nm = $this->name;
		
		if ($this->childs->Count()>0){
			$ret->childs = $this->childs->ToAJAX();
		}
		
		return $ret;
	}
	
	
	private static $_gids = array();
	
	/**
	 * Преобразовать локальный идентификатор элемента модуля в глобальный
	 */
	public static function ToGlobalId($modname, $id){
		if (empty(SMMenuItem::$_gids[$modname])){
			$delta = (count(SMMenuItem::$_gids)+1)*100000000;
			SMMenuItem::$_gids[$modname] = $delta;
		}
		return SMMenuItem::$_gids[$modname]+$id;
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
	
	public function Add(SMMenuItem $item){
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
	public function GetByIndex($index){
		return parent::GetByIndex($index);
	}
	
	/**
	 * @return SMMenuItem
	 */
	public function GetByName($name){
		$name = trim($name);
		$count = $this->Count();
		for ($i=0;$i<$count;$i++){
			$item = $this->GetByIndex($i);
			if ($item->name == $name){
				return $item;
			}
		}
		return null;
	}
	
	/**
	 * Поиск элемента по списку, включая поиск по дочерним элементам
	 * @param integer $id
	 * @return SMMenuItem
	 */
	public function Find($id){
		$id=intval($id);
		
		$item = $this->Get($id);
		if (!empty($item)){ return $item; }
	
		$count = $this->Count();
		for ($i=0;$i<$count;$i++){
			$item = $this->GetByIndex($i)->childs->Find($id);
			if (!empty($item)){ return $item; }
		}
	
		return null;
	}
	
	/**
	 * Поиск элемента по адресу
	 * 
	 * Пример адреса: eshop/myfolder1/subfolder2
	 * 
	 * @return SMMenuItem
	 */
	public function FindByPath($path, $isNotEMathing = false){
		if (is_array($path)){
			$path = implode("/", $path);
		}
		$path = trim($path);

		if (empty($path)){ return ""; }
		
		if (substr($path, strlen($path)-1, 1) == "/"){
			$path = substr($path, 0, strlen($path)-1);
		}
		if (substr($path, 0, 1) == "/"){
			$path = substr($path, 1);
		}
		
		$arr = explode("/", $path);

		$item = $this->GetByName($arr[0]);
		if (count($arr) > 1 && !empty($item)){
			$narr = array();
			for ($i=1;$i<count($arr);$i++){
				array_push($narr, $arr[$i]);
			}
			$cItem = $item->childs->FindByPath(implode("/", $narr), $isNotEMathing);
			if (empty($cItem) && $isNotEMathing){
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
	public $metaKeys;
	public $metaDesc;
	public $template;
	public $mods;
	public $editorMode;
	public $contentid;
	public $body;
	
	public function __construct($d){
		parent::__construct($d);
		$this->menuid	= intval($d['mid']);
		$this->name		= strval($d['nm']);
		$this->title	= strval($d['tl']);
		$this->body		= strval($d['bd']);
		$this->metaKeys	= strval($d['mtks']);
		$this->metaDesc	= strval($d['mtdsc']);
		$this->template	= strval($d['tpl']);
		$this->mods		= strval($d['mods']);
		$this->editorMode = intval($d['em']);
		$this->contentid= intval($d['cid']);
	}
	
	public function ToAJAX(){
		$ret = parent::ToAJAX();
		$ret->mid = $this->menuid;
		$ret->nm = $this->name;
		$ret->tl = $this->title;
		$ret->bd = $this->body;
		$ret->mtks = $this->metaKeys;
		$ret->mtdsc = $this->metaDesc;
		$ret->tpl = $this->template;
		$ret->mods = $this->mods;
		$ret->em = $this->editorMode;
		$ret->cid = $this->contentid;
		return $ret;
	}
}

class SitemapPageList extends AbricosList { }	


class SitemapConfig {
	
	/**
	 * @var SMConfig
	 */
	public static $instance;
	
	public function __construct($cfg){
		SitemapConfig::$instance = $this;
		
		if (empty($cfg)){ $cfg = array(); }
		
		/*
		if (isset($cfg['subscribeSendLimit'])){
			$this->subscribeSendLimit = intval($cfg['subscribeSendLimit']);
		}
		/**/
	}
}




?>