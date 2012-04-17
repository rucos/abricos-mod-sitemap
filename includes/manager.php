<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

require_once 'dbquery.php';

class SitemapManager extends Ab_ModuleManager {
	
	/**
	 * SitemapMenuList
	 *
	 * @var SitemapMenuList
	 */
	private $menu = null;
	
	/**
	 * SitemapMenuList
	 *
	 * @var SitemapMenuList
	 */
	private $menuFull = null;
	
	/**
	 * 
	 * @var SitemapModule
	 */
	public $module = null;
	
	/**
	 * @var SitemapManager
	 */
	public static $instance = null;
	
	private $_disableRoles = false;
	
	public function __construct(SitemapModule $module){
		parent::__construct($module);
		SitemapManager::$instance = $this;
	}
	
	public function DisableRoles(){
		$this->_disableRoles = true;
	}
	
	public function EnableRoles(){
		$this->_disableRoles = false;
	}
	
	public function IsAdminRole(){
		if ($this->_disableRoles){ return true; }
		return $this->IsRoleEnable(SitemapAction::ADMIN);
	}
	
	public function IsWriteRole(){
		if ($this->IsAdminRole()){ return true; }
		return $this->IsRoleEnable(SitemapAction::WRITE);
	}
	
	public function IsViewRole(){
		if ($this->IsWriteRole()){ return true; }
		return $this->IsRoleEnable(SitemapAction::VIEW);
	}
	
	private $newmenuid = 0;
	private $createmenu = false;
	
	public function DSProcess($name, $rows){
		$p = $rows->p;
		$db = $this->db;
		
		switch ($name){
			case 'pagemenu':
				foreach ($rows as $r){
					if ($r->f == 'a'){	$this->MenuAppend($r->d); }
					if ($r->f == 'u'){	$this->MenuUpdate($r->d); }
				}
				break;
			case 'menulist':
				foreach ($rows as $r){
					if ($r->f == 'd'){ $this->MenuRemove($r->d->id); }
					if ($r->f == 'u'){ $this->MenuUpdate($r->d); }
				}
				break;
			case 'page':
				foreach ($rows as $r){
					if ($r->f == 'a'){	$this->PageAppend($r->d); }
					if ($r->f == 'u'){	$this->PageUpdate($r->d); }
				}
				break;
			case 'pagelist':
				foreach ($rows as $r){
					if ($r->f == 'd'){ $this->PageRemove($r->d->id); }
				}
				break;				
			case 'link':
				foreach ($rows as $r){
					if ($r->f == 'a'){	$this->LinkAppend($r->d); }
					if ($r->f == 'u'){	$this->LinkUpdate($r->d); }
				}
				break;
		}
	}
	
	public function DSGetData($name, $tsrs){
		$p = $tsrs->p;
		switch ($name){
			case 'pagemenu': return $this->Menu($p->id);
			case 'menulist': return $this->MenuList();
			case 'pagelist': return $this->PageList();
			case 'link': return $this->Link($p->id);
			case 'page': return $this->Page($p->id);
			case 'templates': return $this->TemplateList();
			case 'bricks': return $this->BrickList();
		}
		
		return null;
	}
	
	public function AJAX($d){
		switch($d->do){
			case 'bricks': return $this->BrickList();
		}
		return null;
	}
	
	
	public function MenuAppend($d){
		if (!$this->IsAdminRole()){ return null; }
		// создание страницы в два этапа: 1-создание меню, 2-создание страницы в этом меню
		$this->newmenuid = SitemapQuery::MenuCreate($this->db, $d);
		$this->createmenu = true;
		return $this->newmenuid;
	}
	
	public function MenuUpdate($d){
		if (!$this->IsAdminRole()){ return null; }
		SitemapQuery::MenuUpdate($this->db, $d);
	}
	
	public function Menu($pageid){
		if (!$this->IsAdminRole()){ return null; }
		return SitemapQuery::MenuByPageId($this->db, $pageid);		
	}
	
	public function MenuList(){
		if (!$this->IsAdminRole()){ return null; }
		return SitemapQuery::MenuList($this->db, true);
	}
	
	public function MenuRemove($menuid){
		if (!$this->IsAdminRole()){ return null; }
		SitemapQuery::MenuRemove($this->db, $menuid);
	}
	
