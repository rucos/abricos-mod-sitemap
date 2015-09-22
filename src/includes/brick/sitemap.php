<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */


if (!function_exists("sitemap_brick_sitemap_buildlist")){
    function sitemap_brick_sitemap_buildlist($path, &$result, $uri){

        if (!is_dir($path)){
            return;
        }

        $dir = dir($path);
        $mList = SitemapManager::$instance->MenuList();

        while (false !== ($entry = $dir->read())){
            if ($entry == "." || $entry == ".." || empty($entry)){
                continue;
            }

            $nUri = $uri.$entry."/";

            $mItem = $mList->FindByPath($nUri);

            $indexFile = $path."/".$entry."/index.html";
            if (file_exists($indexFile) && empty($mItem)){
                $bkInfo = Ab_CoreBrickReader::ReadBrickFromFile($indexFile, '');
                if (!(empty($bkInfo) || empty($bkInfo->param)
                    || empty($bkInfo->param->module)
                    || empty($bkInfo->param->module['sitemap']))
                ){

                    $isRequest = false;
                    foreach ($bkInfo->param->module['sitemap'] as $bkInfo){
                        if ($bkInfo->name == 'regmenuitem'){
                            $isRequest = true;
                        }
                    }
                    if ($isRequest){
                        array_push($result, "'".$nUri."'");
                    }
                }
            }
            if (is_dir($path."/".$entry)){
                sitemap_brick_sitemap_buildlist($path."/".$entry, $result, $nUri);
            }
        }
        return;
    }
}

$brick = Brick::$builder->brick;
$v = &$brick->param->var;
$p = &$brick->param->param;

SitemapModule::$instance->GetManager();
$man = SitemapManager::$instance;

if (!$man->IsAdminRole()){
    return;
}

// сгенерировать меню из супер контента, если таковой имеется

$path = CWD."/content/".Abricos::$LNG;

$aLst = array();
sitemap_brick_sitemap_buildlist($path, $aLst, "/");
if (count($aLst) == 0){
    return;
}

$brick->content .= Brick::ReplaceVarByData($v['adminscript'], array(
    'list' => implode(",", $aLst)
));

?>