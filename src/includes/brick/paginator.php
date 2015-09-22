<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$brick = Brick::$builder->brick;
$db = Abricos::$db;

$pp = &$brick->param->param;
$pv = &$brick->param->var;

$total = $pp['total'];
$perpage = $pp['perpage'];
$pagelink = $pp['pagelink'];
$uri = $pp['uri'];
$uripage = $pp['uripage'];
$hidepn = intval($pp['hidepn']) > 0;

$page = max(1, $pp['page']);

$pcount = ceil($total / $perpage);
if ($pcount <= 1){
    $brick->content = "";
    return;
}

$result = "";
if ($page > 1 || !$hidepn){
    if ($page > 2 || !$hidepn){
        $result .= Brick::ReplaceVar($pv['first'], "lnk", $uri);
    }
    $lnk = $page > 2 ? $uri.$uripage.($page - 1).'/' : $uri;
    $result .= Brick::ReplaceVar($pv['prev'], "lnk", $lnk);
}

$delim = floor($pagelink / 2);
$pbegin = max(1, $page - $delim);
$pend = min($pcount, $pbegin + $pagelink);

for ($i = $pbegin; $i <= $pend; $i++){
    if ($page == $i){
        $tt = Brick::ReplaceVar($pv['curr'], "c", $i);
    } else {
        $lnk = $i > 1 ? $uri.$uripage.$i.'/' : $uri;
        $tt = Brick::ReplaceVarByData($brick->param->var['item'], array(
            "c" => $i,
            "lnk" => $lnk
        ));
    }
    $result .= $tt;
}

if ($page < $pcount){
    $result .= Brick::ReplaceVar($pv['next'], "lnk", $uri.$uripage.($page + 1)."/");
    if ($page < $pcount - 1){
        $result .= Brick::ReplaceVar($brick->param->var['last'], "lnk", $uri.$uripage.$pcount."/");
    }
}

$brick->param->var["result"] = $result;

// Paginator info
$brick->content = Brick::ReplaceVarByData($brick->content, array(
    "info" => implode("|", array(
        $total,
        $perpage,
        $page,
        $pagelink,
        $uri,
        $uripage,
        $hidepn
    ))
));

?>