	public function PageAppend($d){
		if (!$this->IsAdminRole()){ return null; }
		if ($this->createmenu){
			$d->mid = $this->newmenuid;
		}
		SitemapQuery::PageCreate($this->db, $d);
	}
	public function PageUpdate($d){
		if (!$this->IsAdminRole()){ return null; }
		SitemapQuery::PageUpdate($this->db, $d);
	}
	public function PageList(){
		if (!$this->IsAdminRole()){ return null; }
		return SitemapQuery::PageList($this->db);
	}
	public function PageRemove($pageid){
		if (!$this->IsAdminRole()){ return null; }
		SitemapQuery::PageRemove($this->db, $pageid);
	}
	public function Page($pageid, $retArray = false){
		if (!$this->IsAdminRole()){ return null; }
		
		return SitemapQuery::PageById($this->db, $pageid, $retArray);
	}
	
	public function LinkAppend($d){
		if (!$this->IsAdminRole()){ return null; }
		SitemapQuery::MenuCreate($this->db, $d);
	}
	
	public function LinkUpdate($d){
		if (!$this->IsAdminRole()){ return null; }
		SitemapQuery::MenuUpdate($this->db, $d);
	}
	
	public function Link($linkid){
		if (!$this->IsAdminRole()){ return null; }
		return SitemapQuery::MenuById($this->db, $linkid);
	}
	
	public function TemplateList(){
		if (!$this->IsAdminRole()){ return null; }
		
		$rows = array();
		$dir = dir(CWD."/tt");
		while (false !== ($entry = $dir->read())) {
			if ($entry == "." || $entry == ".." || empty($entry) ){
				continue;
			}
			$files = globa(CWD."/tt/".$entry."/*.html");
			foreach ($files as $file){
				$bname = basename($file);
				$row = array();
				$row['nm'] = $entry;
				$row['vl'] = substr($bname, 0, strlen($bname)-5);
				array_push($rows, $row);
			}
		}
		return $rows;
	}
	
