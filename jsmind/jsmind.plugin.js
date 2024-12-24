(function(){
    var jm = window.jsMind; 
    // plugin
    jm.plugin = function(name,init){
        this.name = name;
        this.init = init;
    };

    jm.plugins = [];

    jm.register_plugin = function(plugin){
        if(plugin instanceof jm.plugin){
            jm.plugins.push(plugin);
        }
    };

    jm.init_plugins = function(sender){
        window.setTimeout(function(){
            jm._init_plugins(sender);
        },0);
    };

    jm._init_plugins = function(sender){
        var l = jm.plugins.length;
        var fn_init = null;
        for(var i=0;i<l;i++){
            fn_init = jm.plugins[i].init;
            if(typeof fn_init === 'function'){
                fn_init(sender);
            }
        }
    };
})()