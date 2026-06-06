module View.Home exposing (view)

import Html exposing (..)
import Html.Attributes exposing (style, src, alt, class)
import Html.Events exposing (onClick)
import Types exposing (Msg(..))

view : Html Msg
view =
    div
        [ style "display" "flex"
        , style "flex-direction" "column"
        , style "align-items" "center"
        , style "justify-content" "center"
        , style "height" "100vh"
        , style "background-color" "#f0f2f5"
        ]
        [ div
            [ style "background" "white"
            , style "padding" "3rem"
            , style "border-radius" "1rem"
            , style "box-shadow" "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            , style "display" "flex"
            , style "flex-direction" "column"
            , style "align-items" "center"
            , style "gap" "2rem"
            , style "width" "100%"
            , style "max-width" "400px"
            ]
            [ img
                [ src "logo.svg"
                , alt "Modulista Logo"
                , style "height" "80px"
                , style "width" "80px"
                ]
                []
            , h1
                [ style "margin" "0"
                , style "font-size" "2.5rem"
                , style "color" "#2563EB"
                , style "font-weight" "700"
                ]
                [ text "Modulista" ]
            , div
                [ style "display" "flex"
                , style "flex-direction" "column"
                , style "gap" "1rem"
                , style "width" "100%"
                ]
                [ button
                    [ onClick CreateDatabase
                    , style "padding" "1rem"
                    , style "background-color" "#10B981"
                    , style "color" "white"
                    , style "border" "none"
                    , style "border-radius" "0.5rem"
                    , style "font-size" "1.1rem"
                    , style "font-weight" "600"
                    , style "cursor" "pointer"
                    , style "transition" "background-color 0.2s"
                    , style "display" "flex"
                    , style "align-items" "center"
                    , style "justify-content" "center"
                    , style "gap" "0.5rem"
                    ]
                    [ span [ class "material-symbols-outlined" ] [ text "add_circle" ]
                    , text "Criar banco de dados"
                    ]
                , button
                    [ onClick OpenDatabase
                    , style "padding" "1rem"
                    , style "background-color" "#2563EB"
                    , style "color" "white"
                    , style "border" "none"
                    , style "border-radius" "0.5rem"
                    , style "font-size" "1.1rem"
                    , style "font-weight" "600"
                    , style "cursor" "pointer"
                    , style "transition" "background-color 0.2s"
                    , style "display" "flex"
                    , style "align-items" "center"
                    , style "justify-content" "center"
                    , style "gap" "0.5rem"
                    ]
                    [ span [ class "material-symbols-outlined" ] [ text "file_open" ]
                    , text "Abrir banco de dados"
                    ]
                ]
            ]
        ]
