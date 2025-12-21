module Main exposing (main)

import Browser
import Html exposing (Html, div, h1, p, text, button)
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
        [ div []
            [ h1 [] [ text "Bem-vindo ao Modulista (Elm)" ]
            , p [] [ text "Este é um ambiente de desenvolvimento Elm configurado via Containerfile." ]
            , div []
                [ button [ onClick Decrement ] [ text "-" ]
                , text (" " ++ String.fromInt model.count ++ " ")
                , button [ onClick Increment ] [ text "+" ]
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
