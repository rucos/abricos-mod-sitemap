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

    var buildTemplate = this.buildTemplate,
        BW = Brick.mod.widget.Widget,
        J = YAHOO.lang.JSON;

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
