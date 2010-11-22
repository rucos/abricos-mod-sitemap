<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Develop
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class SitemapManager {
	
	/**
	 * CMSSitemapMenu
	 *
	 * @var CMSSitemapMenu
	 */
	private $menu = null;
	
	/**
	 * CMSSitemapMenu
	 *
	 * @var CMSSitemapMenu
	 */
	private $menuFull = null;
	
	/**
	 * 
	 * @var SitemapModule
	 */
	public $module = null;
	
	/**
	 * Ядро
	 * 
	 * @var CMSRegistry
	 */
	public $registry = null;
	/**
	 * 
	 * @var CMSDatabase
	 */
	public $db = null;
	
	public $user = null;
	public $userid = 0;
	
	public function SitemapManager(SitemapModule $module){
		
		$core = $module->registry;
		
		$this->module = $module;
		$this->registry = $core;
		$this->db = $core->db;
		
		$this->user = $core->user->info;
		$this->userid = $this->user['userid'];
	}
	
	/**
	 * Получить менеджер управления меню
	 * 
	 * @param boolean $full
	 * @param array $mods список модулей участвующих в формировании меню
	 * 
	 * @return CMSSitemapMenu
	 */
	public function GetMenu($full = false, $mods = array()){
		$menu = null;
		if (!is_null($this->menuFull)){
			$menu = $this->menuFull;
		}
		if ($full){
			if (is_null($this->menuFull)){
				$this->menuFull = new CMSSitemapMenu($this->registry, true);
			}
			$menu = $this->menuFull;
		}else if (is_null($menu)){
			if (is_null($this->menu)){
				$this->menu = new CMSSitemapMenu($this->registry, false);
			}
			$menu = $this->menu;
		}
		foreach ($mods as $modname){
			$module = $this->registry->modules->GetModule($modname);
			if (!is_null($module)){
				$module->BuildMenu($menu, $full);
			}
		}
		return $menu;
	}
	
	public function GetPage(CMSAdress $adress){
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
	 * @param CMSSitemapMenuItem $menu
	 */
	public static function ChildMenuItemCount(CMSSitemapMenuItem $menu){
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
	public function BrickBuildFullMenu(CMSSysBrick $brick){
		$mm = $this->GetMenu(true);
		
		if (empty($mm->menu->child)){
			$brick->content = "";
			return;
		}
		$brick->param->var['result'] = SitemapManager::BrickBuildFullMenuGenerate($mm->menu, $brick->param);
	}
	
	private function BrickBuildFullMenuGenerate(CMSSitemapMenuItem $menu, $param){
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

	public function IsAdminRole(){
		return $this->module->permission->CheckAction(SitemapAction::ADMIN) > 0;
	}
	
	public function IsViewRole(){
		return $this->module->permission->CheckAction(SitemapAction::VIEW) > 0;
	}
	
	public function IsWriteRole(){
		return $this->module->permission->CheckAction(SitemapAction::WRITE) > 0;
	}
	
	public function DSProcess($name, $rows){
	}
	
	public function DSGetData($name, $rows){
	}
	
}

/**
 * Статичные функции запросов к базе данных
 * 
 * @package Abricos 
 * @subpackage Sitemap
 */
class SitemapQuery {

	/**
	 * Тип меню страница/раздел
	 *
	 */
	const MENUTYPE_PAGE = 0;
	/**
	 * Тип меню ссылка
	 *
	 */
	const MENUTYPE_LINK = 1;
	
	
	const FIELDS_MENU = "
		menuid as id,
		parentmenuid as pid,
		menutype as tp,
		name as nm,
		title as tl,
		descript as dsc,
		link as lnk,
		menuorder as ord,
		level as lvl,
		off
	";
	
	public static function PageCreate(CMSDatabase $db, $d){
		$contentid = CoreQuery::CreateContent($db, $d->bd, 'sitemap');
		$sql = "
			INSERT INTO ".$db->prefix."sys_page
			(pagename, menuid, contentid, language, title, metakeys, metadesc, template, mods, dateline) VALUES (
				'".bkstr($d->nm)."',
				".bkint($d->mid).",
				'".bkstr($contentid)."',
				'".LNG."',
				'".bkstr($d->tl)."',
				'".bkstr($d->mks)."',
				'".bkstr($d->mdsc)."',
				'".bkstr($d->tpl)."',
				'".bkstr($d->mods)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	

	public static function PageUpdate(CMSDatabase $db, $d){
		CoreQuery::ContentUpdate($db, $d->cid, $d->bd);
		$sql = "
			UPDATE ".$db->prefix."sys_page
			SET
				pagename='".bkstr($d->nm)."',
				title='".bkstr($d->tl)."',
				metakeys='".bkstr($d->mtks)."',
				metadesc='".bkstr($d->mtdsc)."',
				mods='".bkstr($d->mods)."',
				template='".bkstr($d->tpl)."',
				dateline='".TIMENOW."'
			WHERE pageid='".bkint($d->id)."'
		";
		$db->query_write($sql);
	}
	
	public static function MenuByPageId(CMSDatabase $db, $pageid){
		$sql = "
			SELECT
				b.menuid as id,
				b.parentmenuid as pid,
				b.menutype as tp,
				b.name as nm,
				b.title as tl,
				b.descript as dsc,
				b.link as lnk,
				b.menuorder as ord,
				b.level as lvl,
				b.off
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."sys_menu b ON b.menuid=a.menuid
			WHERE a.pageid=".bkint($pageid)."
		";
		return $db->query_read($sql);
	}
	
	const FIELDS_PAGE = "
		a.pageid as id,
		a.menuid as mid,
		a.pagename as nm,
		a.title as tl,
		a.metakeys as mtks,
		a.metadesc as mtdsc,
		a.template as tpl,
		a.mods as mods,
		a.contentid as cid,
		c.body as bd
	";
	
	public static function PageByName(CMSDatabase $db, $menuid, $pagename, $returnTypeRow = false){
		$sql = "
			SELECT
				".SitemapQuery::FIELDS_PAGE." 
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.menuid=".bkint($menuid)." AND a.pagename='".bkstr($pagename)."'
			LIMIT 1
		";
		if ($returnTypeRow){
			return $db->query_first($sql);
		}else{
			return $db->query_read($sql);
		}
	}
	
	public static function PageById(CMSDatabase $db, $pageid){
		$sql = "
			SELECT
				".SitemapQuery::FIELDS_PAGE." 
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.pageid=".bkint($pageid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function PageList(CMSDatabase $db){
		$rootPage = SitemapQuery::PageByName($db, 0, 'index', true);
		if (empty($rootPage)){
			$d = new stdClass(); $d->nm = 'index'; $d->mid = 0; $d->tl = ''; $d->mks = ''; $d->mdsc = '';
			SitemapQuery::PageCreate($db, $d);
		}
		$sql = "
			SELECT 
				pageid as id,
				menuid as mid,
				contentid as cid,
				pagename as nm
			FROM ".$db->prefix."sys_page
			WHERE deldate=0
		";
		return $db->query_read($sql);
	}
	
	public static function MenuCreate(CMSDatabase $db, $d){
		$sql = "
			INSERT INTO ".$db->prefix."sys_menu 
			(parentmenuid, name, link, title, descript, menutype, off) VALUES (
				".bkint($d->pid).", 
				'".bkstr($d->nm)."', 
				'".bkstr($d->lnk)."', 
				'".bkstr($d->tl)."',
				'".bkstr($d->dsc)."', 
				".bkint($d->tp).",
				".bkint($d->off)."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function MenuUpdate(CMSDatabase $db, $d){
		$sql = "
			UPDATE ".$db->prefix."sys_menu 
			SET
				parentmenuid=".bkint($d->pid).", 
				name='".bkstr($d->nm)."', 
				link='".bkstr($d->lnk)."', 
				title='".bkstr($d->tl)."',
				descript='".bkstr($d->dsc)."',
				menuorder=".bkint($d->ord).",
				off=".bkint($d->off)."
			WHERE menuid='".bkint($d->id)."'
		";
		$db->query_write($sql);
	}
	
	public static function MenuById(CMSDatabase $db, $menuid){
		$sql = "
			SELECT
				".SitemapQuery::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE menuid=".bkint($menuid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	
	public static function MenuListByUrl(CMSDatabase $db, $dir){
		$names = array();
		foreach ($dir as $name){
			array_push($names, "name='".bkstr($name)."'");
		}
		$sql = "
			SELECT
				".SitemapQuery::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE deldate=0 AND (".implode(" OR ", $names).")
			ORDER BY parentmenuid
		";
		return $db->query_read($sql);
	}
	
	public static function MenuList(CMSDatabase $db, $withOff = false){
		$sql = "
			SELECT
				".SitemapQuery::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE deldate=0 ".($withOff ? "" : " AND off=0")."
			ORDER BY menuorder
		";
		return $db->query_read($sql);
	}
	
	public static function PageRemove(CMSDatabase $db, $pageid){
		$sql = "
			SELECT pageid, contentid
			FROM ".$db->prefix."sys_page
			WHERE pageid='".bkint($pageid)."'
		";
		$row = $db->query_first($sql);
		$db->query_write("
			UPDATE ".$db->prefix."content
			SET deldate='".TIMENOW."'
			WHERE contentid='".bkint($row['contentid'])."'
		");
		$db->query_write("
			UPDATE ".$db->prefix."sys_page
			SET deldate='".TIMENOW."'
			WHERE pageid='".bkint($pageid)."'
		");
	}
	
	public static function MenuRemove(CMSDatabase $db, $menuid){
		// remove pages
		$sql = "
			SELECT pageid
			FROM ".$db->prefix."sys_page
			WHERE menuid=".bkint($menuid)."
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			SitemapQuery::PageRemove($db, $row['pageid']);
		}
		
		// child list
		$sql = "
			SELECT menuid
			FROM ".$db->prefix."sys_menu
			WHERE parentmenuid=".bkint($menuid)."
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			SitemapQuery::MenuRemove($db, $row['menuid']);
		}
		$db->query_write("
			UPDATE ".$db->prefix."sys_menu
			SET deldate='".TIMENOW."'
			WHERE menuid=".bkint($menuid)."
		");
	}
}


/**
 * Конструктор меню 
 * @package Abricos
 * @subpackage Sitemap
 */
class CMSSitemapMenu {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Root menu item
	 *
	 * @var CMSSitemapMenuItem
	 */
	public $menu = null;
	
	/**
	 * Массив пути из меню
	 *
	 * @var mixed
	 */
	public $menuLine = array();
	
	public function __construct(CMSRegistry $registry, $full = false){
		$this->registry = $registry;
		$db = $registry->db;
		$data = array();
		$rows = SitemapQuery::MenuList($db);
		while (($row = $db->fetch_array($rows))){
			$row['id'] = intval($row['id']);
			$row['pid'] = intval($row['pid']);
			$data[$row['id']] = $row;
		}
		$this->menu = new CMSSitemapMenuItem(null, 0, -1, 0, 'root', 'root', '/', 0);
		array_push($this->menuLine, $this->menu);
		$this->Build($this->menu, $data, 0, $full);
	}
	
	public function Build(CMSSitemapMenuItem $parent, $data, $level, $full){
		$lastChildMenu = null;
		foreach ($data as $row){
			if ($row['pid'] != $parent->id){ continue; }
			$child = new CMSSitemapMenuItem($parent, $row['id'], $row['pid'], $row['tp'], $row['nm'], $row['tl'], $row['lnk'], $level+1);
			$child->source = $row['source'];
			if ($child->type == SitemapQuery::MENUTYPE_LINK){
				if ($this->registry->adress->requestURI == $child->link){
					$child->isSelected = true;
				}
			}else{
				if (strpos($this->registry->adress->requestURI, $child->link) === 0){
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
 * @package Abricos 
 * @subpackage Sitemap
 */
class CMSSitemapMenuItem {
	
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

?>