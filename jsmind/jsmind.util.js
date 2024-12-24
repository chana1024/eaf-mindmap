(function(){
    // ============= utility object =============================================
    var jm = window.jsMind;
    jm.util = {
        is_node: function(node){
            return !!node && node instanceof jm.node;
        },
        ajax:{
            _xhr:function(){
                var xhr = null;
                if(window.XMLHttpRequest){
                    xhr = new XMLHttpRequest();
                }else{
                    try{
                        xhr = new ActiveXObject('Microsoft.XMLHTTP');
                    }catch(e){}
                }
                return xhr;
            },
            _eurl:function(url){
                return encodeURIComponent(url);
            },
            request:function(url,param,method,callback,fail_callback){
                var a = jm.util.ajax;
                var p = null;
                var tmp_param = [];
                for(var k in param){
                    tmp_param.push(a._eurl(k)+'='+a._eurl(param[k]));
                }
                if(tmp_param.length>0){
                    p = tmp_param.join('&');
                }
                var xhr = a._xhr();
                if(!xhr){return;}
                xhr.onreadystatechange = function(){
                    if(xhr.readyState == 4){
                        if(xhr.status == 200 || xhr.status == 0){
                            if(typeof callback === 'function'){
                                var data = jm.util.json.string2json(xhr.responseText);
                                if(data != null){
                                    callback(data);
                                }else{
                                    callback(xhr.responseText);
                                }
                            }
                        }else{
                            if(typeof fail_callback === 'function'){
                                fail_callback(xhr);
                            }else{
                                logger.error('xhr request failed.',xhr);
                            }
                        }
                    }
                }
                method = method || 'GET';
                xhr.open(method,url,true);
                xhr.setRequestHeader('If-Modified-Since','0');
                if(method == 'POST'){
                    xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded;charset=utf-8');
                    xhr.send(p);
                }else{
                    xhr.send();
                }
            },
            get:function(url,callback){
                return jm.util.ajax.request(url,{},'GET',callback);
            },
            post:function(url,param,callback){
                return jm.util.ajax.request(url,param,'POST',callback);
            }
        },

        dom:{
            //target,eventType,handler
            add_event:function(t,e,h){
                if(!!t.addEventListener){
                    t.addEventListener(e,h,false);
                }else{
                    t.attachEvent('on'+e,h);
                }
            }
        },

        canvas:{
            bezierto: function(ctx,x1,y1,x2,y2){
                ctx.beginPath();
                ctx.moveTo(x1,y1);
                ctx.bezierCurveTo(x1+(x2-x1)*2/3,y1,x1,y2,x2,y2);
                ctx.stroke();
            },
            lineto : function(ctx,x1,y1,x2,y2){
                ctx.beginPath();
                ctx.moveTo(x1,y1);
                ctx.lineTo(x2,y2);
                ctx.stroke();
            },
            clear:function(ctx,x,y,w,h){
                ctx.clearRect(x,y,w,h);
            }
        },

        file:{
            read:function(file_data,fn_callback){
                var reader = new FileReader();
                reader.onload = function(){
                    if(typeof fn_callback === 'function'){
                        fn_callback(this.result, file_data.name);
                    }
                };
                reader.readAsText(file_data);
            },

            save:function(file_data, type, name) {
                var blob;
                if (typeof window.Blob === 'function') {
                    blob = new Blob([file_data], {type: type});
                } else {
                    var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;
                    var bb = new BlobBuilder();
                    bb.append(file_data);
                    blob = bb.getBlob(type);
                }
                if (navigator.msSaveBlob) {
                    navigator.msSaveBlob(blob, name);
                } else {
                    var URL = window.URL || window.webkitURL;
                    var bloburl = URL.createObjectURL(blob);
                    var anchor = $c('a');
                    if ('download' in anchor) {
                        anchor.style.visibility = 'hidden';
                        anchor.href = bloburl;
                        anchor.download = name;
                        $d.body.appendChild(anchor);
                        var evt = $d.createEvent('MouseEvents');
                        evt.initEvent('click', true, true);
                        anchor.dispatchEvent(evt);
                        $d.body.removeChild(anchor);
                    } else {
                        location.href = bloburl;
                    }
                }
            }
        },

        json:{
            json2string:function(json){
                if(!!JSON){
                    try{
                        var json_str = JSON.stringify(json);
                        return json_str;
                    }catch(e){
                        logger.warn(e);
                        logger.warn('can not convert to string');
                        return null;
                    }
                }
            },
            string2json:function(json_str){
                if(!!JSON){
                    try{
                        var json = JSON.parse(json_str);
                        return json;
                    }catch(e){
                        logger.warn(e);
                        logger.warn('can not parse to json');
                        return null;
                    }
                }
            },
            merge:function(b,a){
                for(var o in a){
                    if(o in b){
                        if(typeof b[o] === 'object' &&
                           Object.prototype.toString.call(b[o]).toLowerCase() == '[object object]' &&
                           !b[o].length){
                            jm.util.json.merge(b[o], a[o]);
                        }else{
                            b[o] = a[o];
                        }
                    }else{
                        b[o] = a[o];
                    }
                }
                return b;
            }
        },

        uuid:{
            newid:function(){
                return (new Date().getTime().toString(16)+Math.random().toString(16).substr(2)).substr(2,16);
            }
        },

        text:{
            is_empty:function(s){
                if(!s){return true;}
                return s.replace(/\s*/,'').length == 0;
            }
        }
    };

    jm.prototype={
        init : function(){
            if(this.inited){return;}
            this.inited = true;

            var opts = this.options;

            var opts_layout = {
                mode:opts.mode,
                hspace:opts.layout.hspace,
                vspace:opts.layout.vspace,
                pspace:opts.layout.pspace
            }
            var opts_view = {
                container:opts.container,
                support_html:opts.support_html,
                hmargin:opts.view.hmargin,
                vmargin:opts.view.vmargin,
                line_width:opts.view.line_width,
                line_color:opts.view.line_color
            };
            // create instance of function provider
            this.data = new jm.data_provider(this);
            this.layout = new jm.layout_provider(this, opts_layout);
            this.view = new jm.view_provider(this, opts_view);
            this.shortcut = new jm.shortcut_provider(this, opts.shortcut);

            this.data.init();
            this.layout.init();
            this.view.init();
            this.shortcut.init();

            this._event_bind();

            jm.init_plugins(this);
        },

        enable_edit:function(){
            this.options.editable = true;
        },

        disable_edit:function(){
            this.options.editable = false;
        },

        // call enable_event_handle('dblclick')
        // options are 'mousedown', 'click', 'dblclick'
        enable_event_handle: function(event_handle){
            this.options.default_event_handle['enable_'+event_handle+'_handle'] = true;
        },

        // call disable_event_handle('dblclick')
        // options are 'mousedown', 'click', 'dblclick'
        disable_event_handle: function(event_handle){
            this.options.default_event_handle['enable_'+event_handle+'_handle'] = false;
        },

        get_editable:function(){
            return this.options.editable;
        },

        set_theme:function(theme){
            var theme_old = this.options.theme;
            this.options.theme = (!!theme) ? theme : null;
            if(theme_old != this.options.theme){
                this.view.reset_theme();
                this.view.reset_custom_style();
            }
        },
        _event_bind:function(){
            this.view.add_event(this,'mousedown',this.mousedown_handle);
            this.view.add_event(this,'click',this.click_handle);
            this.view.add_event(this,'dblclick',this.dblclick_handle);
        },

        mousedown_handle:function(e){
            if (!this.options.default_event_handle['enable_mousedown_handle']) {
                return;
            }
            var element = e.target || event.srcElement;
            var nodeid = this.view.get_binded_nodeid(element);
            if(!!nodeid){
                this.select_node(nodeid);
            }else{
                this.select_clear();
            }
        },

        click_handle:function(e){
            if (!this.options.default_event_handle['enable_click_handle']) {
                return;
            }
            var element = e.target || event.srcElement;
            var isexpander = this.view.is_expander(element);
            if(isexpander){
                var nodeid = this.view.get_binded_nodeid(element);
                if(!!nodeid){
                    this.toggle_node(nodeid);
                }
            }
        },

        dblclick_handle:function(e){
            if (!this.options.default_event_handle['enable_dblclick_handle']) {
                return;
            }
            if(this.get_editable()){
                var element = e.target || event.srcElement;
                var nodeid = this.view.get_binded_nodeid(element);
                if(!!nodeid){
                    this.begin_edit(nodeid);
                }
            }
        },

        begin_edit:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return false;
                }else{
                    return this.begin_edit(the_node);
                }
            }
            if(this.get_editable()){
                this.view.edit_node_begin(node);
            }else{
                logger.error('fail, this mind map is not editable.');
                return;
            }
        },

        end_edit:function(){
            this.view.edit_node_end();
        },

        toggle_node:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return;
                }else{
                    return this.toggle_node(the_node);
                }
            }
            if(node.isroot){return;}
            this.view.save_location(node);
            this.layout.toggle_node(node);
            this.view.relayout();
            this.view.restore_location(node);
        },

        expand_node:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return;
                }else{
                    return this.expand_node(the_node);
                }
            }
            if(node.isroot){return;}
            this.view.save_location(node);
            this.layout.expand_node(node);
            this.view.relayout();
            this.view.restore_location(node);
        },

        collapse_node:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return;
                }else{
                    return this.collapse_node(the_node);
                }
            }
            if(node.isroot){return;}
            this.view.save_location(node);
            this.layout.collapse_node(node);
            this.view.relayout();
            this.view.restore_location(node);
        },

        expand_all:function(){
            this.layout.expand_all();
            this.view.relayout();
        },

        collapse_all:function(){
            this.layout.collapse_all();
            this.view.relayout();
        },

        expand_to_depth:function(depth){
            this.layout.expand_to_depth(depth);
            this.view.relayout();
        },

        _reset:function(){
            this.view.reset();
            this.layout.reset();
            this.data.reset();
        },

        _show:function(mind){
            var m = mind || jm.format.node_array.example;

            this.mind = this.data.load(m);
            if(!this.mind){
                logger.error('data.load error');
                return;
            }else{
                logger.debug('data.load ok');
            }

            this.view.load();
            logger.debug('view.load ok');

            this.layout.layout();
            logger.debug('layout.layout ok');

            this.view.show(true);
            logger.debug('view.show ok');

            this.invoke_event_handle(jm.event_type.show,{data:[mind]});
        },

        show : function(mind){
            this._reset();
            this._show(mind);
        },

        get_meta: function(){
            return {
                name : this.mind.name,
                author : this.mind.author,
                version : this.mind.version
            };
        },

        get_data: function(data_format){
            var df = data_format || 'node_tree';
            return this.data.get_data(df);
        },

        get_root:function(){
            return this.mind.root;
        },

        get_node:function(nodeid){
            return this.mind.get_node(nodeid);
        },

        add_node:function(parent_node, nodeid, topic, data){
            if(this.get_editable()){
                var node = this.mind.add_node(parent_node, nodeid, topic, data);
                if(!!node){
                    this.view.add_node(node);
                    this.layout.layout();
                    this.view.show(false);
                    this.view.reset_node_custom_style(node);
                    this.expand_node(parent_node);
                    this.invoke_event_handle(jm.event_type.edit,{evt:'add_node',data:[parent_node.id,nodeid,topic,data],node:nodeid});
                }
                return node;
            }else{
                logger.error('fail, this mind map is not editable');
                return null;
            }
        },

        insert_node_before:function(node_before, nodeid, topic, data){
            if(this.get_editable()){
                var beforeid = jm.util.is_node(node_before) ? node_before.id : node_before;
                var node = this.mind.insert_node_before(node_before, nodeid, topic, data);
                if(!!node){
                    this.view.add_node(node);
                    this.layout.layout();
                    this.view.show(false);
                    this.invoke_event_handle(jm.event_type.edit,{evt:'insert_node_before',data:[beforeid,nodeid,topic,data],node:nodeid});
                }
                return node;
            }else{
                logger.error('fail, this mind map is not editable');
                return null;
            }
        },

        insert_node_after:function(node_after, nodeid, topic, data){
            if(this.get_editable()){
                var afterid = jm.util.is_node(node_after) ? node_after.id : node_after;
                var node = this.mind.insert_node_after(node_after, nodeid, topic, data);
                if(!!node){
                    this.view.add_node(node);
                    this.layout.layout();
                    this.view.show(false);
                    this.invoke_event_handle(jm.event_type.edit,{evt:'insert_node_after',data:[afterid,nodeid,topic,data],node:nodeid});
                }
                return node;
            }else{
                logger.error('fail, this mind map is not editable');
                return null;
            }
        },

        remove_node:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return false;
                }else{
                    return this.remove_node(the_node);
                }
            }
            if(this.get_editable()){
                if(node.isroot){
                    logger.error('fail, can not remove root node');
                    return false;
                }
                var nodeid = node.id;
                var parentid = node.parent.id;
                var parent_node = this.get_node(parentid);
                this.view.save_location(parent_node);
                this.view.remove_node(node);
                this.mind.remove_node(node);
                this.layout.layout();
                this.view.show(false);
                this.view.restore_location(parent_node);
                this.invoke_event_handle(jm.event_type.edit,{evt:'remove_node',data:[nodeid],node:parentid});
                return true;
            }else{
                logger.error('fail, this mind map is not editable');
                return false;
            }
        },

        update_node:function(nodeid, topic){
            if(this.get_editable()){
                if(jm.util.text.is_empty(topic)){
                    logger.warn('fail, topic can not be empty');
                    return;
                }
                var node = this.get_node(nodeid);
                if(!!node){
                    if(node.topic === topic){
                        logger.info('nothing changed');
                        this.view.update_node(node);
                        return;
                    }
                    node.topic = topic;
                    this.view.update_node(node);
                    this.layout.layout();
                    this.view.show(false);
                    this.invoke_event_handle(jm.event_type.edit,{evt:'update_node',data:[nodeid,topic],node:nodeid});
                }
            }else{
                logger.error('fail, this mind map is not editable');
                return;
            }
        },

        move_node:function(nodeid, beforeid, parentid, direction){
            if(this.get_editable()){
                var node = this.mind.move_node(nodeid,beforeid,parentid,direction);
                if(!!node){
                    this.view.update_node(node);
                    this.layout.layout();
                    this.view.show(false);
                    this.invoke_event_handle(jm.event_type.edit,{evt:'move_node',data:[nodeid,beforeid,parentid,direction],node:nodeid});
                }
            }else{
                logger.error('fail, this mind map is not editable');
                return;
            }
        },

        select_node:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return;
                }else{
                    return this.select_node(the_node);
                }
            }
            if(!this.layout.is_visible(node)){
                return;
            }
            this.mind.selected = node;
            this.view.select_node(node);
        },

        get_selected_node:function(){
            if(!!this.mind){
                return this.mind.selected;
            }else{
                return null;
            }
        },

        select_clear:function(){
            if(!!this.mind){
                this.mind.selected = null;
                this.view.select_clear();
            }
        },

        is_node_visible:function(node){
            return this.layout.is_visible(node);
        },

        find_node_before:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return;
                }else{
                    return this.find_node_before(the_node);
                }
            }
            if(node.isroot){return null;}
            var n = null;
            if(node.parent.isroot){
                var c = node.parent.children;
                var prev = null;
                var ni = null;
                for(var i=0;i<c.length;i++){
                    ni = c[i];
                    if(node.direction === ni.direction){
                        if(node.id === ni.id){
                            n = prev;
                        }
                        prev = ni;
                    }
                }
            }else{
                n = this.mind.get_node_before(node);
            }
            return n;
        },

        find_node_after:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return;
                }else{
                    return this.find_node_after(the_node);
                }
            }
            if(node.isroot){return null;}
            var n = null;
            if(node.parent.isroot){
                var c = node.parent.children;
                var getthis = false;
                var ni = null;
                for(var i=0;i<c.length;i++){
                    ni = c[i];
                    if(node.direction === ni.direction){
                        if(getthis){
                            n = ni;
                            break;
                        }
                        if(node.id === ni.id){
                            getthis = true;
                        }
                    }
                }
            }else{
                n = this.mind.get_node_after(node);
            }
            return n;
        },

        set_node_color:function(nodeid, bgcolor, fgcolor){
            if(this.get_editable()){
                var node = this.mind.get_node(nodeid);
                if(!!node){
                    if(!!bgcolor){
                        node.data['background-color'] = bgcolor;
                    }
                    if(!!fgcolor){
                        node.data['foreground-color'] = fgcolor;
                    }
                    this.view.reset_node_custom_style(node);
                }
            }else{
                logger.error('fail, this mind map is not editable');
                return null;
            }
        },

        set_node_font_style:function(nodeid, size, weight, style){
            if(this.get_editable()){
                var node = this.mind.get_node(nodeid);
                if(!!node){
                    if(!!size){
                        node.data['font-size'] = size;
                    }
                    if(!!weight){
                        node.data['font-weight'] = weight;
                    }
                    if(!!style){
                        node.data['font-style'] = style;
                    }
                    this.view.reset_node_custom_style(node);
                    this.view.update_node(node);
                    this.layout.layout();
                    this.view.show(false);
                }
            }else{
                logger.error('fail, this mind map is not editable');
                return null;
            }
        },

        set_node_background_image:function(nodeid, image, width, height, rotation){
            if(this.get_editable()){
                var node = this.mind.get_node(nodeid);
                if(!!node){
                    if(!!image){
                        node.data['background-image'] = image;
                    }
                    if(!!width){
                        node.data['width'] = width;
                    }
                    if(!!height){
                        node.data['height'] = height;
                    }
                    if(!!rotation){
                        node.data['background-rotation'] = rotation;
                    }
                    this.view.reset_node_custom_style(node);
                    this.view.update_node(node);
                    this.layout.layout();
                    this.view.show(false);
                }
            }else{
                logger.error('fail, this mind map is not editable');
                return null;
            }
        },

        set_node_background_rotation:function(nodeid, rotation){
            if(this.get_editable()){
                var node = this.mind.get_node(nodeid);
                if(!!node){
                    if(!node.data['background-image']) {
                        logger.error('fail, only can change rotation angle of node with background image');
                        return null;
                    }
                    node.data['background-rotation'] = rotation;
                    this.view.reset_node_custom_style(node);
                    this.view.update_node(node);
                    this.layout.layout();
                    this.view.show(false);
                }
            }else{
                logger.error('fail, this mind map is not editable');
                return null;
            }
        },

        resize:function(){
            this.view.resize();
        },

        // callback(type ,data)
        add_event_listener:function(callback){
            if(typeof callback === 'function'){
                this.event_handles.push(callback);
            }
        },

        invoke_event_handle:function(type, data){
            var j = this;
            window.setTimeout(function(){
                j._invoke_event_handle(type,data);
            },0);
        },

        _invoke_event_handle:function(type,data){
            var l = this.event_handles.length;
            for(var i=0;i<l;i++){
                this.event_handles[i](type,data);
            }
        }

    };
})()