<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$updateManager = Ab_UpdateManager::$current;
$db = Abricos::$db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){


    $mainpage = "
<h2>Добро пожаловать!</h2>

<p>Поздравляем! Платформа <a href='http://ru.abricos.org' title='Система управления контентом (CMS), платформа интернет-приложений'>Абрикос</a> успешно установлена на Ваш сайт.</p>

<p>С чего начать?</p>

<h4>В целях безопасности измените пароль учетной записи <i>admin</i></h4>
<p>По умолчанию в системе создается пользователь с правами администратора <i>admin</i>. 
Необходимо установить новый пароль и e-mail адрес на эту учетную запись. 
Для этого авторизуйтесь под учетной записью <i>admin</i>, пароль <i>admin</i> и  
перейдите в <a href='/bos/#app=uprofile/ws/showws/'>профиль пользователя</a>
для редактирования.</p>

<h4>Базовые настройки сайта</h4>
<p>
<a href='/bos/#app=user/board/showBoardPanel'>Панель управления</a>
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

	$about = "
		<h2>О проекте</h2>
		<p><a href='http://ru.abricos.org'>Абрикос</a> - это современная система управления web-контентом (CMS) и платформа интернет приложений.</p>
	";

	$mainpageId = Ab_CoreQuery::ContentAppend($db, $mainpage, 'sitemap');
	$aboutpageId = Ab_CoreQuery::ContentAppend($db, $about, 'sitemap');

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

    $db->query_write("
		INSERT INTO ".$pfx."sys_page (menuid, contentid, pagename, title, language, metakeys, metadesc, usecomment, dateline, deldate, mods) VALUES
		(0, ".$mainpageId.", 'index', '', '".Abricos::$LNG."', '', '', 0, ".TIMENOW.", 0, ''),
		(".$aboutmenuId.", ".$aboutpageId.", 'index', '', '".Abricos::$LNG."', '', '', 0, ".TIMENOW.", 0, '')
	");
}

?>