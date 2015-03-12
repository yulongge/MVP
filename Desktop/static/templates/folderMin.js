/**
 * Created by Administrator on 2014/10/14.
 */
define(function() {
    var folderMin = '<div title="<%=name%>" id="<%= id %>" class="layer_control layer_button layer_element FolderMin layer_minfolder" style="cursor:pointer;position:absolute">';
    folderMin += '<div class="layer_column layer_min del_before">';
    folderMin += '<div class="FolderBox"></div>';
    folderMin += '<h4><%= name %></h4>';
    folderMin += '</div>';
    folderMin += '</div>';
    return folderMin;
});