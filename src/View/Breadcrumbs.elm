module View.Breadcrumbs exposing (view)

import Html exposing (..)
import Html.Attributes exposing (style, class, href)
import View.Utils exposing (buildHash)

view : List String -> Html msg
view currentPath =
    let
        crumbStyle =
            [ style "display" "inline-flex"
            , style "align-items" "center"
            , style "padding" "0.5rem 1rem"
            , style "background-color" "white"
            , style "border" "1px solid #E5E7EB"
            , style "border-radius" "9999px"
            , style "color" "#374151"
            , style "text-decoration" "none"
            , style "font-size" "0.875rem"
            , style "font-weight" "500"
            , style "transition" "all 0.2s"
            , style "box-shadow" "0 1px 2px rgba(0,0,0,0.05)"
            , style "cursor" "pointer"
            ]

        separator =
            span [ class "material-symbols-outlined", style "color" "#9CA3AF", style "font-size" "1.25rem" ] 
                [ text "chevron_right" ]

        homeLink = 
            a (href "#/" :: crumbStyle)
                [ span [ class "material-symbols-outlined", style "font-size" "1.25rem" ] [ text "home" ]
                ]
        
        renderCrumb index name =
            let
                targetPath = List.take (index + 1) currentPath
                hash = buildHash targetPath
            in
            [ separator
            , a (href hash :: crumbStyle) [ text name ]
            ]
    in
    div [ style "margin-bottom" "1rem", style "display" "flex", style "align-items" "center", style "flex-wrap" "wrap", style "gap" "0.5rem" ]
        (homeLink :: List.concat (List.indexedMap renderCrumb currentPath))
