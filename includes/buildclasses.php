<?php 
/**
 * @package Abricos
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

class SitemapMenuBrickBulder {

	private static $_counter = 1;
	
	public $brickid;
	
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
	public $tplItemWithSub = '';
	public $tplSubMenu = '';
	
	public function __construct(Ab_CoreBrick $brick){
		
		$this->brickid = SitemapMenuBrickBulder::$_counter++;
		
		$this->brick = $brick;
		$p = &$brick->param->param;
		
		
		$this->cfgClearIfEmpty = $this->ToBoolean($p['clearIfEmpty']);
		$this->cfgFromMenu = $p['fromMenu'];
		
		$v = &$brick->param->var;
		
		$this->tplContent = $brick->content;
		$this->tplMenu = $v['menu'];
		$this->tplItem = $v['item'];
		$this->tplItemWithSub = empty($v['itemwithsub']) ? $v['item'] : $v['itemwithsub'];
		$this->tplSubMenu = empty($v['submenu']) ? $v['menu'] : $v['submenu'];
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
		
		$tplItem = $this->tplItem;
		
		if (!empty($lst)){
			$tplItem = $this->tplItemWithSub;
			$lst = Brick::ReplaceVarByData($this->tplSubMenu, array(
				"id" => $menu->id,
				"rows" => $lst
			));
		}
		
		
		return Brick::ReplaceVarByData($tplItem, array(
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
			"result" => Brick::ReplaceVarByData($this->tplMenu, array(
				"rows" => $lst
			)),
			"brickid" => ($this->brick->name.$this->brickid)
		));
	}
	
}
?>