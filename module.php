<?php
/**
 * Модуль "Карта сайта"
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2011 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Карта сайта.
 * 
 * Элементы сайта разделены на три типа:
 * 1) Главная страница
 * 2) Пункт меню и его страница index
 * 3) Страница не index
 * 4) Ссылка
 * 
 * @package Abricos
 * @subpackage Sitemap
 */
class SitemapModule extends Ab_Module {
	
	private $_manager = null;
	
	public $page = null;
	
	function __construct(){
		$this->version = "0.2.4";
		$this->name = "sitemap";
		$this->takelink = "__super";
		$this->permission = new SitemapPermission($this);
	}
	
	/**
	 * Получить менеджер
	 *
	 * @return SitemapManager
	 */
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once 'includes/manager.php';
			$this->_manager = new SitemapManager($this);
		}
		return $this->_manager;
	}
	
	public function GetContentName(){
		$adress = Abricos::$adress;
		if ($adress->level >= 1 && $adress->dir[0] == 'sitemap'){
			return 'sitemap';
		}
		
		$page = $this->GetManager()->GetPage($this->registry->adress);

		if (is_null($page)){
			return '';
		}
		$this->page = $page;
		
		return 'index';
	}
	
	public function GetTemplate(){
		$page = $this->page;
		if (empty($page['tpl'])){ return null; }
		$arr = explode(":", $page['tpl']);
		return array("owner" => $arr[0], "name" => $arr[1]);
	}
}

class SitemapAction {
	const VIEW = 10;
	const WRITE = 30;
	const MODERATING = 40;
	const ADMIN = 50;
}

class SitemapPermission extends CMSPermission {
	
	public function SitemapPermission(SitemapModule $module){
		Abricos::GetModule('user'); // заплатка
		$defRoles = array(
			new CMSRole(SitemapAction::VIEW,		1, User::UG_GUEST),
			
			new CMSRole(SitemapAction::VIEW,		1, User::UG_REGISTERED),
			
			new CMSRole(SitemapAction::VIEW,		1, User::UG_ADMIN),
			new CMSRole(SitemapAction::WRITE,		1, User::UG_ADMIN),
			new CMSRole(SitemapAction::MODERATING,	1, User::UG_ADMIN),
			new CMSRole(SitemapAction::ADMIN,		1, User::UG_ADMIN)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array(
			SitemapAction::VIEW => $this->CheckAction(SitemapAction::VIEW),
			SitemapAction::WRITE => $this->CheckAction(SitemapAction::WRITE),
			SitemapAction::MODERATING => $this->CheckAction(SitemapAction::MODERATING),
			SitemapAction::ADMIN => $this->CheckAction(SitemapAction::ADMIN)
		);
		return $roles;
	}
}

Abricos::ModuleRegister(new SitemapModule());

?>