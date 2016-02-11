var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['pageEditor.js', 'linkEditor']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.CreateWidget = Y.Base.create('createWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            this.publish('created', {
                defaultFn: this._defCreated
            });
            this.publish('canceled', {
                defaultFn: this._defCanceled
            });
        },
        destructor: function(){
        },
        _defCanceled: function(){
            this.go('ws');
        },
        _defCreated: function(){
            var parentid = this.get('parentid') | 0;
            switch (this.get('selected') | 0) {
                case 0:
                    return this.go('menu.append', parentid);
                case 1:
                    return this.go('link.append', parentid);
                case 2:
                    return this.go('page.append', parentid);
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            parentid: {value: 0},
            selected: {
                readOnly: true,
                getter: function(){
                    var tp = this.template;

                    if (tp.gel('type0').checked){
                        return 0;
                    } else if (tp.gel('type1').checked){
                        return 1;
                    }
                    return 2;
                }
            }
        },
        CLICKS: {
            create: {
                event: function(){
                    this.fire('created', {
                        selected: this.get('selected')
                    });
                }
            },
            cancel: {
                event: function(){
                    this.fire('canceled');
                }
            },
        },
        parseURLParam: function(args){
            args = args || [];
            return {
                parentid: (args[0] | 0),
            };
        }
    });

};
