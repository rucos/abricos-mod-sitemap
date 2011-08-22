<?php
/**
 * Схема таблиц данного модуля.
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sys
 * @copyright Copyright (C) 2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

$isPrevVersionCore = $updateManager->serverVersion == '1.0.1';

if ($updateManager->isInstall() || $isPrevVersionCore){
	
	// меню
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."sys_menu` (
		  `menuid` int(10) unsigned NOT NULL auto_increment,
		  `parentmenuid` int(10) unsigned NOT NULL default '0',
		  `menutype` int(1) unsigned NOT NULL default '0' COMMENT 'Тип меню: 0-раздел, 1-ссылка',
		  `name` varchar(250) NOT NULL DEFAULT '' COMMENT 'Имя',
		  `title` varchar(250) NOT NULL DEFAULT '' COMMENT 'Название',
		  `descript` varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  `link` varchar(250) NOT NULL DEFAULT '' COMMENT 'Ссылка',
		  `language` char(2) NOT NULL DEFAULT 'ru',
		  `menuorder` int(4) unsigned NOT NULL default '0',
		  `level` int(2) unsigned NOT NULL default '0',
		  `off` tinyint(1) unsigned NOT NULL default '0',
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY (`menuid`)
		)".$charset
	);

	// Страницы
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."sys_page` (
		  `pageid` int(10) unsigned NOT NULL auto_increment,
		  `menuid` int(10) unsigned NOT NULL default '0',
		  `contentid` int(10) unsigned NOT NULL default '0',
		  `pagename` varchar(250) NOT NULL DEFAULT '' COMMENT 'Имя',
		  `title` varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  `language` char(2) NOT NULL DEFAULT 'ru',
		  `template` VARCHAR(50) NOT NULL DEFAULT '',
		  `metakeys` varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  `metadesc` varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  `mods` TEXT NOT NULL,
		  `usecomment` tinyint(1) unsigned NOT NULL default '0',
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY (`pageid`)
		)".$charset
	);
}

if ($updateManager->isInstall() && !$isPrevVersionCore){
	
	$mainpage = "<h1>Добро пожаловать!</h1>
<p>Поздравляем! Платформа <a href='http://abricos.org'>Abricos</a> успешно установлена на ваш сайт.</p>
<p>Спасибо за то, что выбрали наш продукт.</p>
<p>С чего начать?</p>
<h3>Изменение учетной записи пользователя по умолчанию.</h3>
<p>По умолчанию в системе создается пользователь <strong>admin</strong>(пароль <strong>admin</strong>) с правами Администратора. Необходимо изменить эту учетную запись (установить новый пароль и сменить e-mail). Для этого:</p>
<ol>
<li>Осуществите вход на сайт (имя пользователя: admin, пароль: admin);</li>
<li>Зайдите в панель управления (в правом верхнем углу ссылка);</li>
<li>В левом меню кликните на <strong>Пользователи</strong> и в списке, напротив единственной учетной записи admin, нажмите <strong>Редактировать</strong>.</li>
<li>Смените пароль и e-mail, нажмите сохранить.</li>
</ol>
<p>Полную документацию по Abricos смотрите на <a href='http://abricos.org'>официальном сайте</a></p>
	";
	$db->query_write("
		INSERT INTO `".$pfx."content` (`body`, `dateline`, `deldate`, `modman`) VALUES
		('".bkstr($mainpage)."', ".TIMENOW.", 0, 'sitemap')
	");
	$mainpageId = $db->insert_id();

	$about = "<h1>О проекте</h1><p><a href='http://abricos.org'>Abricos</a> - это самая современная на сегодняшний день система управления web-контентом.</p>";
	$db->query_write("
		INSERT INTO `".$pfx."content` (`body`, `dateline`, `deldate`, `modman`) VALUES
		('".bkstr($about)."', ".TIMENOW.", 0, 'sitemap')
	");
	$aboutpageId = $db->insert_id();
	
	$db->query_write("
		INSERT INTO `".$pfx."sys_menu` (`parentmenuid`, `menutype`, `name`, `title`, `descript`, `link`, `language`, `menuorder`, `level`, `off`, `dateline`, `deldate`) VALUES
		(0, 1, '', 'Главная', 'Главная страница сайта Abricos', '/', 'ru', 0, 0, 0, 0, 0)
	");
	
	$db->query_write("
		INSERT INTO `".$pfx."sys_menu` (`parentmenuid`, `menutype`, `name`, `title`, `descript`, `link`, `language`, `menuorder`, `level`, `off`, `dateline`, `deldate`) VALUES
		(0, 0, 'about', 'О проекте', '', '', 'ru', 0, 0, 0, 0, 0)
	");
	$aboutmenuId = $db->insert_id();
	
	$db->query_write("
		INSERT INTO `".$pfx."sys_page` (`menuid`, `contentid`, `pagename`, `title`, `language`, `metakeys`, `metadesc`, `usecomment`, `dateline`, `deldate`) VALUES
		(0, ".$mainpageId.", 'index', '', 'ru', '', '', 0, ".TIMENOW.", 0),
		(".$aboutmenuId.", ".$aboutpageId.", 'index', '', 'ru', '', '', 0, ".TIMENOW.", 0)
	");
}

if ($isPrevVersionCore){
	$updateManager->serverVersion = '0.2.1';
	
	$db->query_write("
		INSERT INTO `".$pfx."sys_menu` 
			(menuid, parentmenuid, name, link, title, menuorder, dateline) 
		SELECT 
			menuid, parentmenuid, name, link, phrase, menuorder, dateline
		FROM `".$pfx."menu`
		WHERE deldate=0
	");
	$db->query_write("DROP TABLE `".$pfx."menu`");

	$db->query_write("
		INSERT INTO `".$pfx."sys_page` 
			(pageid, menuid, contentid, pagename, title, metakeys, metadesc, dateline)
		SELECT 
			pageid, menuid, contentid, pagename, title, metakeys, metadesc, dateline
		FROM `".$pfx."page`
		WHERE deldate=0
	");
	$db->query_write("DROP TABLE `".$pfx."page`");
}

if ( $updateManager->isUpdate('0.2.1') || $updateManager->serverVersion == '1.0.1'){
	$db->query_write("
		UPDATE ".$pfx."module
			SET takelink='__super'
		WHERE name='sitemap' 
	");
}
if ( $updateManager->isUpdate('0.2.2')){
	CMSRegistry::$instance->modules->GetModule('sitemap')->permission->Install();
}
if ( $updateManager->isUpdate('0.2.3.1')){
	
	$db->query_write("
		ALTER TABLE `".$pfx."sys_page` ADD `editormode` TINYINT(1) UNSIGNED NOT NULL default '0' COMMENT '0-визуальный редактор, 1-исходный код'
	");
	
}
?>