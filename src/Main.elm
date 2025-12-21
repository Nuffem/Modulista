module Main exposing (main)

import Browser
import Html exposing (Html, div, h1, p, text, button, header, main_)
import Html.Attributes exposing (style, class)
import Html.Events exposing (onClick)

-- MODEL

type alias Model =
    { count : Int }

initialModel : () -> ( Model, Cmd Msg )
initialModel _ =
    ( { count = 0 }, Cmd.none )

-- UPDATE

type Msg
    = Increment
    | Decrement

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment ->
            ( { model | count = model.count + 1 }, Cmd.none )

        Decrement ->
            ( { model | count = model.count - 1 }, Cmd.none )

-- VIEW

view : Model -> Browser.Document Msg
view model =
    { title = "Modulista SPA"
    , body =
        [ div [ style "display" "flex", style "flex-direction" "column", style "min-height" "100vh", style "font-family" "sans-serif" ]
            [ header
                [ style "background-color" "#2563EB" -- Royal Blue
                , style "color" "white"
                , style "padding" "1rem 1.5rem"
                , style "box-shadow" "0 2px 4px rgba(0,0,0,0.1)"
                , style "display" "flex"
                , style "align-items" "center"
                ]
                [ h1
                    [ style "margin" "0"
                    , style "font-size" "1.5rem"
                    , style "font-weight" "600"
                    ]
                    [ text "Modulista" ]
                ]
            , main_
                [ style "padding" "2rem"
                , style "flex" "1"
                , style "background-color" "#F3F4F6"
                ]
                [ div [ style "background" "white", style "padding" "2rem", style "border-radius" "0.5rem", style "box-shadow" "0 1px 3px rgba(0,0,0,0.1)" ]
                    [ h1 [ style "margin-top" "0", style "color" "#111827" ] [ text "Bem-vindo ao Modulista (Elm)" ]
                    , p [ style "color" "#4B5563" ] [ text "Este é um ambiente de desenvolvimento Elm configurado via Containerfile." ]
                    , div [ style "margin-top" "1.5rem", style "display" "flex", style "align-items" "center", style "gap" "1rem" ]
                        [ button
                            [ onClick Decrement
                            , style "padding" "0.5rem 1rem"
                            , style "background-color" "#E5E7EB"
                            , style "border" "none"
                            , style "border-radius" "0.25rem"
                            , style "cursor" "pointer"
                            , style "font-size" "1rem"
                            , style "font-weight" "bold"
                            , style "color" "#374151"
                            ]
                            [ text "-" ]
                        , text (String.fromInt model.count)
                        , button
                            [ onClick Increment
                            , style "padding" "0.5rem 1rem"
                            , style "background-color" "#E5E7EB"
                            , style "border" "none"
                            , style "border-radius" "0.25rem"
                            , style "cursor" "pointer"
                            , style "font-size" "1rem"
                            , style "font-weight" "bold"
                            , style "color" "#374151"
                            ]
                            [ text "+" ]
                        ]
                    ]
                ]
            ]
        ]
    }

-- MAIN

main : Program () Model Msg
main =
    Browser.document
        { init = initialModel
        , view = view
        , update = update
        , subscriptions = \_ -> Sub.none
        }
