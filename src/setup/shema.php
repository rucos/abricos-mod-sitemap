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

if ($updateManager->isInstall() || $isPrevVersionCore){

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

if ($isPrevVersionCore){
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

if ($updateManager->isUpdate('0.2.1') || $updateManager->serverVersion == '1.0.1'){
    $db->query_write("
		UPDATE ".$pfx."module
		SET takelink='__super'
		WHERE name='sitemap' 
	");
}

if ($updateManager->isUpdate('0.2.2')){
    Abricos::GetModule('sitemap')->permission->Install();
}

if ($updateManager->isUpdate('0.2.3.1')){
    $db->query_write("
		ALTER TABLE ".$pfx."sys_page ADD editormode TINYINT(1) UNSIGNED NOT NULL default '0' COMMENT '0-визуальный редактор, 1-исходный код'
	");
}

?>