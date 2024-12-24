(function($w){
    // an noop function define
    var _noop = function(){};
    var logger = (typeof console === 'undefined')?{
        log:_noop, debug:_noop, error:_noop, warn:_noop, info:_noop
    }:console;

    window.logger = logger;
    // shortcut of methods in dom
    window.$d = $w.document;
    window.$g = function(id){return $d.getElementById(id);};
    window.$c = function(tag){return $d.createElement(tag);};
    window.$t = function(n,t){if(n.hasChildNodes()){n.firstChild.nodeValue = t;}else{n.appendChild($d.createTextNode(t));}};
    window.$h = function(n,t){n.innerHTML = t;};
    // detect isElement
    window.$i = function(el){return !!el&&(typeof el==='object')&&(el.nodeType===1)&&(typeof el.style==='object')&&(typeof el.ownerDocument==='object');};
    if(typeof String.prototype.startsWith != 'function'){String.prototype.startsWith=function(p){return this.slice(0,p.length)===p;};}
    var DEFAULT_OPTIONS = {
        container : '',   // id of the container
        editable : false, // you can change it in your options
        theme : null,
        mode :'full',     // full or side
        support_html : true,

        view:{
            hmargin:100,
            vmargin:50,
            line_width:2,
            line_color:'#3598DB'
        },
        layout:{
            hspace:50,
            vspace:20,
            pspace:13
        },
        default_event_handle:{
            enable_mousedown_handle:true,
            enable_click_handle:true,
            enable_dblclick_handle:true
        },
        shortcut:{
            enable:true,
            handles:{
            },
            mapping:{
                addchild   : 45, // Insert
                addbrother : 13, // Enter
                editnode   : 113,// F2
                delnode    : 46, // Delete
                toggle     : 32, // Space
                // left       : 37, // Left
                // up         : 38, // Up
                // right      : 39, // Right
                // down       : 40, // Down
            }
        },
    };


    __name__ = "jsMind";
    // core object
    var jm = function(options){
        jm.current = this;

    // set 'jsMind' as the library name.
        this.version = "0.4.6";
        this.author = "hizzgdev@163.com";
        this.name = __name__;
        var opts = {};
        jm.util.json.merge(opts, DEFAULT_OPTIONS);
        jm.util.json.merge(opts, options);

        if(!opts.container){
            logger.error('the options.container should not be null or empty.');
            return;
        }
        this.options = opts;
        this.inited = false;
        this.mind = null;
        this.event_handles = [];
        this.init();
    };

    // ============= static object =============================================
    jm.direction = {left:-1,center:0,right:1};
    jm.event_type = {show:1,resize:2,edit:3,select:4};
    // quick way
    jm.show = function(options,mind){
        var _jm = new jm(options);
        _jm.show(mind);
        return _jm;
    };
    $w[__name__] = jm;

    // check global variables
    if(typeof module === 'undefined' || !module.exports){
        if(typeof $w[__name__] != 'undefined'){
            logger.log(__name__+' has been already exist.');
            return;
        }
    }
})(typeof window !== 'undefined' ? window : global);