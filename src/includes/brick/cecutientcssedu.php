<?php
$brick = Brick::$builder->brick;

 if (isset($_COOKIE["theme"])){
 		$result = "/tt/edu/css/cecutient.css?v=0.1.0"; 
 		
 } else {
 		$result = ""; 
 }
 
 $brick->content = Brick::ReplaceVarByData($brick->content, array(
 		"result" => $result
 ));
?>