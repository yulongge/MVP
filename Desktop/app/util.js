/**
 * Created by Administrator on 2014/10/4.
 */
define(function(require, exports, module) {

    var config = require("app/config");

    var  NoFoundIdent = config.NoFoundIdent ;

    /*
     * 获取当前活动Layer
     * */
    exports.getActiveLayer = (function(){
        return function() {
            return $(".desktop_layers").find("#" + exports.getActiveLayerId());
        };
    })();


    /*
     * 切换到指定Id的Layer
     * */
    exports.setActiveLayer = (function(){
        return function(activeLayerId) {
            $(".desktop_bullets a[did=" + activeLayerId + "]").trigger("click");
        };
    })();

    /*
     * 获取所有Layer
     * */
    exports.getAllLayers = (function(){
        return function() {
            return $(".desktop_layers").find(".desktop_layer");
        };
    })();


    /*
     * 数组次序调整
     * */
    exports.arrayMoveIndex = (function(){
        return function (array, old_index, new_index) {
            if (new_index >= array.length) {
                var k = new_index - array.length;
                while ((k--) + 1) {
                    array.push(undefined);
                }
            }
            array.splice(new_index, 0, array.splice(old_index, 1)[0]);
        };
    })();

    /*
     * 获取所有图层中应用，包括应用，复合应用，文件夹，文件夹内应用，复合应用内应用
     * */
    exports.getLayersAppIds = (function(){
        return function() {
            var appIds = [];
            var layers = exports.getLayers();
            $.each(layers,function(i,layer){
                $.each(layer.data,function(i,app){
                    if(app.get("appType") == config.ElementType.Application){
                        appIds.push(app.get("appId"));
                    }
                    if(app.get("appType") == config.ElementType.Composite){
                        appIds.push(app.get("appId"));
                        app.get("compositeApps").each(function (compositeApp) {
                            appIds.push(compositeApp.get("appId"));
                        });
                    }
                    if(app.get("appType") == config.ElementType.Folder){
                        appIds.push(app.get("appId"));
                        app.get("folderApps").each(function (folderApp) {
                            appIds.push(folderApp.get("appId"));
                        });
                    }
                });
            });
            return appIds;
        };
    })();
    /*
    * 加入css/js文件
    * */
    exports.importCssOrJs = (function(){
      return function(url,isImport){
          var skinUrl = require.resolve(url);
          var cssLinks = document.getElementsByTagName("link");
          for(var i = 0;i<cssLinks.length;i++){
              var link = cssLinks[i];
              if(link.href == skinUrl){
                  //link.parentNode.removeChild(link);
                  if(isImport){
                      link.disabled = false;
                  }else{
                      link.disabled = true;
                  }
                  break;
              }
          }

      };
    })();

    /*
    * 获取指定桌面上所有应用APPID
    * */
    exports.getLayerApplicationAppIds = (function(){
        return function(layerId) {
            var appIds = [];
            var layers = exports.getLayers();
            $.each(layers,function(i,layer){
                $.each(layer.data,function(i,app){
                    if(app.get("appType") == config.ElementType.Application && layerId == layer.id){
                        appIds.push(app.get("appId"));
                    }
                });
            });
            return appIds;
        };
    })();



    /*
     * 获取所有元素信息
     * */
    exports.getLayers = (function(){
        return function($container) {
            if($container == undefined)
                $container = $("body");

            var layers = [];
            var $layers = $container.find("div.desktop_main div.desktop_layers .desktop_layer");
            $layers.each(function(i){
                var $layer = $(this);
                var layerId = $layer.attr("id");

                var layer = {
                    id:layerId,
                    data:[]
                };

                //桌面的所有应用
                var $applications =  $layer.children(".desktop_layer_row").children(".layer_app");
                $applications.each(function(){
                    var $application = $(this);
                    var appData = $application.data("data");
                    layer.data.push(appData)
                });

                //桌面的所有复合应用
                var $composites = $layer.children(".desktop_layer_row").children(".layer_composite");
                $composites.each(function(){
                    var $composite = $(this);
                    var compositeData = $composite.data("data");
                    layer.data.push(compositeData)
                });

                //桌面的所有文件夹
                var $folderMaxs = $layer.children(".layer_folder");
                var $folderMins = $layer.children(".desktop_layer_row").children(".layer_minfolder");

                $folderMaxs.each(function(){
                    var $folder = $(this);
                    var folderData = $folder.data("data");
                    layer.data.push(folderData)
                });
                $folderMins.each(function(){
                    var $folder = $(this);
                    var folderData = $folder.data("data");
                    layer.data.push(folderData)
                });

                layers.push(layer);
            });
            return layers;
        };
    })();



    /*
     * 切换到指定Id的Layer
     * */
    exports.getAppInWhichLayer = (function(){
        return function(appId) {
            var layerId = NoFoundIdent;
            exports.getAllLayers().each(function(i,v){
                $(v).find(".layer_element").each(function(j,e){
                        var data = $(e).data("data");
                        if(data.get("appId")==appId){
                            layerId = $(v).attr("id");
                        }
                 })
            });
            return layerId;
        };
    })();

    /*
     * 根据APPID获取元素ID
     * */
    exports.findElementIdByAppId = (function(){
        return function(appId) {
            var id = NoFoundIdent;
            exports.getAllLayers().find(".layer_element").each(function(i,v){
                var data = $(v).data("data");
                if(data.get("appId")==appId){
                    id = data.get("id");
                }
            });
            return id;
        };
    })();

    /*
     * 获取当前活动Layer ID
     * */
    exports.getActiveLayerId = (function(){
        return function() {
            return $(".desktop_bullets").find(".p_active").attr("did");
        };
    })();

    /*
     * 闪烁指定元素ID对象
     * */
    exports.shineElement = (function(){
        return function(id) {
            var maxNum = 3;
            var currNum = 0;
            var continueFun = function(){
                currNum = currNum + 1;
                return currNum < maxNum;
            };
            var runnFun = function(){
                var $element = $("#" + id);
                $element.animate({'opacity':0.3},300,function(){
                    $element.animate({'opacity':1},300,function(){
                        if(continueFun())
                            runnFun();
                    });
                });
            };
            runnFun();
        };
    })();

    /*
     * 获取ID
     * */
    exports.getNewId = (function(){
        var lenght = 10;
        var prefix = "GUID";
        return function(){
            return prefix + exports.generateMixed(lenght);
        };
    })();

    /*
     * 获取ID
     * */
    exports.inputCheck = (function(){
        return function(txt){
            txt = txt+"";
            txt = txt.replace(/[\\,/,',\"]/g,"");
            txt = $("<div/>").html(txt).text();
            return txt;
        };
    })();

    /*
     * 生成随机序列
     * */
    exports.generateMixed = (function(){
        var chars=['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        return function(n) {
            var res = "";
            for (var i = 0; i < n; i++) {
                var id = Math.ceil(Math.random() * 35);
                res += chars[id];
            }
            return res;
        };
    })();


    /*
     * 定位工具
     * */
    exports.postion = (function(){
        /*
         * 位置常量
         * */
        var PositionParam = {
            //屏幕尺寸
            Screen: {
                Width : 0,
                Height : 0,
                WidthPadding : 0,
                HeightPadding : 0
            },
            //元素尺寸
            Element:{
                Width: 64,
                Height:94
            },
            //文件夹最小尺寸
            Folder:{
                Width: 240,
                Height:220,
                MarginTop:28,
                MarginBottom:50
            },
            FolderBig:{
                Width: 300,
                Height:275,
                MarginTop:28,
                MarginBottom:50
            },
            Widget:{
                Width: 400,
                Height:300,
                MarginTop:28,
                MarginBottom:50
            },
            WidgetInit:{
                top:35,
                left:35,
                isStartToAdd:true
            },
            //应用中心尺寸
            AppStoreSize:{
                Height:400,
                Width:750,
                TitleHeight:36
            },
            AppStoreNormalSize:{
                Height:400,
                Width:750,
                TitleHeight:36
            },
            AppStoreBigSize:{
                Height:500,
                Width:937,
                TitleHeight:44
            },
            //复合应用尺寸
            CompositeAppSize:{
                Width:660,
                Height:370
            },
            CompositeAppBigSize:{
                Width:825,
                Height:462
            },
            CompositeAppNormalSize:{
                Width:660,
                Height:370
            },
            //确认对话框尺寸
            WarnMessageSize:{
                Width:420,
                Height:230
            },
            WarnMessageBigSize:{
                Width:525,
                Height:287
            },
            WarnMessageNormalSize:{
                Width:420,
                Height:230
            },
            //排序列信息
            SortableColumn:{
                ElementCount:0,
                Width:0,
                Height:0,
                Top:0,
                Left:0
            },
            //文件夹排序坐标
            FolderPosition:{
                Top:35,
                Left:0,
                Width:100,
                Height:100,
                MarginSize:10
            },
            IsAppStoreGuid:true,
            GuidStep1:{
                Width:483,
                Height:183
            },
            GuidStep2:{
                Width:480,
                Height:188
            },
            Guid:{
                Width:500,
                Height:267
            }
        };

        var screenHeight = screen.height;
        var screenWidth = screen.width;
        PositionParam.Screen.Width = screenWidth;
        PositionParam.Screen.Height = screenHeight;
        PositionParam.Screen.WidthPadding = 25;
        PositionParam.Screen.HeightPadding = 60;

        //元素尺寸，目前是定值，因为元素样式并未按配置去写
        PositionParam.Element.Width = 64;
        PositionParam.Element.Height = 94;

        //文件夹尺寸
        PositionParam.Folder.Width = 240;
        PositionParam.Folder.Height = 135;

        //排序列尺寸计算
        PositionParam.SortableColumn.Top = PositionParam.Screen.HeightPadding;
        PositionParam.SortableColumn.Left = PositionParam.Screen.WidthPadding;
        PositionParam.SortableColumn.Width = PositionParam.Element.Width + 10;
        PositionParam.SortableColumn.Height = PositionParam.Screen.Height - 2 * PositionParam.Screen.HeightPadding;
        PositionParam.SortableColumn.ElementCount = Math.floor((PositionParam.SortableColumn.Height - 30) / PositionParam.Element.Height);

        if(screenWidth <= 800){
            PositionParam.AppStoreSize.Width = 600;
            PositionParam.AppStoreSize.Height = 350;
        }else if(screenWidth <= 960 && screenWidth > 800){
            PositionParam.AppStoreSize.Width = 600;
            PositionParam.AppStoreSize.Height = 350;
        }else if(screenWidth <= 1024 && screenWidth > 960){
            PositionParam.AppStoreSize.Width = 750;
            PositionParam.AppStoreSize.Height = 450;
        }else {
            PositionParam.AppStoreSize.Width = 750;
            PositionParam.AppStoreSize.Height = 450;
        }
        PositionParam.CompositeAppSize.Width = 660;
        PositionParam.CompositeAppSize.Height = 370;

        return {
            Param : PositionParam,
            /*
             * 边界检测
             * */
            checkBoundary:function(toPos,option){
                var clientWidth = PositionParam.Screen.Width;//桌面宽度
                var clientHeight = PositionParam.Screen.Height;//桌面高度

                var marginLeft = (option && option.left) ? option.left : PositionParam.Screen.WidthPadding;
                var marginRight = (option && option.right) ? option.right :  PositionParam.Screen.WidthPadding;
                var marginTop = (option && option.top) ? option.top : PositionParam.Screen.HeightPadding;
                var marginBottom = (option && option.bottom) ? option.bottom :  PositionParam.Screen.HeightPadding;

                if (toPos.top < marginTop) {
                    toPos.top = marginTop;
                }
                if (toPos.left < marginLeft) {
                    toPos.left = marginLeft;
                }
                if (toPos.top > clientHeight - marginBottom - toPos.height) {
                    toPos.top = clientHeight - marginBottom - toPos.height;
                }
                if (toPos.left > clientWidth - marginRight - toPos.width) {
                    toPos.left = clientWidth - marginRight - toPos.width;
                }

                return toPos;
            }
        };
    })();


});