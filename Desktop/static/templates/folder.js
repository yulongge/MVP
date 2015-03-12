/**
 * Created by Administrator on 2014/10/13.
 */
define(function() {
    var folderstr = '<div id="<%= id %>" class="g_file layer_element FolderMax layer_folder" style="position: absolute;">';
    folderstr += '<div class="title del_before" style="text-align:left"><div class="showway" style="z-index: 100" title="列表"><img src="static/images/desktop_folder_list1.png"/></div><div class="buts" style="z-index: 100" ><a href="javascript:void(0)" class="pack_up" title="收起"></a></div><div class="btn_lock"><a href="javascript:void(0)" class="lock" title="锁"></a></div><input type="text" class="text_name"  value="<%= name %>"/>';
    folderstr += '<div class="titleZC" style="width:150px;height:32px;position:absolute;top:0px;margin-left: 10px;line-height: 25px;"><a href="javascript:void(0)" title="<%= name %>" style="width:105px;height:32px;position:absolute;top:0px;margin-left: 10px;line-height: 25px;"></a></div>';
    folderstr += '</div>';
    folderstr += '<div class="list_box">';
    folderstr += '</div>';
    folderstr += '</div>';
    return folderstr;
});