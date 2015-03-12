define(function(){
    return  "<div id=\"<%= id %>\" class=\"layer_control layer_button layer_element layer_app\">" +
        "    <div class=\"layer_column del_before\">" +
        "        <p><img src=\"<%= getAlternateParam(appIconPath, sysIconPath) %>\" alt=\"<%= name %>\" title=\"<%= name %>\" /><\/p>" +
        "        <h4><%= name %><\/h4>" +
        "    <\/div>" +
        "<\/div>";
});
