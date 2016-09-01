<?php

if(isset($_GET['vision'])) {
 	setcookie("theme",'vision', time()+3600*24,'/'); 
 	header('Location: ' . $_SERVER['HTTP_REFERER']);
}
 elseif (isset($_GET['default'])) {
 	setcookie("theme",'', time()-1,'/');
	header('Location: ' . $_SERVER['HTTP_REFERER']);
 }
 

?>