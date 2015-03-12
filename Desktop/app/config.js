/**
 * Created by Administrator on 2014/10/12.
 */
define(function(require, exports, module) {

    //此方法拷贝过来，避免config引用util的问题
      var getNewId = function() {
            var chars=['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
            var res = "";
            for (var i = 0; i < 20; i++) {
                var id = Math.ceil(Math.random() * 35);
                res += chars[id];
            }
            return res;
        };

    return {
        //当前布局
        CurrentLayoutType: "Grid",
        //布局常量
        LayoutType: {
            Grid:"Grid",
            Free:"Free"
        },

        //是否初始化结束，为了初始化时不触发数据变更时通知桌面保存配置事件
        IsInitFinish : false,

        //是否初始化默认桌面
        IsConfigDefaultDesktop: false,
        //是否已加载，避免重复加载的
        IsLoaded : false,

        //拖拽跨屏幕
        OverLayer:{
            //元素是否移动
            IsELementMoving:false,
            //是否移动图层
            IsToOtherLayer:false,
            //拖拽UI
            DragOverUi:null,
            //退拽源
            DragOverOrigin:null,
            //拖拽锚定
            DragOverAnchor:null
        },


        /*===============事件常量================*/
        //隐藏桌面所有事件
        HideDesktopPopThings: getNewId(),
        //整理桌面事件
        TidyDesktopEvent:  getNewId(),
        //整理元素事件
        TidyElmentsEvent:  getNewId(),
        //整理文件夹
        TidyFloatsEvent:  getNewId(),
        //创建新图层事件
        CreateNewLayerEvent:  getNewId(),
        //创建图层事件
        CreateLayerEvent: getNewId(),
        //移除图层事件
        RemoveLayerEvent: getNewId(),
        //改变桌面次序
        SetLayerIndex: getNewId(),
        //移除图层回调事件
        RemoveLayerCallBack:  getNewId(),
        //桌面移除元素事件
        RemoveDesktopElementEvent:  getNewId(),
        //桌面创建应用事件
        CreateDesktopElementEvent:  getNewId(),
        //隐藏弹出文件夹事件
        RemovePopFolderEvent:  getNewId(),
        //移除文件夹中应用应用事件
        RemoveFolderAppEvent:  getNewId(),
        //添加文件夹应用事件
        AddFolderAppEvent: getNewId() ,
        //移除最大化的文件夹事件
        RemoveDesktopFloatEvent:  getNewId(),
        //创建文件夹事件
        CreateDesktopFloatEvent: getNewId(),
        //按业务分组桌面事件
        GroupAppToFolderEvent:  getNewId(),
        //应用中心翻页事件
        AppStorePageEvent:  getNewId(),
        //应用中心点击更多事件
        AppStoreNeedMoreEvent:  getNewId(),
        //应用系统添加
        StoreSystemAddEvent:  getNewId(),
        //业务域添加
        StoreFieldAddEvent: getNewId(),
        //重置系统事件
        ResetStoreSystemsEvent:  getNewId(),
        //重置业务域事件
        ResetStoreFieldsEvent: getNewId(),
        //翻页响应后增加应用事件
        StorePagingAddAppEvent:  getNewId(),
        //重置分页容器事件
        RestStorePagingEvent:  getNewId(),
        //搜索响应后增加结果事件
        StoreSearchAddAppEvent: getNewId(),
        //复合应用搜索响应后增加结果事件
        ComSearchAddAppEvent: getNewId(),
        //重置搜索结果
        RestStoreSearchEvent: getNewId(),
        //应用类型添加事件
        StoreTypeAddEvent:  getNewId(),
        //重置应用类型事件
        ResetStoreTypesEvent:  getNewId(),
        //打开应用中心事件
        OpenAppStoreEvent:  getNewId(),
        //销毁应用中心对应视图事件
        DestroyStoreContainerEvent:  getNewId(),
        //销毁应用中心对应视图事件
        DestroyStoreListEvent:  getNewId(),
        //销毁应用中心对应视图事件
        DestroyStoreSystemEvent:  getNewId(),
        //销毁应用中心对应视图事件
        DestroyStoreTypeEvent:  getNewId(),
        //打开复合应用事件
        OpenCompositeEvent: getNewId(),
        //编辑复合应用事件
        OpenEditCompositeEvent: getNewId(),
        //销毁复合应用视图事件
        DestroyCompositeViewEvent: getNewId(),
        //重置复合应用列表事件
        ResetCompositeAppEvent: getNewId(),
        //保存事件
        SaveAdapterEvent: getNewId(),
        //桌面已经变换事件
        DesktopIsChangedEvent: getNewId(),
        //桌面保存事件
        DesktopConfigSaveEvent:getNewId(),
        //置顶元素事件
        ToAllElementTopEvent:getNewId(),
        //重置排序列事件
        ResetSortableCellEvent:getNewId(),
        //信息提示框事件
        ShowWarnMessageEvent:getNewId(),
        //桌面自定义
        ChangeDesktopSkin:getNewId(),
        //选择系统
        SelectSystem:getNewId(),
        //初始化向导
        InitGuid:getNewId(),
        /*===============MVP兼容常量================*/

        WebDesk: "WebDes",
        //设置配置常量
        SetConfig: "Aostar.MVP.Client.DesktopModule.SetConfig",
        //加载配置常量
        LoadConfig:"Aostar.MVP.Client.DesktopModule.GetConfig",
        //加载配置常量回调
        LoadConfigCallBack:"backAostar.MVP.Client.DesktopModule.GetConfig",
        //获取业务域列表
        GetFields: "Aostar.MVP.Client.DesktopModule.GetFields",
        //获取业务域列表回调
        GetFieldsCallBack: "backAostar.MVP.Client.DesktopModule.GetFields",
        //获取所有系统
        GetSystems: "Aostar.MVP.Client.DesktopModule.GetSystems",
        //获取所有系统回调
        GetSystemsCallBack: "backAostar.MVP.Client.DesktopModule.GetSystems",
        //获取系统列表
        GetSystemsByFieldId: "Aostar.MVP.Client.DesktopModule.GetSystemsByFieldID",
        //获取系统列表回调
        GetSystemsByFieldIdCallBack: "backAostar.MVP.Client.DesktopModule.GetSystemsByFieldID",
        //获取指定业务域下应用
        GetAppsByFieldId:"Aostar.MVP.Client.DesktopModule.GetAppsByFieldID",
        //获取指定业务域下应用回调
        GetAppsByFieldIdCallBack:"backAostar.MVP.Client.DesktopModule.GetAppsByFieldID",
        //获取指定系统下应用
        GetAppsBySystemId:"Aostar.MVP.Client.DesktopModule.GetAppsBySystemID",
        //获取指定系统下应用回调
        GetAppsBySystemIdCallBack:"backAostar.MVP.Client.DesktopModule.GetAppsBySystemID",
        //搜索指定业务域下应用
        SearchAppsByKey: "Aostar.MVP.Client.DesktopModule.SearchAppsByKey2",
        //搜索指定业务域下应用回调
        SearchAppsByKeyCallBack: "backAostar.MVP.Client.DesktopModule.SearchAppsByKey2",
        //获取应用类型
        GetStoreType: "Aostar.MVP.Client.DesktopModule.GetStoreType",
        //获取应用回调
        GetStoreTypeCallBack: "backAostar.MVP.Client.DesktopModule.GetStoreType",
        //撤销登录常常量
        LogoutApp:  "Aostar.MVP.Client.DesktopModule.LogoutApp",
        //打开应用常量
        OpenApp: "Aostar.MVP.Client.DesktopModule.OpenApp",

        //自定义桌面
        DefinedSkin:"Aostar.MVP.Client.DesktopModule.GetBackground",
        DefinedSkinCallBack:"backAostar.MVP.Client.DesktopModule.GetBackground",

        //添加本地应用程序
        AddClientApp:"Aostar.MVP.Client.DesktopModule.AddClientApp",
        AddClientAppCallBack:"backAostar.MVP.Client.DesktopModule.AddClientApp",

        //桌面向导
        GuidGetData:"Aostar.MVP.Client.DesktopModule.GetBigDataInfo",
        GuidGetDataCallBack:"backAostar.MVP.Client.DesktopModule.GetBigDataInfo",

        GuidSender:"Aostar.MVP.Client.DesktopModule.Started",

        /*收藏夹*/
        FavoriteAppCallBack:"backAostar.MVP.Client.DesktopModule.AddApp",
        //获取用户登录类型,这个木有回调
        GetLoginType: "Aostar.MVP.Client.DesktopModule.GetLoginType",

        //改变页面主题大小
        ChangeSize:"Aostar.MVP.Client.DesktopModule.SetDisplay",
        ChangeSizeCallBack:"backAostar.MVP.Client.DesktopModule.SetDisplay",

        /*==================桌面常量================*/
        //读取到的配置文件版本
        ConfigVersion : "",
        //应用默认图标
        AppDefaultIcon:"static/images/desktop_app_icongjhz.png",
        //文件夹类型常量，状态最大化
        FolderType_MAX:"max",
        //文件夹类型常量，状态最小化
        FolderType_MIN:"min",
        //文件夹布局常量，表格结构
        FolderLayout_Grid:"grid",
        //文件夹布局常量，列表结构
        FolderLayout_List:"list",
        //是否有业务系统文件夹
        isHaveBusinessSystem:false,
        //是否有业务应用文件夹
        isHaveBusinessApp:false,

        //否是收缩文件夹
        isFolderTypeChange:false,

        eidtClientApp:null,

        //收藏夹APPID
        FavoriteFolderAppId: "DEB6A663-2AA5-4412-915B-338282B7C2EF",
        //默认系统文件夹
        DefautlFolderAppId: "185D8F06-5F01-4984-B05D-32C99AEE0255",

        NoFoundIdent :  "***NoFound***",

        //所有业务域
        AllSystems:[],


        //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
        ElementType:{
            Application:0,
            Widget:1,
            Index:2,
            Folder:5,
            Composite:6
        },

        //第三方
        ThirdPartySystem: "third",

        //用户登录类型MVP
        UserLoginType_MVP:"mvp",

        //应用中心组件类型
        StoreElementType:[
            {"id":"appStoreType10001","name":"应用","typenum":0,"isSelected":true},
            //{"id":"appStoreType10003","name":"指标","typenum":2,"isSelected":false},
            {"id":"appStoreType10003","name":"复合应用","typenum":6,"isSelected":false},
            {"id":"appStoreType10002","name":"组件","typenum":1,"isSelected":false}],


        //每页大小
        PageHelper: {
            PageSize: 50,
            PageIndex: 1,
            SearchKey: "",
            SystemId: "",
            FieldId: "",
            AppType: 0,
            Type:"" //Search,ListSystem,ListField
        },

        //复合应用默认图标
        CompositeIcons: [
            {"id":"compositeIcon1","iconPath":"static/images/desktop_apply_icon01.png"},
            {"id":"compositeIcon2","iconPath":"static/images/desktop_apply_icon02.png"},
            {"id":"compositeIcon3","iconPath":"static/images/desktop_apply_icon03.png"},
            {"id":"compositeIcon4","iconPath":"static/images/desktop_apply_icon04.png"},
            {"id":"compositeIcon5","iconPath":"static/images/desktop_apply_icon05.png"},
            {"id":"compositeIcon6","iconPath":"static/images/desktop_apply_icon06.png"},
            {"id":"compositeIcon7","iconPath":"static/images/desktop_apply_icon07.png"},
            {"id":"compositeIcon8","iconPath":"static/images/desktop_apply_icon08.png"},
            {"id":"compositeIcon9","iconPath":"static/images/desktop_apply_icon09.png"},
            {"id":"compositeIcon10","iconPath":"static/images/desktop_apply_icon10.png"},
            {"id":"compositeIcon11","iconPath":"static/images/desktop_apply_icon11.png"},
            {"id":"compositeIcon12","iconPath":"static/images/desktop_apply_icon12.png"},
            {"id":"compositeIcon13","iconPath":"static/images/desktop_apply_icon13.png"},
            {"id":"compositeIcon14","iconPath":"static/images/desktop_apply_icon14.png"},
            {"id":"compositeIcon15","iconPath":"static/images/desktop_apply_icon15.png"},
            {"id":"compositeIcon16","iconPath":"static/images/desktop_apply_icon16.png"},
            {"id":"compositeIcon17","iconPath":"static/images/desktop_apply_icon17.png"},
            {"id":"compositeIcon18","iconPath":"static/images/desktop_apply_icon18.png"},
            {"id":"compositeIcon19","iconPath":"static/images/desktop_app_icon01.png"},
            {"id":"compositeIcon20","iconPath":"static/images/desktop_app_icon02.png"},
            {"id":"compositeIcon21","iconPath":"static/images/desktop_app_icon03.png"},
            {"id":"compositeIcon22","iconPath":"static/images/desktop_app_icon04.png"},
            {"id":"compositeIcon23","iconPath":"static/images/desktop_app_icon05.png"},
            {"id":"compositeIcon24","iconPath":"static/images/desktop_app_icon06.png"},
            {"id":"compositeIcon25","iconPath":"static/images/desktop_app_icon07.png"}
        ],

        //主题风格配置
        //DefinedSkinStyle:[],
        //addClientAppData:[],
        ThemeStyle:[{
            "name":"极光",
            "data":"all",
            "bgUrl":"static/images/desktop_bg_all.jpg"
        },{
            "name":"雪峰",
            "data":"17",
            "bgUrl":"static/images/desktop_bg_17.jpg"
        },{
            "name":"水墨",
            "data":"14",
            "bgUrl":"static/images/desktop_bg_14.jpg"
        },{
            "name":"炫蓝",
            "data":"28",
            "bgUrl":"static/images/desktop_bg_28.jpg"
        },{
            "name":"云海",
            "data":"16",
            "bgUrl":"static/images/desktop_bg_16.jpg"
        },{
            "name":"春意",
            "data":"21",
            "bgUrl":"static/images/desktop_bg_21.jpg"
        },{
            "name":"夏荷",
            "data":"19",
            "bgUrl":"static/images/desktop_bg_19.jpg"
        },{
            "name":"一叶",
            "data":"24",
            "bgUrl":"static/images/desktop_bg_24.jpg"
        },{
            "name":"生机",
            "data":"15",
            "bgUrl":"static/images/desktop_bg_15.jpg"
        },{
            "name":"梦呓",
            "data":"22",
            "bgUrl":"static/images/desktop_bg_22.jpg"
        },{
            "name":"自定义桌面",
            "data":"userDefined",
            "bgUrl":"static/images/desktop_popmenu_skin.png",
            "Stretch":"center"
        }]

    };
});