<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
$manager = Abricos::GetModule('sitemap')->GetManager();
$manager->BrickBuildFullMenu(Brick::$builder->brick);

?>