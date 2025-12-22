module Main exposing (main)

import Browser
import Types exposing (Model, Msg)
import State
import View

main : Program () Model Msg
main =
    Browser.application
        { init = State.init
        , view = View.view
        , update = State.update
        , subscriptions = State.subscriptions
        , onUrlChange = Types.UrlChanged
        , onUrlRequest = Types.LinkClicked
        }
