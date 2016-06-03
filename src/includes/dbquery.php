<?php
/**
 * @package Abricos
 * @subpackage Sitemap
 * @copyright 2008-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * Class SitemapDBQuery
 */
class SitemapDBQuery {

    const FIELDS_MENU = "
		menuid as id,
		parentmenuid as pid,
		menutype as tp,
		name as nm,
		title as tl,
		descript as dsc,
		link as lnk,
		menuorder as ord,
		level as lvl,
		off
	";

    public static function MenuList(Ab_Database $db){
        $sql = "
			SELECT
			".SitemapDBQuery::FIELDS_MENU."
			FROM ".$db->prefix."sys_menu
			WHERE deldate=0 AND language='".Abricos::$LNG."'
			ORDER BY parentmenuid, menuorder
		";
        return $db->query_read($sql);
    }

    public static function MenuAppend(Ab_Database $db, $d){
        $d->nm = isset($d->nm) ? $d->nm : "";
        $d->ord = isset($d->ord) ? $d->ord : 0;
        $d->off = isset($d->off) ? $d->off : 0;

        $sql = "
			INSERT INTO ".$db->prefix."sys_menu
			(parentmenuid, name, link, title, descript, menutype, menuorder, off, language) VALUES (
				".bkint($d->pid).",
				'".bkstr($d->nm)."',
				'".bkstr($d->lnk)."',
				'".bkstr($d->tl)."',
				'".bkstr($d->dsc)."',
				".bkint($d->tp).",
				".bkint($d->ord).",
				".bkint($d->off).",
				'".Abricos::$LNG."'
			)
		";
        $db->query_write($sql);
        return $db->insert_id();
    }

    public static function MenuUpdate(Ab_Database $db, $d){
        $d->nm = isset($d->nm) ? $d->nm : '';
        $d->off = isset($d->off) ? $d->off : 0;
        $sql = "
			UPDATE ".$db->prefix."sys_menu
			SET
				parentmenuid=".bkint($d->pid).",
				name='".bkstr($d->nm)."',
				link='".bkstr($d->lnk)."',
				title='".bkstr($d->tl)."',
				descript='".bkstr($d->dsc)."',
				off=".bkint($d->off)."
			WHERE menuid='".bkint($d->id)."'
		";
        $db->query_write($sql);
    }

    public static function MenuRemove(Ab_Database $db, $menuid){
        // remove pages
        $sql = "
			UPDATE ".$db->prefix."sys_page
			SET deldate='".TIMENOW."'
			WHERE menuid=".bkint($menuid)."
		";
        $db->query_write($sql);

        $db->query_write("
			UPDATE ".$db->prefix."sys_menu
			SET deldate='".TIMENOW."'
			WHERE menuid=".bkint($menuid)."
		");
        $db->query_write($sql);
    }

    public static function MenuOrderUpdate(Ab_Database $db, $menuid, $order){
        $sql = "
			UPDATE ".$db->prefix."sys_menu
			SET menuorder=".bkint($order)."
			WHERE menuid=".bkint($menuid)."
			LIMIT 1
		";
        $db->query_write($sql);
    }


    public static function PageList(Ab_Database $db){
        $sql = "
			SELECT
				a.pageid as id,
				a.menuid as mid,
				a.pagename as nm,
				a.title as tl
			
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.language='".Abricos::$LNG."' AND a.deldate=0
		";
        return $db->query_read($sql);
    }

    const FIELDS_PAGE = "
		a.pageid as id,
		a.menuid as mid,
		a.pagename as nm,
		a.title as tl,
		a.metakeys as mtks,
		a.metadesc as mtdsc,
		a.template as tpl,
		a.mods as mods,
		a.editormode as em,
		a.contentid as cid,
		c.body as bd
	";

    public static function PageByName(Ab_Database $db, $menuid, $pagename){
        $sql = "
			SELECT
				".SitemapDBQuery::FIELDS_PAGE."
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.menuid=".bkint($menuid)." AND a.pagename='".bkstr($pagename)."' AND a.language='".Abricos::$LNG."'
			LIMIT 1
		";
        return $db->query_first($sql);
    }

    public static function Page(Ab_Database $db, $pageid){
        $sql = "
			SELECT
				".SitemapDBQuery::FIELDS_PAGE."
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.pageid=".bkint($pageid)." AND a.language='".Abricos::$LNG."'
			LIMIT 1
		";
        return $db->query_first($sql);
    }

    public static function PageAppend(Ab_Database $db, $d){
        $contentid = Ab_CoreQuery::CreateContent($db, $d->bd, 'sitemap');
        $sql = "
			INSERT INTO ".$db->prefix."sys_page
			(pagename, menuid, contentid, language, title, 
			 metakeys, metadesc, template, mods, editormode, dateline) VALUES (
				'".bkstr($d->nm)."',
				".bkint($d->mid).",
				'".bkstr($contentid)."',
				'".Abricos::$LNG."',
				'".bkstr($d->tl)."',
				'".bkstr($d->mks)."',
				'".bkstr($d->mdsc)."',
				'".bkstr($d->tpl)."',
				'".bkstr($d->mods)."',
				".bkint($d->em).",
				".TIMENOW."
			)
		";
        $db->query_write($sql);
        return $db->insert_id();
    }

    public static function PageUpdate(Ab_Database $db, $d){
        Ab_CoreQuery::ContentUpdate($db, $d->cid, $d->bd);
        $sql = "
			UPDATE ".$db->prefix."sys_page
			SET
				pagename='".bkstr($d->nm)."',
				title='".bkstr($d->tl)."',
				metakeys='".bkstr($d->mtks)."',
				metadesc='".bkstr($d->mtdsc)."',
				mods='".bkstr($d->mods)."',
				template='".bkstr($d->tpl)."',
				editormode=".bkint($d->em).",
				dateline='".TIMENOW."'
			WHERE pageid='".bkint($d->id)."'
			LIMIT 1
		";
        $db->query_write($sql);
    }


}

/**
 * (Устарели) Статичные функции запросов к базе данных
 *
 * @package Abricos
 * @subpackage Sitemap
 */
class SitemapQuery {

