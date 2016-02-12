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

    var old_LinkEditorWidget = function(container, link, cfg){
        cfg = Y.merge({
            'onCancel': null,
            'onSave': null
        }, cfg || {});

        old_LinkEditorWidget.superclass.constructor.call(this, container, {
            'buildTemplate': buildTemplate, 'tnames': 'old_LinkEditorWidget'
        }, link, cfg);
    };
    YAHOO.extend(old_LinkEditorWidget, BW, {
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
    NS.old_LinkEditorWidget = old_LinkEditorWidget;

};
