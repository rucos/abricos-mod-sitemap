var Component = new Brick.Component();
Component.requires = {
    yahoo: ['tabview', 'json'],
    mod: [
        {name: 'sys', files: ['panel.js', 'old-form.js', 'editor.js', 'container.js']},
        {name: 'sitemap', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    var L = Y.Lang;

    var Dom = YAHOO.util.Dom,
        buildTemplate = this.buildTemplate,
        BW = Brick.mod.widget.Widget,
        J = YAHOO.lang.JSON;

    var PageEditorWidget = function(container, page, cfg){
        cfg = Y.merge({
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
            this.cfg = cfg;
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
        selectModule: function(){
            var instance = this;
            NS.initManager(function(man){
                man.loadBrickList(function(list){
                    if (L.isNull(list)){
                        return;
                    }
                    new Mods(function(id){
                        instance.addModule(id);
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

    var Mods = function(callback){
        this.callback = callback;
        Mods.superclass.constructor.call(this);
    };
    YAHOO.extend(Mods, Brick.widget.Dialog, {
        initTemplate: function(){
            return buildTemplate(this, 'mods,modstable,modsrow').replace('mods');
        },
        onLoad: function(){
            var TM = this._TM;
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
        cfg = Y.merge({
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
            var instance = this;
            var sd = {
                'id': this.link.id,
                'pid': this.link.parentid,
                'tl': this.gel('mtitle').value,
                'dsc': this.gel('mdesc').value,
                'lnk': this.gel('mlink').value
            };

            NS.manager.linkSave(this.link.id, sd, function(){
                NS.life(instance.cfg['onSave']);
            });
        }
    });
    NS.LinkEditorWidget = LinkEditorWidget;

    /**
     * Редактор ссылки.
     */
    var LinkEditorPanel = function(link, cfg){
        this.link = link;
        cfg = Y.merge({
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
            var instance = this, cfg = this.ccfg;
            var closeCallback = function(){
                instance.close();
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
