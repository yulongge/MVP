/**
 * Created by Administrator on 2014/9/30.
 */
define(function(require, exports, module){

    seajs.log("加载全局模块");

    // 加载全局模块
    var $ = require('jquery');
    require('jquery-ui');
    var Backbone = require('backbone');
    var _ = require('underscore');
    require('underscore-templatehelpers');
    var PubSub = require('pubsubjs');
    require('highlightRegex');
    require('jquerySimulate');

    seajs.log("暴露到全局");
    // 暴露到全局
    window.$ = window.jQuery = $;
    window.Backbone = Backbone;
    window.PubSub = PubSub;
    window._ = _;

    //异常立即抛出，如果考虑分发事件中失败跳过，请设置为false
    PubSub.immediateExceptions = false;

    //异常统一处理
    $(window).error(function(msg){
        seajs.log(msg);
    });

    //扩展模板方法
    _.addTemplateHelpers({
        getAlternateParam : function( param1, param2) {
            return param1 && param1!="" ? param1 : param2;
        }
    });

    $(document).ready(function(){
        seajs.log("加载桌面逻辑");
        require("desktopService").init();
        require("appStoreService").init();
        require("compositeAppService").init();
    });
});