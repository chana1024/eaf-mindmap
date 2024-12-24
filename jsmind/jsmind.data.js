(function(){
    // ============= data provider =============================================

    var jm = window.jsMind;
    jm.data_provider = function(jm){
        this.jm = jm;
    };

    jm.data_provider.prototype={
        init:function(){
            logger.debug('data.init');
        },

        reset:function(){
            logger.debug('data.reset');
        },

        load:function(mind_data){
            var df = null;
            var mind = null;
            if(typeof mind_data === 'object'){
                if(!!mind_data.format){
                    df = mind_data.format;
                }else{
                    df = 'node_tree';
                }
            }else{
                df = 'freemind';
            }

            if(df == 'node_array'){
                mind = jm.format.node_array.get_mind(mind_data);
            }else if(df == 'node_tree'){
                mind = jm.format.node_tree.get_mind(mind_data);
            }else if(df == 'freemind'){
                mind = jm.format.freemind.get_mind(mind_data);
            }else{
                logger.warn('unsupported format');
            }
            return mind;
        },

        get_data:function(data_format){
            var data = null;
            if(data_format == 'node_array'){
                data = jm.format.node_array.get_data(this.jm.mind);
            }else if(data_format == 'node_tree'){
                data = jm.format.node_tree.get_data(this.jm.mind);
            }else if(data_format == 'freemind'){
                data = jm.format.freemind.get_data(this.jm.mind);
            }else{
                logger.error('unsupported '+data_format+' format');
            }
            return data;
        },
    };

})()