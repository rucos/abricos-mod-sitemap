<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

require_once 'buildclasses.php';

Abricos::GetModule('sitemap')->GetManager();
$man = SitemapManager::$instance;

$brick = Brick::$builder->brick;

$builder = new SitemapMenuBrickBulder($brick);
$brick->content = $builder->Build();

?>