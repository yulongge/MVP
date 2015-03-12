/**
 * Created by Administrator on 2014/10/16.
 */
define(function() {

    return '<div class="FolderBigBox  g_file" style="width:<%= Dwidth%>;height:<%= Dheight%>;position:absolute;left:<%= Dleft%>;' +
        'top:<%= Dtop%>;">' +
        '<a style="width: 16px; height: 13px; background: <%= imageName %> no-repeat; display: block; position: absolute; top: <%= Atop %>; left: <%= Aleft %>;" href="javascript:void(0)"></a>' +
        '<div class="title" style="">' +
        '<div class="min_folder_swicth" style="" title="列表">' +
        '<img src="static/images/desktop_folder_list1.png"/></div>' +
        '<div class="min_folder_max" style="" title="展开">' +
        '<img src="static/images/desktop_folder_icon3.png"/></div>' +
        '<div class="titleZC" style="">' +
        '<%= name %>' +
        '</div>' +
        '</div><div class="list_box"></div>' +
        '</div>';
});