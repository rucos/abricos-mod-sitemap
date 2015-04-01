<?php
/**
 * Схема таблиц данного модуля.
 *
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = Ab_UpdateManager::$current;
$db = Abricos::$db;
$pfx = $db->prefix;

$isPrevVersionCore = $updateManager->serverVersion == '1.0.1';

if ($updateManager->isInstall() || $isPrevVersionCore) {

    // меню
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."sys_menu (
		  menuid int(10) unsigned NOT NULL auto_increment,
		  parentmenuid int(10) unsigned NOT NULL default '0',
		  menutype int(1) unsigned NOT NULL default '0' COMMENT 'Тип меню: 0-раздел, 1-ссылка',
		  name varchar(250) NOT NULL DEFAULT '' COMMENT 'Имя',
		  title varchar(250) NOT NULL DEFAULT '' COMMENT 'Название',
		  descript varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  link varchar(250) NOT NULL DEFAULT '' COMMENT 'Ссылка',
		  language char(2) NOT NULL DEFAULT 'ru',
		  menuorder int(4) unsigned NOT NULL default '0' COMMENT 'Сортировка',
		  level int(2) unsigned NOT NULL default '0',
		  off tinyint(1) unsigned NOT NULL default '0',
		  dateline int(10) unsigned NOT NULL default '0',
		  deldate int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY (menuid)
		)".$charset
    );

    // Страницы
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."sys_page (
		  pageid int(10) unsigned NOT NULL auto_increment,
		  menuid int(10) unsigned NOT NULL default '0',
		  contentid int(10) unsigned NOT NULL default '0',
		  pagename varchar(250) NOT NULL DEFAULT '' COMMENT 'Имя',
		  title varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  language char(2) NOT NULL DEFAULT 'ru',
		  template VARCHAR(50) NOT NULL DEFAULT '',
		  metakeys varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  metadesc varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  mods TEXT NOT NULL,
		  usecomment tinyint(1) unsigned NOT NULL default '0',
		  dateline int(10) unsigned NOT NULL default '0',
		  deldate int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY (pageid)
		)".$charset
    );
}

if ($updateManager->isInstall() && !$isPrevVersionCore) {

    $modBosExs = file_exists(CWD."/modules/bos/module.php");

    if (Abricos::$LNG == 'ru') {

        $mainpage = "
<h2>Добро пожаловать!</h2>

<p>Поздравляем! Платформа <a href='http://ru.abricos.org' title='Система управления контентом (CMS), платформа интернет-приложений'>Абрикос</a> успешно установлена на Ваш сайт.</p>

<p>С чего начать?</p>

<h4>В целях безопасности измените пароль учетной записи <i>admin</i></h4>
<p>По умолчанию в системе создается пользователь с правами администратора <i>admin</i>. 
Необходимо установить новый пароль и e-mail адрес на эту учетную запись. 
Для этого авторизуйтесь под учетной записью <i>admin</i>, пароль <i>admin</i> и  
перейдите в ";

        if ($modBosExs) {
            $mainpage .= "<a href='/bos/#app=uprofile/ws/showws/'>профиль пользователя</a>";
        } else {
            $mainpage .= "<a href='/user/'>Панель управления</a> -&gt; раздел 'Профиль пользователя'";
        }

        $mainpage .= "
для редактирования.</p>

<h4>Базовые настройки сайта</h4>
<p>
		 ";

        if ($modBosExs) {
            $mainpage .= "<a href='/bos/#app=user/board/showBoardPanel'>Панель управления</a>";
        } else {
            $mainpage .= "<a href='/user/'>Панель управления</a>";
        }

        $mainpage .= "
 - это основной инструмент администратора сайта. <br />

Для настройки сайта и управления его содержанием Вам понадобятся как минимум две вкладки: <br />

<i>Настройка сайта</i> - позволяет редактировать название, краткое описание, e-mail администратора, 
стиль сайта и прочее; <br />

<i>Структура сайта</i> - позволяет создавать и редактировать элементы меню сайта, управляя при этом 
разделами и подразделами самого сайта.
</p>	
	
<h3>Дополнительная информация</h3>
<p>
	<a href='http://ru.abricos.org' title='Платформы Абрикос - система управления сайтом, WebOS'>Официальный сайт платформы Абрикос</a><br />
	<a href='http://ru.abricos.org/mods/' title='Интернет-магазин, Блог, Новости, Менеджер задач, Финансы (домашняя бухгалтерия) и пр.'>Дополнительные модули к платформе Абрикос</a><br />
	<a href='http://ru.abricos.org/forum/' title='Форум'>Форум по платформе Абрикос</a><br />
</p>
		";
    } else {
        $mainpage = "
<h2>Welcome!</h2>

<p>Congratulations! <a href='http://abricos.org' title=''>Abricos Platform</a> has been successfully installed on your site.</p>

<p>Where to start?</p>

<h4>For security reasons, change the password for the account <i>admin</i></h4>
<pBy default, the system creates an administrative user <i>admin</i>.
You need to install the new password and e-mail address on the account. 
To do this, log in using login <i>admin</i>, password <i>admin</i> and go to your ";
        if ($modBosExs) {
            $mainpage .= "<a href='/bos/#app=uprofile/ws/showws/'>user profile </a>";
        } else {
            $mainpage .= "<a href='/user/'>Control Panel</a> -&gt; section 'User Profile'";
        }

        $mainpage .= "
 to edit.</p>

<h4>Basic configuration of the site</h4>
<p>
		";

        if ($modBosExs) {
            $mainpage .= "<a href='/bos/#app=user/board/showBoardPanel'>Control Panel</a>";
        } else {
            $mainpage .= "<a href='/user/'>Control Panel</a>";
        }

        $mainpage .= "
- is the main tool the site administrator. <br />

To set up the site and manage the content you want at least two tabs: <br />

<i>General Settings</i> - allows you to edit the name, a short description, e-mail administrator, site style, etc.; <br />

<i>Website Structure</i> - you can create and edit site menu items, while managing the sections and subsections of the site..
</p>

<h3>Additional information</h3>
<p>
<a href='http://abricos.org' title=''>Official Website</a><br />
<a href='http://abricos.org/mods/' title=''>Additional modules</a><br />
<a href='http://abricos.org/forum/' title='Forum'>Forum</a><br />
</p>
		";

    }

    $db->query_write("
		INSERT INTO ".$pfx."content (body, dateline, deldate, modman) VALUES
		('".bkstr($mainpage)."', ".TIMENOW.", 0, 'sitemap')
	");
    $mainpageId = $db->insert_id();

    if (Abricos::$LNG == 'ru') {
        $about = "<h2>О проекте</h2><p><a href='http://ru.abricos.org'>Абрикос</a> - это современная система управления web-контентом (CMS) и платформа интернет приложений.</p>";

    } else {
        $about = "<h2>About</h2><p><a href='http://abricos.org'>Abricos Platform</a> - this is a Content Management System (CMS) and Web Application Platform.</p>";
    }
    $db->query_write("
		INSERT INTO ".$pfx."content (body, dateline, deldate, modman) VALUES
		('".bkstr($about)."', ".TIMENOW.", 0, 'sitemap')
	");
    $aboutpageId = $db->insert_id();


    if (Abricos::$LNG == 'ru') {
        $db->query_write("
			INSERT INTO ".$pfx."sys_menu 
			(parentmenuid, menutype, name, title, descript, link, language, menuorder, level, off, dateline, deldate) VALUES
			(0, 1, '', 'Главная', 'Главная страница сайта Abricos', '/', '".Abricos::$LNG."', 0, 0, 0, 0, 0)
		");
        $db->query_write("
			INSERT INTO ".$pfx."sys_menu 
			(parentmenuid, menutype, name, title, descript, link, language, menuorder, level, off, dateline, deldate) VALUES
			(0, 0, 'about', 'О проекте', '', '', '".Abricos::$LNG."', 50, 0, 0, 0, 0)
		");
        $aboutmenuId = $db->insert_id();
    } else {
        $db->query_write("
			INSERT INTO ".$pfx."sys_menu
			(parentmenuid, menutype, name, title, descript, link, language, menuorder, level, off, dateline, deldate) VALUES
			(0, 1, '', 'Home', 'Home Page', '/', '".Abricos::$LNG."', 0, 0, 0, 0, 0)
		");
        $db->query_write("
			INSERT INTO ".$pfx."sys_menu 
			(parentmenuid, menutype, name, title, descript, link, language, menuorder, level, off, dateline, deldate) VALUES
			(0, 0, 'about', 'About', '', '', '".Abricos::$LNG."', 50, 0, 0, 0, 0)
		");
        $aboutmenuId = $db->insert_id();
    }


    $db->query_write("
		INSERT INTO ".$pfx."sys_page (menuid, contentid, pagename, title, language, metakeys, metadesc, usecomment, dateline, deldate, mods) VALUES
		(0, ".$mainpageId.", 'index', '', '".Abricos::$LNG."', '', '', 0, ".TIMENOW.", 0, ''),
		(".$aboutmenuId.", ".$aboutpageId.", 'index', '', '".Abricos::$LNG."', '', '', 0, ".TIMENOW.", 0, '')
	");
}

if ($isPrevVersionCore) {
    $updateManager->serverVersion = '0.2.1';

    $db->query_write("
		INSERT INTO ".$pfx."sys_menu 
			(menuid, parentmenuid, name, link, title, menuorder, dateline) 
		SELECT 
			menuid, parentmenuid, name, link, phrase, menuorder, dateline
		FROM ".$pfx."menu
		WHERE deldate=0
	");
    $db->query_write("DROP TABLE ".$pfx."menu");

    $db->query_write("
		INSERT INTO ".$pfx."sys_page 
			(pageid, menuid, contentid, pagename, title, metakeys, metadesc, dateline)
		SELECT 
			pageid, menuid, contentid, pagename, title, metakeys, metadesc, dateline
		FROM ".$pfx."page
		WHERE deldate=0
	");
    $db->query_write("DROP TABLE ".$pfx."page");
}

if ($updateManager->isUpdate('0.2.1') || $updateManager->serverVersion == '1.0.1') {
    $db->query_write("
		UPDATE ".$pfx."module
		SET takelink='__super'
		WHERE name='sitemap' 
	");
}

if ($updateManager->isUpdate('0.2.2')) {
    Abricos::GetModule('sitemap')->permission->Install();
}

if ($updateManager->isUpdate('0.2.3.1')) {
    $db->query_write("
		ALTER TABLE ".$pfx."sys_page ADD editormode TINYINT(1) UNSIGNED NOT NULL default '0' COMMENT '0-визуальный редактор, 1-исходный код'
	");
}

?>