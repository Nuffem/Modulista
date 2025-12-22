module View.Header exposing (view)

import Html exposing (..)
import Html.Attributes exposing (style, src, alt, class)

view : Html msg
view =
    header
        [ style "background-color" "#2563EB" -- Royal Blue
        , style "color" "white"
        , style "padding" "1rem 1.5rem"
        , style "box-shadow" "0 2px 4px rgba(0,0,0,0.1)"
        , style "display" "flex"
        , style "align-items" "center"
        , style "gap" "1rem"
        ]
        [ img
            [ src "logo.svg"
            , alt "Modulista Logo"
            , style "height" "32px"
            , style "width" "32px"
            ]
            []
        , h1
            [ style "margin" "0"
            , style "font-size" "1.5rem"
            , style "font-weight" "600"
            ]
            [ text "Modulista" ]
        ]
