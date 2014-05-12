/*jshint browser:true*/
/*jslint browser:true */
/*global $: false, jQuery: false */

(function ($) {

    "use strict";

    var count = 0,
        oldMessage;

    window.debug = {
        log: function (message, isError) {
            //if (window.location.hostname === 'localhost') {
            var oldContainer = $(".console div:first"),
                counter = oldContainer.find(".count");

            if (!oldContainer.length || message != oldMessage) {
                oldMessage = message;
                count = 1;

                $("<div" + (isError ? " class='error'" : "") + "/>")
                    .css({
                        marginTop: -24,
                        backgroundColor: isError ? "#ffbbbb" : "#bbddff"
                    })
                    .html(message)
                    .prependTo(".console")
                    .animate({ marginTop: 0 }, 300)
                    .animate({ backgroundColor: isError ? "#ffdddd" : "#ffffff" }, 800);
            } else {
                count++;

                if (counter.length) {
                    counter.html(count);
                } else {
                    oldContainer.html(oldMessage)
                        .append("<span class='count'>" + count + "</span>");
                }
            }
            //}
        },

        error: function (message) {
            this.log(message, true);
        }
    };
})(jQuery);

/*
 * jQuery Color Animations
 * Copyright 2007 John Resig
 * Released under the MIT and GPL licenses.
 */

(function ($) {

    // We override the animation for all of these color styles
    $.each(["backgroundColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "borderTopColor", "color", "outlineColor"], function (i, attr) {
        $.fx.step[attr] = function (fx) {
            if (fx.state == 0 || typeof fx.end == typeof "") {
                fx.start = getColor(fx.elem, attr);
                fx.end = getRGB(fx.end);
            }

            fx.elem.style[attr] = ["rgb(", [
                Math.max(Math.min(parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0]), 255), 0),
                Math.max(Math.min(parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1]), 255), 0),
                Math.max(Math.min(parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2]), 255), 0)
            ].join(","), ")"].join("");
        }
    });

    // Color Conversion functions from highlightFade
    // By Blair Mitchelmore
    // http://jquery.offput.ca/highlightFade/

    // Parse strings looking for color tuples [255,255,255]
    function getRGB(color) {
        var result;

        // Check if we're already dealing with an array of colors
        if (color && color.constructor == Array && color.length == 3)
            return color;

        // Look for rgb(num,num,num)
        if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))

            return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];

        // Look for #a0b1c2
        if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))
            return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];

        // Otherwise, we're most likely dealing with a named color
        return colors[$.trim(color).toLowerCase()];
    }

    function getColor(elem, attr) {
        var color;

        do {
            color = $.css(elem, attr);

            // Keep going until we find an element that has color, or we hit the body
            if (color != "" && color != "transparent" || $.nodeName(elem, "body"))
                break;

            attr = "backgroundColor";
        } while (elem = elem.parentNode);

        return getRGB(color);
    }

    var href = window.location.href;
    if (href.indexOf("culture") > -1) {
        $("#culture").val(href.replace(/(.*)culture=([^&]*)/, "$2"));
    }

    $("#culture").change(onlocalizationchange);

    function onlocalizationchange() {
        var value = $(this).val();
        var href = window.location.href;
        if (href.indexOf("culture") > -1) {
            href = href.replace(/culture=([^&]*)/, "culture=" + value);
        } else {
            href += href.indexOf("?") > -1 ? "&culture=" + value : "?culture=" + value;
        }
        window.location.href = href;
    }
})(jQuery);
