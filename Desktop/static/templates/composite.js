define(function(){
    return  "<div id=\"<%= id %>\" class=\"layer_control layer_button layer_element layer_composite\">" +
        "    <div class=\"layer_column del_before\">" +
        "        <p><img class=\"composite_icon\" src=\"<%= appIconPath %>\" alt=\"<%= name %>\" title=\"<%= name %>\" /><\/p>" +
        "        <h4 class=\"composite_name\"><%= name %><\/h4>" +
        "       <span class=\"sign\"></span>" +
        "    <\/div>" +
        "<\/div>";
});
