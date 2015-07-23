var Component = new Brick.Component();
Component.requires = {
    yahoo: ['dom']
};
Component.entryPoint = function(){
    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var NS = this.namespace,
        API = NS.API,
        TMG = this.template;

    API.initPaginator = function(el, config){
        el = Dom.get(el);
        if (L.isNull(el)){
            return null;
        }
        return new Paginator(el, config);
    };

    API.initPaginatorByClassName = function(classname, config){
        var els = Dom.getElementsByClassName(classname);
        var pgs = [];
        for (var i = 0; i < els.length; i++){
            pgs[pgs.length] = API.initPaginator(els[i], config);
        }
        return pgs;
    };

    var Paginator = function(el, config){
        this.init(el, config);
    };

    Paginator.prototype = {
        init: function(el, config){

            var tmp = Dom.getElementsByClassName('paginatorinfo', null, el);
            if (tmp.length != 1){
                return;
            }
            var cfa = tmp[0].innerHTML.split('|');

            this.cfg = {
                'total': cfa[0] * 1,
                'perpage': cfa[1] * 1,
                'page': cfa[2] * 1,
                'pagecount': cfa[3] * 1,
                'uri': cfa[4],
                'uripage': cfa[5],
                'hidepn': cfa[6] * 1
            };
            this.element = el;
            this.page = this.lastPage = this.cfg['page'];


            var __self = this;
            E.on(el, 'click', function(e){
                if (__self.onClick(E.getTarget(e))){
                    E.stopEvent(e);
                }
            });

            var TM = TMG.build('first,last,prev,next,current,item'), T = TM.data, TId = TM.idManager;
            this._TM = TM;
            this._T = T;
            this._TId = TId;

            this.onPageChange = new YAHOO.util.CustomEvent("onPageChange");

            this.setPage(this.cfg['page']);
        },
        setPage: function(page){
            page = page * 1;
            page = Math.max(page, 1);
            this.lastPage = this.page * 1;
            this.page = page;

            var TM = this._TM, T = this._T, cfg = this.cfg, lst = "";

            var pcount = Math.ceil(cfg['total'] / cfg['perpage']);
            var delim = Math.floor(cfg['pagecount'] / 2);
            var pbegin = Math.max(1, page - delim);
            var pend = Math.min(pcount, pbegin + cfg['pagecount']);
            var uri = cfg['uri'], uripage = cfg['uripage'];
            var hidepn = cfg['hidepn'] > 0;

            if (page > 1 || !hidepn){
                if (page > 2 || !hidepn){
                    lst += TM.replace('first', {'lnk': uri});
                }
                lst += TM.replace('prev', {
                    'lnk': page > 2 ? uri + uripage + (page - 1) + '/' : uri
                });
            }

            for (var i = pbegin; i <= pend; i++){
                var tt = "";
                if (page == i){
                    tt = TM.replace('current', {'c': i});
                } else {
                    tt = TM.replace('item', {
                        'c': i,
                        'lnk': (i > 1 ? uri + uripage + i + '/' : uri)
                    });
                }
                lst += tt;
            }

            if (page < pcount || !hidepn){
                lst += TM.replace('next', {
                    "lnk": uri + uripage + (page + 1) + "/"
                });
                if (page < pcount - 1 || !hidepn){
                    lst += TM.replace('last', {
                        'lnk': uri + uripage + pcount + "/"
                    });
                }
            }
            this.element.innerHTML = lst;
        },
        onClick: function(el){
            var pcount = Math.ceil(this.cfg['total'] / this.cfg['perpage']);

            var TId = this._TId;
            switch (el.id) {
                case TId['first']['id']:
                    this._onPageChange(1);
                    return true;
                case TId['prev']['id']:
                    this._onPageChange(this.page - 1);
                    return true;
                case TId['next']['id']:
                    this._onPageChange(this.page + 1);
                    return true;
                case TId['last']['id']:
                    this._onPageChange(pcount);
                    return true;
            }

            var prefix = el.id.replace(/([0-9]+$)/, '');
            var numid = el.id.replace(prefix, "");

            switch (prefix) {
                case (this._TId['item']['id'] + '-'):
                    this._onPageChange(numid);
                    return true;
            }

            return false;
        },
        _onPageChange: function(page){
            page = Math.max(page * 1, 1);
            if (this.page == page){
                return;
            }
            this.onPageChange.fire(page, this.lastPage);
        }
    };

    NS.Paginator = Paginator;

};
