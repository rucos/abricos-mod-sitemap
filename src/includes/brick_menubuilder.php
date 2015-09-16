<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

require_once 'buildclasses.php';

Abricos::GetModule('sitemap')->GetManager();
$man = SitemapManager::$instance;

$brick = Brick::$builder->brick;

$builder = new SitemapMenuBrickBulder($brick);
$brick->content = $builder->Build();

?>