	public function BrickList(){
		if (!$this->IsAdminRole()){ return null; }
		
		Abricos::$instance->modules->RegisterAllModule();
	
		$id = 1;
		$brickdb = array();
	
		$mods = Abricos::$instance->modules->GetModules();
		foreach ($mods as $module){
			$files = array();
			$files1 = globa(CWD."/modules/".$module->name."/brick/*.html");
				
			if (!empty($files1)){
				foreach ($files1 as $file){
					array_push($files, $file);
				}
			}
			foreach ($files as $file){
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
	 * Получить менеджер управления меню
	 * 
	 * @param boolean $full
	 * @param array $mods список модулей участвующих в формировании меню
	 * 
	 * @return SitemapMenuList
	 */
	public function GetMenu($full = false, $mods = array()){
		$menu = null;
		if (!is_null($this->menuFull)){
			$menu = $this->menuFull;
		}
		if ($full){
			if (is_null($this->menuFull)){
				$this->menuFull = new SitemapMenuList(true);
			}
			$menu = $this->menuFull;
		}else if (is_null($menu)){
			if (is_null($this->menu)){
				$this->menu = new SitemapMenuList(false);
			}
			$menu = $this->menu;
		}
		foreach ($mods as $modname){
			$module = Abricos::GetModule($modname);
			if (!is_null($module)){
				$module->BuildMenu($menu, $full);
			}
		}
		return $menu;
	}
	
	public function GetPage(Ab_URI $adress){
		$pagename = $adress->contentName;
		$page = null;
		$db = $this->db;
		if ($adress->level == 0){
			$rows = SitemapQuery::PageByName($db, 0, $pagename);
			while (($row = $db->fetch_array($rows))){
				$page = $row;
				break;
			}
		}else {
			$rows = SitemapQuery::MenuListByUrl($db, $adress->dir);
			$arr = array();
			while (($row = $db->fetch_array($rows))){
				$arr[$row['id']] = $row;
			}
			$pid = 0;
			for ($i=0;$i<$adress->level;$i++){
				$find = false;
				$fmenu = null;
				foreach($arr as $menu){
					if ($menu['nm'] == $adress->dir[$i] && $menu['pid'] == $pid){
						$find = true;
						$fmenu = $menu;
						$pid = $menu['id'];
						break;
					}
				}
			}
			if ($pid > 0){
				$rows = SitemapQuery::PageByName($db, $pid, $pagename);
				while (($row = $db->fetch_array($rows))){
					$page = $row;
					$page['menu'] = &$fmenu; 
					break;
				}
			}
		}	
		return $page;	
	}
	
	/**
	 * Подсчет кол-ва вложенных в меню элементов
	 *
	 * @param SitemapMenuItem $menu
	 */
	public static function ChildMenuItemCount(SitemapMenuItem $menu){
		$count = 0;
		foreach ($menu->child as $child){
			$count++;
			$count += SitemapManager::ChildMenuItemCount($child);
		}
		return $count;
	}
	
	/**
	 * Построение кирпича на основе полных данных структуры сайта
	 *
	 * @param CMSSysBrick $brick - кирпич 
	 */
	public function BrickBuildFullMenu(Ab_CoreBrick $brick){
		$mm = $this->GetMenu(true);
		
		if (empty($mm->menu->child)){
			$brick->content = "";
			return;
		}
		$brick->param->var['result'] = SitemapManager::BrickBuildFullMenuGenerate($mm->menu, $brick->param);
	}
	
	private function BrickBuildFullMenuGenerate(SitemapMenuItem $menu, $param){
		$prefix = ($menu->isSelected && $menu->id != 0) ? "sel" : "";
		
		$t = Brick::ReplaceVarByData($param->var['item'.$prefix], array(
			"tl" => $menu->title, "link" => $menu->link 
		));
		
		$lst = "";
		foreach ($menu->child as $child){
			$lst .= SitemapManager::BrickBuildFullMenuGenerate($child, $param);
		}
		if (!empty($lst)){
			$lst = Brick::ReplaceVar($param->var["root"], "rows", $lst);
		}
		if ($menu->id == 0){ return $lst; }
		$t = Brick::ReplaceVar($t, "child", $lst);
	
		return $t;
	}
}

/**
 * Конструктор меню 
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
	
	public function __construct($full = false){
		$db = Abricos::$db;
		$data = array();
		$rows = SitemapQuery::MenuList($db);
		while (($row = $db->fetch_array($rows))){
			$row['id'] = intval($row['id']);
			$row['pid'] = intval($row['pid']);
			$data[$row['id']] = $row;
		}
		$this->menu = new SitemapMenuItem(null, 0, -1, 0, 'root', 'root', '/', 0);
		array_push($this->menuLine, $this->menu);
		$this->Build($this->menu, $data, 0, $full);
	}
	
	public function Build(SitemapMenuItem $parent, $data, $level, $full){
		$lastChildMenu = null;
		foreach ($data as $row){
			if ($row['pid'] != $parent->id){ continue; }
			$child = new SitemapMenuItem($parent, $row['id'], $row['pid'], $row['tp'], $row['nm'], $row['tl'], $row['lnk'], $level+1);
			$child->source = $row['source'];
			if ($child->type == SitemapQuery::MENUTYPE_LINK){
				if (Abricos::$adress->requestURI == $child->link){
					$child->isSelected = true;
				}
			}else{
				if (strpos(Abricos::$adress->requestURI, $child->link) === 0){
					$child->isSelected = true;
				}
			}
			array_push($parent->child, $child);
			if ($child->isSelected){
				if ($child->type != SitemapQuery::MENUTYPE_LINK){
					array_push($this->menuLine, $child);
				}
			}
			if ($full || $child->isSelected){
				$this->Build($child, $data, $level+1, $full);
			}
			
			$lastChildMenu = $child;
		}
		if (!is_null($lastChildMenu)){
			$lastChildMenu->isLast = true;
		}
	}
	
	private function CheckMenu($menu, $dir){
		foreach($menu->child as $child){
			if ($child->name == $dir){
				return $child;
			}
		}
		return null;
	}
	
	public function Find($uri){
		$dirs = explode("/", $uri);
		$current = $this->menu;
		foreach ($dirs as $dir){
			$current = $this->CheckMenu($current, $dir);
		}
		return $current;
	}
	
	
	private function PFindSource($menu, $fieldName, $value){
		foreach($menu->child as $child){
			if ($child->source[$fieldName] == $value){
				return $child;
			}
			$findItem = $this->PFindSource($child, $fieldName, $value);
			if (!is_null($findItem)){
				return $findItem; 
			}
		}
		return null;
		
	}
	
	public function FindSource($fieldName, $value){
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
	
	public function __construct($parent, $id, $pid, $type, $name, $title, $link, $level = 0){
		if (is_null($parent)){
			$link = $link;
		}else{
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

class CMSSitemapMenu extends SitemapMenuList {}
class CMSSitemapMenuItem extends SitemapMenuItem {}

?>