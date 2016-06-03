<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/** @var SitemapManager $man */
$man = Abricos::GetModule('sitemap')->GetManager();
$brick = Brick::$builder->brick;

$builder = $man->GetMenuBuilder($brick);
$brick->content = $builder->Build();
