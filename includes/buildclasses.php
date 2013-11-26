<?php 
/**
 * @package Abricos
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

class SitemapMenuBrickBulder {

	private static $_counter = 1;
	
	public $blockid;
	
	/**
	 * @var Ab_CoreBrick
	 */
	public $brick;
	
	/**
	 * Пустой кирпич, если нет элементов меню
	 * @var boolean
	 */
	public $cfgClearIfEmpty = false;
	
	/**
	 * Ограничение вложенности
	 * 
	 * 0 - без ограничений
	 * @var integer
	 */
	public $cfgLimitLevel = 0;

	/**
	 * Вывод меню с определенного уровня
	 * @var integer
	 */
	public $cfgFromLevel = 0;
	
	/**
	 * Вывод подменю определенного меню.
	 * Необходимо указывать путь меню. 
	 * Например: eshop/electro
	 * @var string
	 */
	public $cfgFromMenu = '';
	
	public $tplContent = '';
	public $tplMenu = '';
	public $tplItem = '';
	
	public function __construct(Ab_CoreBrick $brick){
		
		$this->blockid = SitemapMenuBrickBulder::$_counter++;
		
		$this->brick = $brick;
		$p = &$brick->param->param;
		
		
		$this->cfgClearIfEmpty = $this->ToBoolean($p['clearIfEmpty']);
		$this->cfgFromMenu = $p['fromMenu'];
		
		$v = &$brick->param->var;
		
		$this->tplContent = $brick->content;
		$this->tplMenu = $v['menu'];
		$this->tplItem = $v['item'];
	}
	
	private function ToBoolean($var){
		switch(strtolower($var)){
		case 'true': case 'on': case 'yes': case '1':
			return true;
		}
		return false;
	}
	
	public function BuildItem(SMMenuItem $menu){
		if ($menu->off){ return ""; }
		
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
			$lst = Brick::ReplaceVarByData($this->tplMenu, array(
				"id" => $menu->id,
				"lvl" => $menu->Level(),
				// "hide" => (!$isroot && !$menu->isSelect ? "hide" : ""),
				"rows" => $lst
			));
		}
		
		
		return Brick::ReplaceVarByData($this->tplItem, array(
			"id" => $menu->id,
			"sel" => $menu->isSelect ? "selected" : "",
			"tl" => $menu->title,
			"link" => $menu->URI(),
			"lvl" => $menu->Level(),
			"childs" => $lst
		));
	}
	
	public function Build(){
		$list = SitemapManager::$instance->MenuList();
		
		if (!empty($this->cfgFromMenu)){
			$item = $list->FindByPath($this->cfgFromMenu);
			if (!empty($item)){ return ""; }
			$list = $item->childs;
		}
		
		$lst = "";
		for ($i=0; $i<$list->Count(); $i++){
			$lst .= $this->BuildItem($list->GetByIndex($i));
		}
		
		return Brick::ReplaceVarByData($this->tplContent, array(
			"blockid" => $this->brick->name.$this->blockid,
			"result" => Brick::ReplaceVarByData($this->tplMenu, array(
				"lvl" => "0",
				"rows" => $lst
			))
		));
	}
	
}
?>