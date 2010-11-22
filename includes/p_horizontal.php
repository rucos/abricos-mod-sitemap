<?php
/**
 * Построить горизонтальное меню 
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */
$manager = CMSRegistry::$instance->modules->GetModule('sitemap')->GetManager();
$manager->BrickBuildFullMenu(Brick::$builder->brick);

?>