    /**
     * Тип меню страница/раздел
     *
     */
    const MENUTYPE_PAGE = 0;
    /**
     * Тип меню ссылка
     *
     */
    const MENUTYPE_LINK = 1;


    const FIELDS_MENU = "
		menuid as id,
		parentmenuid as pid,
		menutype as tp,
		name as nm,
		title as tl,
		descript as dsc,
		link as lnk,
		menuorder as ord,
		level as lvl,
		off
	";


    public static function MenuByPageId(Ab_Database $db, $pageid){
        $sql = "
			SELECT
				b.menuid as id,
				b.parentmenuid as pid,
				b.menutype as tp,
				b.name as nm,
				b.title as tl,
				b.descript as dsc,
				b.link as lnk,
				b.menuorder as ord,
				b.level as lvl,
				b.off
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."sys_menu b ON b.menuid=a.menuid
			WHERE a.pageid=".bkint($pageid)."
		";
        return $db->query_read($sql);
    }

    const FIELDS_PAGE = "
		a.pageid as id,
		a.menuid as mid,
		a.pagename as nm,
		a.title as tl,
		a.metakeys as mtks,
		a.metadesc as mtdsc,
		a.template as tpl,
		a.mods as mods,
		a.editormode as em,
		a.contentid as cid,
		c.body as bd
	";

    public static function PageByName(Ab_Database $db, $menuid, $pagename, $returnTypeRow = false){
        $sql = "
			SELECT
				".SitemapQuery::FIELDS_PAGE." 
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.menuid=".bkint($menuid)." AND a.pagename='".bkstr($pagename)."' AND a.language='".Abricos::$LNG."'
			LIMIT 1
		";
        if ($returnTypeRow){
            return $db->query_first($sql);
        } else {
            return $db->query_read($sql);
        }
    }

    public static function PageById(Ab_Database $db, $pageid, $retArray = false){
        $sql = "
			SELECT
				".SitemapQuery::FIELDS_PAGE." 
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.pageid=".bkint($pageid)."
			LIMIT 1
		";

        return $retArray ? $db->query_first($sql) : $db->query_read($sql);
    }

    public static function PageList(Ab_Database $db){
        $rootPage = SitemapQuery::PageByName($db, 0, 'index', true);
        if (empty($rootPage)){
            $d = new stdClass();
            $d->nm = 'index';
            $d->mid = 0;
            $d->tl = '';
            $d->mks = '';
            $d->mdsc = '';
            SitemapQuery::PageCreate($db, $d);
        }
        $sql = "
			SELECT 
				pageid as id,
				menuid as mid,
				contentid as cid,
				pagename as nm
			FROM ".$db->prefix."sys_page
			WHERE deldate=0 AND language='".Abricos::$LNG."'
		";
        return $db->query_read($sql);
    }


    public static function MenuById(Ab_Database $db, $menuid){
        $sql = "
			SELECT
				".SitemapQuery::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE menuid=".bkint($menuid)."
			LIMIT 1
		";
        return $db->query_read($sql);
    }


    public static function MenuListByUrl(Ab_Database $db, $dir){
        $names = array();
        foreach ($dir as $name){
            array_push($names, "name='".bkstr($name)."'");
        }
        $sql = "
			SELECT
				".SitemapQuery::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE deldate=0 AND (".implode(" OR ", $names).") AND language='".Abricos::$LNG."'
			ORDER BY parentmenuid
		";
        return $db->query_read($sql);
    }

    public static function MenuList(Ab_Database $db, $withOff = false){
        $sql = "
			SELECT
				".SitemapQuery::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE deldate=0 ".($withOff ? "" : " AND off=0")." AND language='".Abricos::$LNG."'
			ORDER BY menuorder
		";
        return $db->query_read($sql);
    }

    public static function PageRemove(Ab_Database $db, $pageid){
        $sql = "
			SELECT pageid, contentid
			FROM ".$db->prefix."sys_page
			WHERE pageid='".bkint($pageid)."'
		";
        $row = $db->query_first($sql);
        $db->query_write("
			UPDATE ".$db->prefix."content
			SET deldate='".TIMENOW."'
			WHERE contentid='".bkint($row['contentid'])."'
		");
        $db->query_write("
			UPDATE ".$db->prefix."sys_page
			SET deldate='".TIMENOW."'
			WHERE pageid='".bkint($pageid)."'
		");
    }
}
