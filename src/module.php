<?php
/**
 * Модуль "Карта сайта"
 *
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
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

    /**
     * @var SitemapModule
     */
    public static $instance = null;

    private $_manager = null;

    /**
     * @var SitemapPage
     */
    public $page = null;

    function __construct() {
        $this->version = "0.2.6-dev";
        $this->name = "sitemap";
        $this->takelink = "__super";
        $this->permission = new SitemapPermission($this);

        SitemapModule::$instance = $this;
    }

    /**
     * Получить менеджер
     *
     * @return SitemapManager
     */
    public function GetManager() {
        if (is_null($this->_manager)) {
            require_once 'includes/manager.php';
            $this->_manager = new SitemapManager($this);
        }
        return $this->_manager;
    }

    public function GetContentName() {
        $adress = Abricos::$adress;
        if ($adress->level >= 1 && $adress->dir[0] == 'sitemap') {
            return 'sitemap';
        }

        $page = $this->GetManager()->PageByCurrentAddress();

        if (is_null($page)) {
            return '';
        }

        $this->page = $page;

        return 'index';
    }

    public function GetTemplate() {
        $page = $this->page;
        if (empty($page->detail->template)) {
            return null;
        }
        $arr = explode(":", $page->detail->template);
        return array("owner" => $arr[0], "name" => $arr[1]);
    }

    public function Bos_IsMenu(){
        return true;
    }
}

class SitemapAction {
    const VIEW = 10;
    const WRITE = 30;
    const MODERATING = 40;
    const ADMIN = 50;
}

class SitemapPermission extends Ab_UserPermission {

    public function __construct(SitemapModule $module) {
        Abricos::GetModule('user'); // заплатка
        $defRoles = array(
            new Ab_UserRole(SitemapAction::VIEW, Ab_UserGroup::GUEST),
            new Ab_UserRole(SitemapAction::VIEW, Ab_UserGroup::REGISTERED),
            new Ab_UserRole(SitemapAction::VIEW, Ab_UserGroup::ADMIN),

            new Ab_UserRole(SitemapAction::WRITE, Ab_UserGroup::ADMIN),
            new Ab_UserRole(SitemapAction::MODERATING, Ab_UserGroup::ADMIN),
            new Ab_UserRole(SitemapAction::ADMIN, Ab_UserGroup::ADMIN)
        );

        parent::__construct($module, $defRoles);
    }

    public function GetRoles() {
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