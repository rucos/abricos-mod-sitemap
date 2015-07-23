/**
 * @module Sitemap
 * @namespace Brick.mod.sitemap
 */
var Component = new Brick.Component();
Component.requires = {
    yahoo: ['tabview', 'json', 'dragdrop'],
    mod: [
        {name: 'sys', files: ['old-form.js', 'editor.js', 'container.js']},
        {name: 'sitemap', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang,
        buildTemplate = this.buildTemplate,
        BW = Brick.mod.widget.Widget;

    var J = YAHOO.lang.JSON;

    var PageEditorWidget = function(container, page, cfg){
        cfg = L.merge({
            'onCancel': null,
            'onSave': null,
            'onLoadDetail': null,
            'parentMenuItem': null
        }, cfg || {});

        PageEditorWidget.superclass.constructor.call(this, container, {
            'buildTemplate': buildTemplate, 'tnames': 'pageeditorwidget,select,option,moditem'
        }, page, cfg);
    };
    YAHOO.extend(PageEditorWidget, BW, {
        init: function(page, cfg){
            this.page = page;
            this.cfg = cfg;
            this.editor = null;
            this._mods = "";
        },
        destroy: function(){
            if (L.isValue(this.editor)){
                this.editor.destroy();
            }
            PageEditorWidget.superclass.destroy.call(this);
        },
        onLoad: function(page, cfg){
            if (!L.isValue(page)){
                this.elHide('loading,view');
                this.elShow('nullitem');
                NS.life(cfg['onLoadDetail'], page);
                return;
            }

            if (L.isValue(page.detail) || page.id == 0){
                this._onLoadDetail(page, cfg);
            } else {
                var __self = this;
                NS.manager.pageLoad(page.id, function(){
                    __self._onLoadDetail(page, cfg);
                    NS.life(cfg['onLoadDetail'], page);
                });
            }
        },
        _onLoadDetail: function(page, cfg){
            this.elHide('loading');
            this.elShow('view');

            var TM = this._TM;

            new YAHOO.widget.TabView(this.gel('tab'));

            var detail = page.detail;

            var Editor = Brick.widget.Editor;
            this.editor = new Editor(this.gel('editor'), {
                'width': '750px', height: '250px',
                'mode': detail.editorMode > 0 ? Editor.MODE_CODE : Editor.MODE_VISUAL,
                'value': detail.body
            });

            var mItem;

            if (page.id == 0){
                mItem = new NS.Menu({
                    'pid': L.isValue(cfg['parentMenuId']) ? cfg['parentMenuId'].id : 0
                });
            } else {
                mItem = NS.manager.menuList.find(page.menuid);
            }

            if (!L.isValue(mItem) && page.name == 'index'){ // заглавная страница
                this.elHide('pgnamecont');
                this.elSetValue('pgname', 'index');
            } else if (page.name != 'index'){

            } else {
                this.elShow('menucont');

                this.elSetValue({
                    'mtitle': mItem.title,
                    'mdesc': mItem.descript,
                    'mname': mItem.name
                });
                this.gel('moff').checked = mItem.off > 0 ? true : false;
            }

            var s = TM.replace('option', {'id': '', 'tl': ''});
            var tmps = NS.manager.templates;
            for (var i = 0; i < tmps.length; i++){
                s += TM.replace('option', {'id': tmps[i], 'tl': tmps[i]});
            }

            this.elSetHTML('templates', TM.replace('select', {'list': s}));

            this.elSetValue({
                'pgname': page.name,
                'pgtitle': page.title,
                'pgkeys': detail.metaKeys,
                'pgdesc': detail.metaDesc,
                'select.id': detail.template
            });

            if (page.name == 'index'){
                this.elHide('pgnamecont');
            }

            this._mods = detail.mods;

            this.renderMods();
        },
        renderMods: function(){
            var TM = this._TM, mods = this._mods, lst = "";
            this.modsid = {};

            if (L.isString(mods) && mods.length > 0){
                var o = YAHOO.lang.JSON.parse(mods), i = 0;

                for (var own in o){
                    for (var bk in o[own]){
                        this.modsid[i] = {'own': own, 'bk': bk};
                        lst += TM.replace('moditem', {
                            'own': own,
                            'nm': bk,
                            'id': i
                        });
                        i++;
                    }
                }
            }
            this.elSetHTML('modlist', lst);
        },
        onClick: function(el, tp){
            switch (el.id) {
                case tp['bcancel']:
                    this.close();
                    return true;
                case tp['bsave']:
                    this.save();
                    return true;
                case tp['baddmod']:
                    this.selectModule();
                    return true;
            }

            var TId = this._TId;
            var prefix = el.id.replace(/([0-9]+$)/, '');
            var numid = el.id.replace(prefix, "");

            switch (prefix) {
                case TId['moditem']['insert'] + '-':
                    this.insertModule(numid);
                    return true;
                case TId['moditem']['remove'] + '-':
                    this.removeModule(numid);
                    return true;
            }
            return false;
        },
        close: function(){
            NS.life(this.cfg['onCancel']);
        },
        nameTranslite: function(){
            var el = this.gel('mname');
            var title = this.gel('mtitle');
            if (!el.value && title.value){
                el.value = Brick.util.Translite.ruen(title.value);
            }
        },
        save: function(){
            var cfg = this.cfg;
            this.nameTranslite();

            var sd = {
                'page': {
                    'id': this.page.id,
                    'nm': this.gel('pgname').value,
                    'tl': this.gel('pgtitle').value,
                    'mtks': this.gel('pgkeys').value,
                    'mtdsc': this.gel('pgdesc').value,
                    'tpl': this.gel('select.id').value,
                    'mods': this._mods,
                    'bd': this.editor.getContent(),
                    'em': this.editor.get('mode') == Brick.widget.Editor.MODE_CODE ? 1 : 0
                },
                'menu': {
                    'id': this.page.menuid,
                    'pid': L.isValue(this.cfg['parentMenuItem']) ? this.cfg['parentMenuItem'].id : 0,
                    'tl': this.gel('mtitle').value,
                    'dsc': this.gel('mdesc').value,
                    'nm': this.gel('mname').value,
                    'off': (this.gel('moff').checked ? 1 : 0)
                }
            };
            var menuid = sd['menu']['id'];
            if (L.isValue(this.cfg['parentMenuItem'])){
                sd['menu']['pid'] = this.cfg['parentMenuItem'].id;
            } else if (menuid > 0){
                var menu = NS.manager.menuList.find(menuid);
                if (L.isValue(menu) && L.isValue(menu.parent)){
                    sd['menu']['pid'] = menu.parent.id;
                }
            }
            NS.manager.pageSave(this.page.id, sd, function(){
                NS.life(cfg['onSave']);
            });
        },
        selectModule: function(){
            var __self = this;
            NS.initManager(function(man){
                man.loadBrickList(function(list){
                    if (L.isNull(list)){
                        return;
                    }
                    new Mods(function(id){
                        __self.addModule(id);
                    });
                });
            });
        },
        addModule: function(id){
            var o = this._mods == "" ? {} : J.parse(this._mods);
            var di = NS.manager.brickList.get(id);

            if (!o[di['mName']]){
                o[di['mName']] = {};
            }

            o[di['mName']][di['bName']] = '';
            this._mods = J.stringify(o);
            this.renderMods();
        },
        insertModule: function(id){
            var o = this.modsid[id];
            this.editor.insertValue("[mod]" + o['own'] + ":" + o['bk'] + "[/mod]");
        },
        removeModule: function(id){
            var no = {}, co = this.modsid[id];
            var o = this._mods == "" ? {} : J.parse(this._mods);

            for (var own in o){
                for (var bk in o[own]){
                    if (own != co['own'] || bk != co['bk']){
                        if (!no[own]){
                            no[own] = {};
                        }
                        no[own][bk] = '';
                    }
                }
            }
            this._mods = J.stringify(no);
            this.renderMods();
        }

    });
    NS.PageEditorWidget = PageEditorWidget;

    var PageEditorPanel = function(page, cfg){
        this.page = page;
        this.ccfg = L.merge({
            'onClose': null,
            'onSave': null
        }, cfg || {});
        PageEditorPanel.superclass.constructor.call(this, {'overflow': true});
    };
    YAHOO.extend(PageEditorPanel, Brick.widget.Dialog, {
        initTemplate: function(){
            return buildTemplate(this, 'pageeditorpanel').replace('pageeditorpanel');
        },
        onLoad: function(){
            var __self = this, cfg = this.ccfg;
            var closeCallback = function(){
                __self.close();
                NS.life(cfg['onClose']);
            };
            this.editorWidget = new PageEditorWidget(this._TM.getEl('pageeditorpanel.widget'), this.page, {
                'parentMenuItem': cfg['parentMenuItem'],
                'onLoadDetail': function(){
                    __self.center();
                },
                'onCancel': closeCallback,
                'onSave': function(){
                    NS.life(cfg['onSave']);
                    closeCallback();
                }
            });
        }
    });

    NS.PageEditorPanel = PageEditorPanel;

    var Mods = function(callback){
        this.callback = callback;
        Mods.superclass.constructor.call(this);
    };
    YAHOO.extend(Mods, Brick.widget.Dialog, {
        el: function(name){
            return Dom.get(this._TId['mods'][name]);
        },
        elv: function(name){
            return Brick.util.Form.getValue(this.el(name));
        },
        setelv: function(name, value){
            Brick.util.Form.setValue(this.el(name), value);
        },
        initTemplate: function(){
            return buildTemplate(this, 'mods,modstable,modsrow').replace('mods');
        },
        onLoad: function(){
            var TM = this._TM;
            var lst = "";
            NS.manager.brickList.foreach(function(di){
                lst += TM.replace('modsrow', {
                    'id': di['id'], 'own': di['mName'], 'nm': di['bName']
                });
            });
            TM.getEl('mods.table').innerHTML = TM.replace('modstable', {'rows': lst});
        },
        onClick: function(el){
            var TId = this._TId, tp = TId['mods'];
            switch (el.id) {
                case tp['bcancel']:
                    this.close();
                    return true;
            }

            var prefix = el.id.replace(/([0-9]+$)/, '');
            var numid = el.id.replace(prefix, "");

            if (prefix == (TId['modsrow']['select'] + '-')){
                this.callback(numid);
                this.close();
                return true;
            }
            return false;
        }
    });


    var LinkEditorWidget = function(container, link, cfg){
        cfg = L.merge({
            'onCancel': null,
            'onSave': null
        }, cfg || {});

        LinkEditorWidget.superclass.constructor.call(this, container, {
            'buildTemplate': buildTemplate, 'tnames': 'linkeditorwidget'
        }, link, cfg);
    };
    YAHOO.extend(LinkEditorWidget, BW, {
        init: function(link, cfg){
            this.link = link;
            this.cfg = cfg;
        },
        onLoad: function(link, cfg){
            if (!L.isValue(link)){
                this.elShow('nullitem');
                return;
            }
            this.elShow('view');

            this.elSetValue({
                'mtitle': link.title,
                'mdesc': link.descript,
                'mlink': link.link
            });
        },
        onClick: function(el, tp){
            switch (el.id) {
                case tp['bcancel']:
                    this.close();
                    return true;
                case tp['bsave']:
                    this.save();
                    return true;
            }
            return false;
        },
        close: function(){
            NS.life(this.cfg['onCancel']);
        },
        save: function(){
            var __self = this;
            var sd = {
                'id': this.link.id,
                'pid': this.link.parentid,
                'tl': this.gel('mtitle').value,
                'dsc': this.gel('mdesc').value,
                'lnk': this.gel('mlink').value
            };

            NS.manager.linkSave(this.link.id, sd, function(){
                NS.life(__self.cfg['onSave']);
            });
        }
    });
    NS.LinkEditorWidget = LinkEditorWidget;

    /**
     * Редактор ссылки.
     */
    var LinkEditorPanel = function(link, cfg){
        this.link = link;
        cfg = L.merge({
            'onClose': null,
            'onSave': null,
            'overflow': true
        }, cfg || {});
        this.ccfg = cfg;
        LinkEditorPanel.superclass.constructor.call(this);
    };
    YAHOO.extend(LinkEditorPanel, Brick.widget.Dialog, {
        initTemplate: function(){
            return buildTemplate(this, 'linkeditor').replace('linkeditor');
        },
        onLoad: function(){
            var __self = this, cfg = this.ccfg;
            var closeCallback = function(){
                __self.close();
                NS.life(cfg['onClose']);
            };
            this.editorWidget = new NS.LinkEditorWidget(this._TM.getEl('linkeditor.widget'), this.link, {
                'onCancel': closeCallback,
                'onSave': function(){
                    NS.life(cfg['onSave']);
                    closeCallback();
                }
            });
        }
    });
    NS.LinkEditorPanel = LinkEditorPanel;
};
