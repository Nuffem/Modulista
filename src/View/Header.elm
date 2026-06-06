module View.Header exposing (view)

import Html exposing (..)
import Html.Attributes exposing (style, src, alt, class)
import Html.Events exposing (onClick)
import Types exposing (Msg(..))

view : Maybe String -> Html Msg
view maybeDatabaseName =
    header
        [ style "background-color" "#2563EB" -- Royal Blue
        , style "color" "white"
        , style "padding" "1rem 1.5rem"
        , style "box-shadow" "0 2px 4px rgba(0,0,0,0.1)"
        , style "display" "flex"
        , style "align-items" "center"
        , style "justify-content" "space-between"
        ]
        [ div [ style "display" "flex", style "align-items" "center", style "gap" "1rem" ]
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
        , div [ style "display" "flex", style "align-items" "center", style "gap" "1rem" ]
            [ case maybeDatabaseName of
                Just name ->
                    div [ style "display" "flex", style "align-items" "center", style "gap" "1rem" ]
                        [ div [ style "display" "flex", style "align-items" "center", style "gap" "0.5rem", style "background" "rgba(255,255,255,0.1)", style "padding" "0.5rem 1rem", style "border-radius" "2rem" ]
                            [ span [ class "material-symbols-outlined", style "font-size" "1.2rem" ] [ text "database" ]
                            , span [ style "font-weight" "500" ] [ text name ]
                            ]
                        , button
                            [ onClick Logout
                            , style "background" "none"
                            , style "border" "1px solid white"
                            , style "color" "white"
                            , style "padding" "0.4rem 1rem"
                            , style "border-radius" "0.375rem"
                            , style "cursor" "pointer"
                            , style "font-family" "inherit"
                            , style "font-size" "0.9rem"
                            , style "transition" "all 0.2s"
                            ]
                            [ text "Sair" ]
                        ]

                Nothing ->
                    text ""
            ]
        ]
