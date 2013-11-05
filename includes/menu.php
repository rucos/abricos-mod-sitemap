<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

Abricos::GetModule('sitemap')->GetManager();
$man = SitemapManager::$instance;

$brick = Brick::$builder->brick;

$p = &$this->brick->param->param;
$v = &$this->brick->param->var;

$param = $brick->param;

$isFull = $param->param['full'] == 'true';
$pViewLevel = intval($param->param['level']);
$mods = explode("/",$param->param['mods']);


$menuList = $man->MenuList();

if (empty($menuList) || $menuList->Count() == 0){
	$brick->content = "";
	return;
}

if (!class_exists("sitemap_brick_menu_builder")){
	
	class sitemap_brick_menu_builder {
		
		/**
		 * @var Ab_CoreBrick
		 */
		public $brick;
		
		public function __construct(Ab_CoreBrick $brick){
			$this->brick = $brick;
		}

		public function BuildItem(SMMenuItem $menu){
			
			if ($menu->off){ return ""; }
			
			$p = $this->brick->param->param;
			$v = $this->brick->param->var;
			
			if ($p['level'] > 0 && ($menu->Level() > $p['level']+1)){
				return "";
			}
			
			$notItems = !empty($p['not']) ? explode("&", $p['not']) : array();
			
			foreach ($notItems as $nitem){
				if ($nitem == $menu->name){ return ""; }
			}
			
			$lst = "";
			$isChildSelect = false;
			for ($i=0; $i<$menu->childs->Count(); $i++){
				$child = $menu->childs->GetByIndex($i);
				if ($child->isSelect){
					$isChildSelect = true;
				}
				$lst .= $this->BuildItem($child);
			}
			
			if (!empty($lst)){
				$lst = Brick::ReplaceVarByData($v["menu"], array(
					"id" => $menu->id,
					"lvl" => $menu->Level(),
					"hide" => (!$isroot && !$menu->isSelect ? "hide" : ""),
					"rows" => $lst
				));
			}
			
			if ($isroot){ return $lst; }
			
			$isSelect = $menu->isSelect;
			if ($p['notselp'] && $isChildSelect){
				$isSelect = false;
			}
			
			return Brick::ReplaceVarByData($v['item'], array(
				"id" => $menu->id,
				"sel" => $isSelect ? "selected" : "",
				"last" => ($menu->isLast && $menu->childs->Count() == 0) ? "last" : "",
				"tl" => $menu->title,
				"link" => $menu->URI(),
				"lvl" => $menu->Level(),
				"child" => $lst
			));			
		}
		
		public function Build(){
			$v = $this->brick->param->var;
			$p = $this->brick->param->param;
			
			$list = SitemapManager::$instance->MenuList();
			if (!empty($p['from'])){
				$item = $list->FindByPath($p['from']);
				if (empty($item)){ return ""; }
				$list = $item->childs;
			}
			
			$lst = "";
			for ($i=0; $i<$list->Count(); $i++){
				$lst .= $this->BuildItem($list->GetByIndex($i));
			}
			
			return Brick::ReplaceVarByData($v["menu"], array(
				"id" => "0",
				"lvl" => "0",
				"hide" => "",
				"rows" => $lst
			));
				
			
			return $lst;
		}
	}
	
}

$builder = new sitemap_brick_menu_builder($brick);

$v['title'] = !empty($p['title']) ? Brick::ReplaceVarByData($v['title'], array('tl'=> $p['title'])) : "";
$v['result'] = $builder->Build();

/*
if (!function_exists("sitemap_pub_menublock_out")){
	function sitemap_pub_menublock_out(SitemapMenuItem $menu, $param, $parent, $isroot = false, $notItems, $viewLevel = 0){
		if ($viewLevel > 0 && ($menu->level > $viewLevel+1)){ 
			return ""; 
		}
		$isnot = false;
		foreach ($notItems as $nitem){
			if ($nitem == $menu->name){
				return "";
			}
		}
		
		$lst = "";
		$isChildSelect = false;
		foreach ($menu->child as $child){
			if ($child->isSelected){
				$isChildSelect = true;
			}
			$lst .= sitemap_pub_menublock_out($child, $param, $menu, false, $notItems, $viewLevel);
		}
		if (!empty($lst)){
			$lst = Brick::ReplaceVarByData($param->var["menu"], array(
				"id" => $menu->id,
				"lvl" => $menu->level,
				"hide" => (!$isroot && !$menu->isSelected ? "hide" : ""),
				"rows" => $lst
			)); 
		}
		if ($isroot){ return $lst; }
		
		$isSelect = $menu->isSelected;
		if ($param->param['notselp'] && $isChildSelect){
			$isSelect = false;
		}
		
		return Brick::ReplaceVarByData($param->var['item'], array(
			"id" => $menu->id,
			"sel" => $isSelect ? "selected" : "",
			"last" => ($menu->isLast && empty($menu->child)) ? "last" : "",	 
			"tl" => $menu->title,
			"link" => $menu->link,
			"lvl" => ($menu->level-1),
			"child" => $lst
		));
	}
}

$from = $param->param['from'];
$notItems = !empty($param->param['not']) ? explode("&", $param->param['not']) : array();
$param->var['title'] = !empty($param->param['title']) ? Brick::ReplaceVarByData($param->var['title'], array('tl'=>$param->param['title'])) : "";
if (empty($from)){
	$param->var['result'] = sitemap_pub_menublock_out($mm->menu, $param, null, true, $notItems, $pViewLevel);
}else{
	$fromMenu = $mm->Find($from);
	if (!empty($fromMenu)){
		$param->var['result'] = sitemap_pub_menublock_out($fromMenu, $param, null, true, $notItems, $pViewLevel);
	}
}
/**/


?>